// Composes native model/storage clients and per-run sandbox lifecycle behind trusted callers.
import { createOpenAI } from '@ai-sdk/openai';
import type { PostgresStore } from '@mastra/pg';
import { createFileService } from '@/files/service.ts';
import { generateResponse } from './agent.ts';
import {
  RuntimeExecutionError,
  RuntimeUnavailableError,
} from './errors.ts';
import { createMastraStorage } from './storage.ts';
import type {
  RunResult,
  Runtime,
  RuntimeDependencies,
} from './types.ts';
import { RunWorkspace } from './workspace.ts';

export { RuntimeExecutionError, RuntimeUnavailableError } from './errors.ts';
export { createMastraStorage } from './storage.ts';
export type { RunInput, RunResult, Runtime, TrustedScope } from './types.ts';

/**
 * Builds lazy SDK-backed infrastructure without performing a paid call.
 * @throws If native GCS client construction fails.
 */
export const createRuntime = ({ config, files: repository, results }: RuntimeDependencies): Runtime => {
  const files = createFileService(repository, config.gcsBucketName);
  const openai = config.openaiApiKey
    ? createOpenAI({ apiKey: config.openaiApiKey })
    : undefined;
  let storage: PostgresStore | undefined;

  return {
    files,
    /** @throws {RuntimeExecutionError} If migrated native framework tables cannot be read. */
    initialize: async () => {
      storage ??= createMastraStorage(config.databaseUrl);
      try {
        const memory = await storage.getStore('memory');
        if (!memory) {
          throw new RuntimeExecutionError('Native runtime storage is unavailable.');
        }
        // Deployment migrations own DDL; the runtime role only verifies access to existing tables.
        await memory.getThreadById({ threadId: '__runtime_readiness__' });
      } catch (err) {
        throw new RuntimeExecutionError('Runtime storage initialization failed.', { cause: err });
      }
    },
    /** @throws {RuntimeExecutionError} If execution, required persistence, or sandbox cleanup fails. */
    execute: async input => {
      if (!config.openaiApiKey) {
        throw new RuntimeUnavailableError('Model execution is not configured.');
      }
      if (input.sandbox && (!config.e2bApiKey || !config.gcsBucketName)) {
        throw new RuntimeUnavailableError('Sandbox execution and retained-file storage must be configured.');
      }
      if (!input.sandbox && input.restoreFileIds?.length) {
        throw new RuntimeExecutionError('Retained-file restoration requires sandbox execution.');
      }

      const workspace = new RunWorkspace(input, files, config.e2bApiKey, config.sandboxTimeoutMs ?? 120_000);
      let outcome: { result: RunResult } | { error: Error };
      try {
        const restoredFiles = await workspace.restoreSelectedFiles();
        const response = await generateResponse(input, openai, workspace, restoredFiles);
        workspace.assertPersistenceSucceeded();
        const result = {
          text: response.text,
          usage: response.usage,
          files: workspace.retainedFiles,
          sandboxId: workspace.sandboxId,
        };
        await results.save(input, result);

        outcome = { result };
      } catch (err) {
        const error = err instanceof RuntimeUnavailableError || err instanceof RuntimeExecutionError
          ? err
          : new RuntimeExecutionError('Required runtime result persistence failed.', { cause: err });
        outcome = { error };
      }

      try {
        await workspace.close();
      } catch (cleanupError) {
        if ('error' in outcome) {
          throw new AggregateError([outcome.error, cleanupError], 'Runtime execution and sandbox cleanup failed.');
        }

        throw cleanupError;
      }
      if ('error' in outcome) {
        throw outcome.error;
      }

      return outcome.result;
    },
    /** @throws {RuntimeExecutionError} If native framework storage cannot close. */
    close: async () => {
      try {
        await storage?.close();
      } catch (err) {
        throw new RuntimeExecutionError('Runtime storage shutdown failed.', { cause: err });
      }
    },
  };
};
