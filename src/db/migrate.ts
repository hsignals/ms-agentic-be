// Initializes Drizzle application tables and native Mastra tables under their separate owners.

import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { loadConfig } from '../config';
import { createLogger } from '../logger';
import { createMastraStorage } from '../runtime/storage';

const config = loadConfig();
const logger = createLogger(config);
if (config.databaseUrl === undefined) {
  throw new Error('DATABASE_URL is required for storage initialization');
}
const client = postgres(config.databaseUrl, { max: 1, connect_timeout: 5 });
const storage = createMastraStorage(config.databaseUrl, 'migration');
try {
  await migrate(drizzle(client), { migrationsFolder: new URL('../../drizzle', import.meta.url).pathname });
  await storage.init();
  logger.info({ event: 'storage.migrated', owners: ['application', 'mastra'] });
} catch (error) {
  logger.error({ event: 'storage.migration_failed', err: error });
  process.exitCode = 1;
} finally {
  await Promise.all([client.end({ timeout: 5 }), storage.close()]);
}
