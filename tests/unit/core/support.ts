// In-memory application dependencies for route-boundary tests, without provider calls.

import type {
  ApplicationStore,
  RunRecord,
} from '../../../src/db/store';
import type {
  RunInput,
  RunResult,
  Runtime,
} from '../../../src/runtime/types';
import type { ApplicationServices } from '../../../src/services';

export const buildFixture = () => {
  const inputs: RunInput[] = [];
  const submitted: RunInput[] = [];
  const records = new Map<string, RunRecord>();
  let shouldFail = false;
  const result: RunResult = { text: 'answer', files: [], usage: null, sandboxId: null };
  const store: ApplicationStore = {
    files: { save: async () => {}, get: async () => undefined, recordRetrieval: async () => {} },
    results: { save: async () => {} },
    createRun: async (input, mode) => {
      records.set(input.runId, {
        id: input.runId,
        accountId: input.scope.accountId,
        channelId: input.scope.channelId,
        status: mode === 'background' ? 'queued' : 'running',
        mode,
        result: null,
        errorCode: null,
        deploymentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    },
    setRunning: async () => {},
    completeRun: async input => {
      const record = records.get(input.runId);
      if (record !== undefined) {
        record.status = 'completed';
      }
    },
    failRun: async (id, scope, errorCode) => {
      const record = records.get(id);
      if (record !== undefined && record.accountId === scope.accountId && record.channelId === scope.channelId) {
        record.status = 'failed';
        record.errorCode = errorCode;
      }
    },
    getRun: async (id, scope) => {
      const record = records.get(id);
      return record?.accountId === scope.accountId && record.channelId === scope.channelId ? record : undefined;
    },
    check: async () => {},
    close: async () => {},
  };
  const runtime: Runtime = {
    files: {
      get: async () => undefined,
      read: async () => undefined,
      save: async () => {
        throw new Error('Unused');
      },
    },
    initialize: async () => {},
    close: async () => {},
    execute: async input => {
      inputs.push(input);
      if (shouldFail) {
        throw new Error('private prompt SECRET');
      }
      return result;
    },
  };
  const services: ApplicationServices = {
    store,
    runtime,
    queue: {
      submit: async input => {
        submitted.push(input);
      },
      getState: async () => undefined,
      check: async () => {},
      close: async () => {},
    },
    readiness: async () => ({ ready: true, missing: [], dependencies: { database: true, queue: true, runtime: true } }),
  };
  return {
    inputs,
    submitted,
    records,
    store,
    runtime,
    services,
    result,
    fail: () => {
      shouldFail = true;
    },
  };
};
