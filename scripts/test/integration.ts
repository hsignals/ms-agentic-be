// Runs local integration tests against invocation-owned TimescaleDB and Valkey resources.
import {
  runTestProject,
  buildTestEnvironment,
} from './environment.ts';
import {
  assertDockerAvailable,
  runDocker,
  TestResources,
} from './docker.ts';

assertDockerAvailable();
const resources = new TestResources();
try {
  const postgres = resources.start('postgres', [
    '--publish',
    '127.0.0.1::5432',
    '--env',
    'POSTGRES_USER=test',
    '--env',
    'POSTGRES_PASSWORD=test',
    '--env',
    'POSTGRES_DB=test',
    'timescale/timescaledb:2.24.0-pg17',
  ]);
  const valkey = resources.start('valkey', [
    '--publish',
    '127.0.0.1::6379',
    'valkey/valkey:8.1.6-alpine',
    'valkey-server',
    '--appendonly',
    'yes',
    '--appendfsync',
    'everysec',
    '--maxmemory-policy',
    'noeviction',
  ]);
  await Promise.all([
    // PostgreSQL's temporary initialization server uses Unix sockets before the target database exists.
    resources.waitForCommand(postgres, [
      'env',
      'PGPASSWORD=test',
      'psql',
      '--host',
      '127.0.0.1',
      '--username',
      'test',
      '--dbname',
      'test',
      '--no-password',
      '--set',
      'ON_ERROR_STOP=1',
      '--command',
      'SELECT 1',
    ]),
    resources.waitForCommand(valkey, ['valkey-cli', 'ping']),
  ]);
  runDocker([
    'exec',
    postgres,
    'psql',
    '-U',
    'test',
    '-d',
    'test',
    '-v',
    'ON_ERROR_STOP=1',
    '-c',
    'CREATE EXTENSION IF NOT EXISTS timescaledb;',
  ]);
  const environment = {
    DATABASE_URL: `postgresql://test:test@127.0.0.1:${resources.getPort(postgres, 5432)}/test`,
    REDIS_URL: `redis://127.0.0.1:${resources.getPort(valkey, 6379)}`,
  };
  const migration = Bun.spawn([process.execPath, '--no-env-file', 'run', 'src/db/migrate.ts'], {
    env: buildTestEnvironment(environment),
    stdout: 'inherit',
    stderr: 'inherit',
  });
  const migrationExit = await migration.exited;
  if (migrationExit !== 0) {
    throw new Error(`Disposable database initialization failed (${migrationExit})`);
  }
  process.exitCode = await runTestProject('integration', environment);
} finally {
  resources.cleanup();
}
