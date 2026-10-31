// Uses disposable PostgreSQL and Valkey to prove scoped durable output and native retry ceilings.

import { setTimeout as delay } from 'node:timers/promises';
import { Worker } from 'bullmq';
import type {
  Job,
  WorkerOptions,
} from 'bullmq';
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
} from 'vitest';
import { loadConfig } from '../../src/config';
import { createStore } from '../../src/db/store';
import type { ApplicationStore } from '../../src/db/store';
import { createApp } from '../../src/http/app';
import {
  ANALYSIS_QUEUE,
  createAnalysisWorker,
  createQueue,
  MAX_JOB_ATTEMPTS,
} from '../../src/jobs/queue';
import type { QueueInfrastructure } from '../../src/jobs/queue';
import { createLogger } from '../../src/logger';
import type {
  RunInput,
  RunResult,
  Runtime,
} from '../../src/runtime/types';

const config = loadConfig();
const logger = createLogger(config);
const result: RunResult = {
  text: '42',
  files: [],
  usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2, reasoningTokens: 0 },
  sandboxId: null,
};
const scope = { accountId: 'integration-account', channelId: 'integration-channel' };
let store: ApplicationStore;

const buildInput = (): RunInput => ({
  runId: crypto.randomUUID(),
  prompt: 'synthetic calculation',
  scope: { ...scope },
  sandbox: false,
});

const buildRuntime = (execute: (input: RunInput) => Promise<RunResult>): Runtime => ({
  execute,
  initialize: async () => {},
  close: async () => {},
  files: {
    get: async () => undefined,
    read: async () => undefined,
    save: async () => {
      throw new Error('Unused');
    },
  },
});

const waitForState = async (job: Job, state: string): Promise<void> => {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    if (await job.getState() === state) {
      return;
    }
    await delay(30);
  }
  throw new Error(`Job did not reach ${state}; observed ${await job.getState()}`);
};

beforeAll(() => {
  if (config.databaseUrl === undefined || config.redisUrl === undefined) {
    throw new Error('Disposable integration services are required');
  }
  store = createStore(config.databaseUrl, 'integration-worker');
});
afterAll(async () => {
  await store?.close();
});

describe('application PostgreSQL persistence', () => {
  it('keeps completion after client replacement and refuses other channel/account reads and writes', async () => {
    const input = buildInput();
    await store.createRun(input, 'background');
    await store.setRunning(input);
    await store.results.save(input, result);
    expect((await store.getRun(input.runId, scope))?.status).toBe('running');
    await store.completeRun(input);
    expect(await store.getRun(input.runId, { ...scope, channelId: 'other' })).toBeUndefined();
    expect(await store.getRun(input.runId, { ...scope, accountId: 'other' })).toBeUndefined();
    await expect(store.results.save({ ...input, scope: { ...scope, accountId: 'other' } }, result)).rejects.toThrow(
      'ownership',
    );
    const replacement = createStore(config.databaseUrl ?? '', 'replacement');
    try {
      const persisted = await replacement.getRun(input.runId, scope);
      expect(persisted?.status).toBe('completed');
      expect(persisted?.result?.text).toBe('42');
      expect(persisted?.deploymentId).toBe('integration-worker');
    } finally {
      await replacement.close();
    }
  });

  it('saves original file ownership, evidence freshness, size, and retrieval time', async () => {
    const input = buildInput();
    await store.createRun(input, 'foreground');
    const savedAt = new Date('2026-01-01T00:00:00.000Z');
    const file = {
      id: crypto.randomUUID(),
      accountId: scope.accountId,
      channelId: scope.channelId,
      runId: input.runId,
      dataType: 'synthetic',
      access: 'accountEvidence' as const,
      provider: null,
      connectionId: null,
      savedAt,
      retrievedAt: null,
      sourceAsOf: null,
      sizeBytes: 3,
      storageReference: 'gs://synthetic-bucket/synthetic-object',
      name: 'calculation.txt',
      contentType: 'text/plain',
    };
    await store.files.save(file);
    const retrievedAt = new Date('2026-01-02T00:00:00.000Z');
    await store.files.recordRetrieval(file.id, retrievedAt);
    expect(await store.files.get(file.id)).toEqual({ ...file, retrievedAt });
    await expect(store.files.save({ ...file, id: crypto.randomUUID(), runId: crypto.randomUUID() })).rejects.toThrow();
  });

  it('returns failed HTTP completion when required output cannot be persisted', async () => {
    const runtime = buildRuntime(async () => {
      throw new Error('Required persistence failed');
    });
    const app = createApp(config, {
      store,
      runtime,
      queue: undefined,
      readiness: async () => ({
        ready: false,
        missing: [],
        dependencies: { database: true, queue: false, runtime: true },
      }),
    }, logger);
    const response = await app.request('/v1/runs', {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.stagingAuthToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'synthetic' }),
    });
    expect(response.status).toBe(502);
    const body = await response.json() as { runId: string };
    expect(
      (await store.getRun(body.runId, { accountId: config.stagingAccountId, channelId: config.stagingChannelId }))
        ?.status,
    ).toBe('failed');
  });
});

