// Owns application records and file metadata; object transfer and native Mastra storage have separate owners.

import {
  and,
  eq,
  isNotNull,
  ne,
  sql,
} from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import type { FileMetadataRepository } from '../files/types';
import type {
  RunInput,
  RunResult,
  RunResultRepository,
  TrustedScope,
} from '../runtime/types';
import {
  retainedFiles,
  runs,
} from './schema';

/** The execution state persisted independently of a queue's process lifetime. */
export type RunStatus = 'queued' | 'running' | 'completed' | 'failed';

/** A durable run and its channel-private result. */
export type RunRecord = {
  id: string;
  accountId: string;
  channelId: string;
  mode: 'foreground' | 'background';
  status: RunStatus;
  result: RunResult | null;
  errorCode: string | null;
  deploymentId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

/** Narrow persistence boundary shared by routes, the queue processor, and retained-file transfer. */
export interface ApplicationStore {
  files: FileMetadataRepository;
  results: RunResultRepository;
  createRun(input: RunInput, mode: 'foreground' | 'background'): Promise<void>;
  setRunning(input: RunInput): Promise<void>;
  completeRun(input: RunInput): Promise<void>;
  failRun(runId: string, scope: TrustedScope, errorCode: string): Promise<void>;
  getRun(runId: string, scope: TrustedScope): Promise<RunRecord | undefined>;
  check(): Promise<void>;
  close(): Promise<void>;
}

/** Creates one lazy native PostgreSQL client. @throws Error for an invalid connection URL. */
export const createStore = (databaseUrl: string, deploymentId = 'local'): ApplicationStore => {
  const client = postgres(databaseUrl, { max: 5, connect_timeout: 5, idle_timeout: 20 });
  const db = drizzle(client);

  /** Restricts every run write and read to its original trusted identity. It does not throw. */
  const runScope = (runId: string, scope: TrustedScope) =>
    and(
      eq(runs.id, runId),
      eq(runs.accountId, scope.accountId),
      eq(runs.channelId, scope.channelId),
    );

  return {
    /** Creates the parent record before files can reference it. @throws Error on database failure. */
    createRun: async (input, mode) => {
      await db.insert(runs).values({
        id: input.runId,
        accountId: input.scope.accountId,
        channelId: input.scope.channelId,
        mode,
        status: mode === 'background'
          ? 'queued'
          : 'running',
      });
    },
    /** Records a fresh attempt. @throws Error on database failure. */
    setRunning: async input => {
      await db.update(runs).set({ status: 'running', errorCode: null, deploymentId, updatedAt: new Date() }).where(
        runScope(input.runId, input.scope),
      );
    },
    /** Saves required output before the runtime destroys its workspace. @throws Error on missing ownership or database failure. */
    results: {
      save: async (input, result) => {
        const updated = await db.update(runs).set({
          result,
          errorCode: null,
          deploymentId,
          updatedAt: new Date(),
        })
          .where(runScope(input.runId, input.scope)).returning({ id: runs.id });
        if (updated.length === 0) {
          throw new Error('Run ownership missing');
        }
      },
    },
    /** Marks output complete after runtime cleanup. @throws Error if required output is absent or the write fails. */
    completeRun: async input => {
      const updated = await db.update(runs).set({ status: 'completed', updatedAt: new Date() })
        .where(and(runScope(input.runId, input.scope), isNotNull(runs.result))).returning({ id: runs.id });
      if (updated.length === 0) {
        throw new Error('Required run result missing');
      }
    },
    /** Records safe failure codes while preserving completed output. @throws Error on database failure. */
    failRun: async (runId, scope, errorCode) => {
      await db.update(runs).set({ status: 'failed', errorCode, updatedAt: new Date() })
        .where(and(runScope(runId, scope), ne(runs.status, 'completed')));
    },
    /** Returns only a run in the exact account/channel binding. @throws Error on database failure. */
    getRun: async (runId, scope) => {
      const [record] = await db.select().from(runs).where(runScope(runId, scope)).limit(1);
      if (record?.result !== null && record?.result !== undefined) {
        record.result.files = record.result.files.map(file => ({
          ...file,
          savedAt: new Date(file.savedAt),
          retrievedAt: file.retrievedAt === null
            ? null
            : new Date(file.retrievedAt),
          sourceAsOf: file.sourceAsOf === null
            ? null
            : new Date(file.sourceAsOf),
        }));
      }
      return record;
    },
    /** Reads metadata for the trusted file service, which authorizes before object IO. @throws Error on database failure. */
    files: {
      /** Saves retention metadata. @throws Error on database or foreign-key failure. */
      save: async file => {
        await db.insert(retainedFiles).values(file);
      },
      get: async id => {
        const [file] = await db.select().from(retainedFiles).where(eq(retainedFiles.id, id)).limit(1);
        return file;
      },
      /** Records an authorized retrieval instant. @throws Error on database failure. */
      recordRetrieval: async (id, at) => {
        await db.update(retainedFiles).set({ retrievedAt: at }).where(eq(retainedFiles.id, id));
      },
    },
    /** Probes database connectivity. @throws Error when the database is unavailable. */
    check: async () => {
      await db.execute(sql`select 1`);
    },
    /** Closes this process's client pool. @throws Error when closing fails. */
    close: async () => {
      await client.end({ timeout: 5 });
    },
  };
};
