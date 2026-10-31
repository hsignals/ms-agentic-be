// BullMQ owns whole-job retries and stalled recovery; PostgreSQL owns durable application outcomes.

import {
  Queue,
  Worker,
} from 'bullmq';
import type { WorkerOptions } from 'bullmq';
import { Redis } from 'ioredis';
import type { Logger } from 'pino';
import { z } from 'zod';
import type { Config } from '../config';
import type { ApplicationStore } from '../db/store';
import type {
  RunInput,
  Runtime,
} from '../runtime/types';

/** Fixed queue namespace; deployment identity must not create an empty replacement queue. */
export const ANALYSIS_QUEUE = 'analysis';
/** Both explicit errors and interrupted starts count against this whole-job ceiling. */
export const MAX_JOB_ATTEMPTS = 2;

const JobInputSchema = z.object({
  runId: z.uuid(),
  prompt: z.string().min(1).max(12_000),
  scope: z.object({ accountId: z.string().min(1).max(200), channelId: z.string().min(1).max(200) }).strict(),
  restoreFileIds: z.array(z.uuid()).max(20).optional(),
  sandbox: z.boolean().optional(),
}).strict().transform(data => ({
  runId: data.runId,
  prompt: data.prompt,
  scope: data.scope,
  ...(data.restoreFileIds === undefined
    ? {}
    : { restoreFileIds: data.restoreFileIds }),
  ...(data.sandbox === undefined
    ? {}
    : { sandbox: data.sandbox }),
}));

/** Queue operations required by the HTTP boundary. */
export interface JobQueue {
  submit(input: RunInput): Promise<void>;
  getState(runId: string): Promise<string | undefined>;
  check(): Promise<void>;
  close(): Promise<void>;
}

/** Shared native queue infrastructure within one process. */
export type QueueInfrastructure = JobQueue & { connection: Redis, queue: Queue<RunInput> };

/** Creates native queue infrastructure. @throws Error for missing URL or invalid SDK configuration. */
export const createQueue = (config: Config, logger: Logger, mode: 'api' | 'worker' = 'api'): QueueInfrastructure => {
  if (config.redisUrl === undefined) {
    throw new Error('Queue configuration unavailable');
  }
  const connection = new Redis(config.redisUrl, {
    maxRetriesPerRequest: mode === 'worker'
      ? null
      : 1,
    enableOfflineQueue: mode === 'worker',
    connectTimeout: 5000,
    ...(config.redisTlsCa === undefined
      ? {}
      : { tls: { ca: config.redisTlsCa, rejectUnauthorized: true } }),
  });
  connection.on('error', () => logger.error({ event: 'queue.connection_failed' }));
  const queue = new Queue<RunInput>(ANALYSIS_QUEUE, {
    connection,
    defaultJobOptions: { attempts: MAX_JOB_ATTEMPTS, backoff: { type: 'exponential', delay: 1000 } },
  });
  queue.on('error', () => logger.error({ event: 'queue.error' }));
  return {
    connection,
    queue,
    /** Enqueues an already persisted, server-bound run. @throws Error on validation or queue failure. */
    submit: async input => {
      await queue.add('analysis', JobInputSchema.parse(input), { jobId: input.runId });
    },
    /** Reads queue state without returning private queue payload. @throws Error on queue failure. */
    getState: async runId => {
      const job = await queue.getJob(runId);
      return job?.getState();
    },
    /** Probes the shared queue client. @throws Error when Valkey is unavailable. */
    check: async () => {
      await connection.ping();
    },
    /** Stops the producer then closes its native connection. @throws Error on shutdown failure. */
    close: async () => {
      await queue.close();
      connection.disconnect();
    },
  };
};

/** Dependencies for a worker that never shares per-run mutable runtime context. */
export type WorkerDependencies = {
  config: Config;
  infrastructure: QueueInfrastructure;
  runtime: Runtime;
  store: ApplicationStore;
  logger: Logger;
};

/**
 * Creates the native worker with two starts total, including stalled recovery.
 * Native maxStartedAttempts limits starts that attempts=2 alone would miss.
 * @throws Error when BullMQ rejects configuration.
 */
export const createAnalysisWorker = (
  { config, infrastructure, runtime, store, logger }: WorkerDependencies,
): Worker<RunInput> => {
  const options: WorkerOptions = {
    connection: infrastructure.connection,
    concurrency: config.workerConcurrency,
    maxStartedAttempts: MAX_JOB_ATTEMPTS,
    maxStalledCount: MAX_JOB_ATTEMPTS - 1,
  };
  const worker = new Worker<RunInput>(ANALYSIS_QUEUE, async job => {
    const input = JobInputSchema.parse(job.data);
    const runLogger = logger.child({ runId: input.runId, jobId: job.id, attempt: job.attemptsStarted });
    try {
      const savedRun = await store.getRun(input.runId, input.scope);
      if (savedRun?.status === 'completed') {
        runLogger.info({ event: 'job.completed_reused' });

        return { runId: input.runId };
      }
      await store.setRunning(input);
      const result = await runtime.execute(input);
      await store.completeRun(input);
      runLogger.info({ event: 'job.completed', usage: result.usage, retainedFiles: result.files.length });
      return { runId: input.runId };
    } catch (error) {
      runLogger.error({ event: 'job.execution_failed', err: error });
      // Queue failure text is safe because SDK errors may contain prompts or credentials.
      throw new Error('Execution failed', { cause: error });
    }
  }, options);
  worker.on('error', () => logger.error({ event: 'worker.error' }));
  worker.on('failed', job => {
    if (job === undefined) {
      return;
    }
    const parsed = JobInputSchema.safeParse(job.data);
    if (parsed.success) {
      const input = parsed.data;
      void job.getState().then(async state => {
        if (state === 'failed') {
          await store.failRun(input.runId, input.scope, 'execution_failed');
        }
      }).catch(() => {
        logger.error({ event: 'job.failure_persistence_failed', jobId: job.id, runId: input.runId });
      });
    }
  });
  return worker;
};