describe('BullMQ whole-job attempt ceiling', () => {
  it('keeps HTTP polling nonterminal during a retry and then returns the saved completion', async () => {
    const infrastructure = createQueue(config, logger, 'worker');
    let calls = 0;
    const runtime = buildRuntime(async input => {
      calls++;
      if (calls === 1) {
        throw new Error('temporary');
      }
      await store.results.save(input, result);
      return result;
    });
    const worker = createAnalysisWorker({ config, infrastructure, runtime, store, logger });
    try {
      const input = {
        ...buildInput(),
        scope: { accountId: config.stagingAccountId, channelId: config.stagingChannelId },
      };
      await store.createRun(input, 'background');
      await infrastructure.submit(input);
      const job = await infrastructure.queue.getJob(input.runId);
      expect(job).toBeDefined();
      if (job === undefined) { throw new Error('Missing job'); }
      await waitForState(job, 'delayed');
      const app = createApp(config, {
        store,
        runtime,
        queue: infrastructure,
        readiness: async () => ({
          ready: true,
          missing: [],
          dependencies: { database: true, queue: true, runtime: true },
        }),
      }, logger);
      const headers = { Authorization: `Bearer ${config.stagingAuthToken}` };
      const retryResponse = await app.request(`/v1/jobs/${input.runId}`, { headers });
      expect(retryResponse.status).toBe(200);
      expect((await retryResponse.json() as { status: string }).status).toBe('running');
      await waitForState(job, 'completed');
      expect(calls).toBe(MAX_JOB_ATTEMPTS);
      const completedResponse = await app.request(`/v1/jobs/${input.runId}`, { headers });
      expect((await completedResponse.json() as { status: string }).status).toBe('completed');
    } finally {
      await worker.close();
      await infrastructure.close();
    }
  });

  it('reuses a completed run after queue recovery without invoking paid execution', async () => {
    const infrastructure = createQueue(config, logger, 'worker');
    const input = buildInput();
    await store.createRun(input, 'background');
    await store.results.save(input, result);
    await store.completeRun(input);
    const savedRun = await store.getRun(input.runId, scope);
    let calls = 0;
    const worker = createAnalysisWorker({
      config,
      infrastructure,
      store,
      logger,
      runtime: buildRuntime(async () => {
        calls++;
        throw new Error('Completed work must not run again');
      }),
    });
    try {
      await infrastructure.submit(input);
      const job = await infrastructure.queue.getJob(input.runId);
      if (job === undefined) { throw new Error('Missing job'); }
      await waitForState(job, 'completed');
      expect(calls).toBe(0);
      expect((await infrastructure.queue.getJob(input.runId))?.returnvalue).toEqual({ runId: input.runId });
      expect(await store.getRun(input.runId, scope)).toEqual(savedRun);
    } finally {
      await worker.close();
      await infrastructure.close();
    }
  });

  it('preserves completed PostgreSQL output when the final queue attempt fails before acknowledgement', async () => {
    const infrastructure = createQueue(config, logger, 'worker');
    const input = buildInput();
    await store.createRun(input, 'background');
    let calls = 0;
    const worker = createAnalysisWorker({
      config,
      infrastructure,
      store,
      logger,
      runtime: buildRuntime(async runInput => {
        calls++;
        if (calls === 2) {
          await store.results.save(runInput, result);
          await store.completeRun(runInput);
        }
        throw new Error('Simulated lost completion acknowledgement');
      }),
    });
    let settleTerminalWrite: () => void = () => {
      throw new Error('Terminal listener not installed');
    };
    let rejectTerminalWrite: (err: unknown) => void = () => {
      throw new Error('Terminal listener not installed');
    };
    const terminalWrite = new Promise<void>((resolve, reject) => {
      settleTerminalWrite = resolve;
      rejectTerminalWrite = reject;
    });
    // Observe the real failure writer after the production listener awaits native terminal state.
    const saveFailure = store.failRun;
    store.failRun = async (runId, runScope, errorCode) => {
      try {
        await saveFailure(runId, runScope, errorCode);
        if (runId === input.runId && await infrastructure.getState(runId) === 'failed') {
          settleTerminalWrite();
        }
      } catch (err) {
        rejectTerminalWrite(err);
        throw err;
      }
    };
    try {
      await infrastructure.submit(input);
      const job = await infrastructure.queue.getJob(input.runId);
      if (job === undefined) { throw new Error('Missing job'); }
      await waitForState(job, 'failed');
      const terminalTimeout = setTimeout(() => {
        rejectTerminalWrite(new Error('Terminal failure was not persisted'));
      }, 3000);
      try {
        await terminalWrite;
      } finally {
        clearTimeout(terminalTimeout);
      }
      expect(calls).toBe(2);
      expect((await infrastructure.queue.getJob(input.runId))?.attemptsStarted).toBe(2);
      const savedRun = await store.getRun(input.runId, scope);
      expect(savedRun?.status).toBe('completed');
      expect(savedRun?.result).toEqual(result);
      expect(savedRun?.errorCode).toBeNull();
    } finally {
      await worker.close();
      store.failRun = saveFailure;
      await infrastructure.close();
    }
  });

  it('counts one interrupted start and one failing start without running a third processor', async () => {
    const infrastructure: QueueInfrastructure = createQueue(config, logger, 'worker');
    const productionWorker = createAnalysisWorker({
      config,
      infrastructure,
      runtime: buildRuntime(async () => result),
      store,
      logger,
    });
    await productionWorker.close();
    // Replace the native 30-second test predecessor's checker lease with this test's short interval.
    await infrastructure.connection.del(productionWorker.toKey('stalled-check'));
    // Use the production policy with short native lock/check intervals for an interrupted worker.
    const options: WorkerOptions = {
      ...productionWorker.opts,
      connection: infrastructure.connection,
      autorun: false,
      lockDuration: 100,
      stalledInterval: 100,
    };
    const abandoned = new Worker<RunInput>(ANALYSIS_QUEUE, null, options);
    abandoned.on('error', () => {});
    const input = buildInput();
    await store.createRun(input, 'background');
    await infrastructure.submit(input);
    const first = await abandoned.getNextJob('abandoned', { block: false });
    expect(first?.id).toBe(input.runId);
    expect(first?.attemptsStarted).toBe(1);
    await abandoned.close(true);
    await delay(150);
    let calls = 0;
    const replacement = new Worker<RunInput>(ANALYSIS_QUEUE, async () => {
      calls++;
      throw new Error('Second attempt fails');
    }, { ...options, autorun: true });
    replacement.on('error', () => {});
    try {
      const job = await infrastructure.queue.getJob(input.runId);
      if (job === undefined) { throw new Error('Missing job'); }
      await waitForState(job, 'failed');
      const persisted = await infrastructure.queue.getJob(input.runId);
      expect(calls).toBe(1);
      expect(persisted?.attemptsStarted).toBe(2);
      expect(persisted?.attemptsMade).toBe(1);
      expect(productionWorker.opts.maxStartedAttempts).toBe(2);
      await delay(250);
      expect(calls).toBe(1);
    } finally {
      await replacement.close();
      await infrastructure.close();
    }
  });

  it('caps two ordinary failures at two total processor invocations', async () => {
    const infrastructure = createQueue(config, logger, 'worker');
    let calls = 0;
    const worker = createAnalysisWorker({
      config,
      infrastructure,
      store,
      logger,
      runtime: buildRuntime(async () => {
        calls++;
        throw new Error('temporary');
      }),
    });
    try {
      const input = buildInput();
      await store.createRun(input, 'background');
      await infrastructure.submit(input);
      const job = await infrastructure.queue.getJob(input.runId);
      if (job === undefined) { throw new Error('Missing job'); }
      await waitForState(job, 'failed');
      expect(calls).toBe(2);
      expect((await infrastructure.queue.getJob(input.runId))?.attemptsStarted).toBe(2);
      await expect.poll(async () => (await store.getRun(input.runId, scope))?.status).toBe('failed');
    } finally {
      await worker.close();
      await infrastructure.close();
    }
  });
});
