// Proves native Mastra ownership and round-trip state alongside application migrations.
import { randomUUID } from 'node:crypto';
import {
  describe,
  expect,
  it,
} from 'vitest';
import { loadConfig } from '@/config.ts';
import { createStore } from '@/db/store.ts';
import { createRuntime } from '@/runtime/index.ts';
import { createMastraStorage } from '@/runtime/storage.ts';

describe('native Mastra PostgreSQL storage', () => {
  it('keeps native state across adapter replacement in its separately owned schema', async () => {
    const config = loadConfig();
    if (!config.databaseUrl) {
      throw new Error('The disposable integration database is required.');
    }
    const storage = createMastraStorage(config.databaseUrl, 'migration');
    const replacement = createMastraStorage(config.databaseUrl, 'migration');
    const application = createStore(config.databaseUrl, 'native-storage-integration');
    const id = randomUUID();
    const scope = { accountId: 'native-storage-account', channelId: 'native-storage-channel' };
    const createdAt = new Date('2026-01-01T00:00:00.000Z');
    try {
      await storage.init();
      const memory = await storage.getStore('memory');
      if (!memory) {
        throw new Error('The installed native adapter must supply memory storage.');
      }
      await memory.saveThread({
        thread: {
          id,
          resourceId: scope.accountId,
          title: 'Synthetic native storage test',
          metadata: { channelId: scope.channelId },
          createdAt,
          updatedAt: createdAt,
        },
      });
      await application.createRun({ runId: id, prompt: 'Synthetic native storage test', scope }, 'foreground');
      await replacement.init();
      const replacementMemory = await replacement.getStore('memory');
      const thread = await replacementMemory?.getThreadById({ threadId: id, resourceId: scope.accountId });

      expect(thread).toMatchObject({
        id,
        resourceId: scope.accountId,
        createdAt,
        metadata: { channelId: scope.channelId },
      });
      expect((await application.getRun(id, scope))?.id).toBe(id);
      const tables = await storage.db.any<{ table_schema: string, table_name: string }>(
        "SELECT table_schema, table_name FROM information_schema.tables WHERE table_name IN ('mastra_threads', 'analysis_runs') ORDER BY table_name",
      );
      expect(tables).toEqual([
        { table_schema: 'public', table_name: 'analysis_runs' },
        { table_schema: 'mastra', table_name: 'mastra_threads' },
      ]);
    } finally {
      await Promise.all([storage.close(), replacement.close(), application.close()]);
    }
  });

  it('verifies migrated framework storage with a DML-only runtime role', async () => {
    const config = loadConfig();
    if (!config.databaseUrl) {
      throw new Error('The disposable integration database is required.');
    }
    const migration = createMastraStorage(config.databaseUrl, 'migration');
    const roleName = `runtime_${randomUUID().replaceAll('-', '')}`;
    const runtimeUrl = new URL(config.databaseUrl);
    runtimeUrl.username = roleName;
    runtimeUrl.password = 'synthetic-runtime-password';
    try {
      await migration.init();
      // The generated role name contains only ASCII letters, digits, and underscores.
      await migration.db.none(`CREATE ROLE "${roleName}" LOGIN PASSWORD 'synthetic-runtime-password'`);
      await migration.db.none(`GRANT USAGE ON SCHEMA public, mastra TO "${roleName}"`);
      await migration.db.none(
        `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public, mastra TO "${roleName}"`,
      );
      await migration.db.none(`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public, mastra TO "${roleName}"`);
      const application = createStore(runtimeUrl.toString(), 'limited-native-role');
      const runtime = createRuntime({
        config: { databaseUrl: runtimeUrl.toString() },
        files: application.files,
        results: application.results,
      });
      const nativeRuntime = createMastraStorage(runtimeUrl.toString());
      try {
        await runtime.initialize();
        const memory = await nativeRuntime.getStore('memory');
        expect(await memory?.getThreadById({ threadId: 'missing-thread' })).toBeNull();
        await expect(nativeRuntime.db.none('CREATE TABLE mastra.runtime_forbidden_ddl (id TEXT)')).rejects
          .toMatchObject({ code: '42501' });
      } finally {
        await Promise.all([runtime.close(), nativeRuntime.close(), application.close()]);
      }
    } finally {
      await migration.close();
    }
  });
});
