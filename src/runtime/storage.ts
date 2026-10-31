// Owns native Mastra PostgreSQL tables separately from application migrations.
import { noopLogger } from '@mastra/core/logger';
import { PostgresStore } from '@mastra/pg';
import { RuntimeUnavailableError } from './errors.ts';

/**
 * Returns the native adapter; only the migration role initializes its schema.
 * @throws {RuntimeUnavailableError} If the database is not configured.
 * @throws If the native adapter rejects its configuration.
 */
export const createMastraStorage = (
  databaseUrl: string | undefined,
  mode: 'runtime' | 'migration' = 'runtime',
): PostgresStore => {
  if (!databaseUrl) {
    throw new RuntimeUnavailableError('Runtime database storage is not configured.');
  }

  const storage = new PostgresStore({
    id: 'runtime-storage',
    connectionString: databaseUrl,
    schemaName: 'mastra',
    disableInit: mode === 'runtime',
  });
  // Application logs report fixed errors; framework logs must not serialize raw SDK requests.
  storage.__setLogger(noopLogger);

  return storage;
};
