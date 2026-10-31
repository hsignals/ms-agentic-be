// Owns synthetic process inputs for local checks; developer credential files are never loaded.

/** Builds only the environment needed to run checks and disposable local tests. */
export const buildTestEnvironment = (overrides: Record<string, string> = {}): Record<string, string> => {
  const environment: Record<string, string> = {
    PATH: process.env.PATH ?? '/usr/local/bin:/usr/bin:/bin',
    NODE_ENV: 'test',
    LOG_LEVEL: 'silent',
    DATABASE_URL: 'postgresql://test:test@127.0.0.1:1/test',
    REDIS_URL: 'redis://127.0.0.1:1',
    OPENAI_API_KEY: 'test-openai-key',
    E2B_API_KEY: 'test-e2b-key',
    GCS_BUCKET_NAME: 'test-agentic-files',
    STAGING_AUTH_TOKEN: 'synthetic-staging-token-for-local-tests-only',
    STAGING_ACCOUNT_ID: 'test-account',
    STAGING_CHANNEL_ID: 'test-channel',
    DEPLOYMENT_ID: 'local-test',
    PORT: '8080',
    ...overrides,
  };
  for (const name of ['CI', 'TERM', 'NO_COLOR', 'FORCE_COLOR', 'TMPDIR']) {
    const value = process.env[name];
    if (value !== undefined) {
      environment[name] = value;
    }
  }

  return environment;
};

/** Runs a Vitest project with explicit synthetic inputs and returns its exit status. */
export const runTestProject = async (project: string, overrides: Record<string, string> = {}): Promise<number> => {
  const child = Bun.spawn([
    'node',
    'node_modules/vitest/vitest.mjs',
    'run',
    '--project',
    project,
    ...process.argv.slice(2),
  ], {
    env: buildTestEnvironment(overrides),
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
  });
  const stop = (): void => {
    child.kill('SIGTERM');
  };
  process.prependOnceListener('SIGINT', stop);
  process.prependOnceListener('SIGTERM', stop);
  try {
    return await child.exited;
  } finally {
    process.removeListener('SIGINT', stop);
    process.removeListener('SIGTERM', stop);
  }
};
