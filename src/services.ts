// Composes process-owned infrastructure; per-run context stays inside the runtime.

import type { Logger } from 'pino';
import { getMissingConfiguration } from './config';
import type { Config } from './config';
import { createStore } from './db/store';
import type { ApplicationStore } from './db/store';
import { createQueue } from './jobs/queue';
import type {
  JobQueue,
  QueueInfrastructure,
} from './jobs/queue';
import { createRuntime } from './runtime';
import type {
  Runtime,
  RuntimeConfig,
} from './runtime/types';

/** Safe full-foundation readiness output. */
export type Readiness = {
  ready: boolean;
  missing: string[];
  dependencies: { database: boolean, queue: boolean, runtime: boolean };
};

/** Application dependencies support native production infrastructure and focused in-memory tests. */
export type ApplicationServices = {
  store: ApplicationStore | undefined;
  runtime: Runtime | undefined;
  queue: JobQueue | undefined;
  readiness(): Promise<Readiness>;
};

/** Composed native process infrastructure and lifecycle. */
export type Services = ApplicationServices & {
  infrastructure: QueueInfrastructure | undefined;
  initialize(): Promise<void>;
  close(): Promise<void>;
};

/** Creates native clients without connecting to PostgreSQL. @throws Error on invalid SDK configuration. */
export const createServices = (config: Config, logger: Logger, mode: 'api' | 'worker' = 'api'): Services => {
  const store = config.databaseUrl === undefined
    ? undefined
    : createStore(config.databaseUrl, config.deploymentId);
  const runtimeConfig: RuntimeConfig = {
    ...(config.databaseUrl === undefined
      ? {}
      : { databaseUrl: config.databaseUrl }),
    ...(config.openaiApiKey === undefined
      ? {}
      : { openaiApiKey: config.openaiApiKey }),
    ...(config.e2bApiKey === undefined
      ? {}
      : { e2bApiKey: config.e2bApiKey }),
    ...(config.gcsBucketName === undefined
      ? {}
      : { gcsBucketName: config.gcsBucketName }),
    sandboxTimeoutMs: config.sandboxTimeoutMs,
  };
  const runtime = store === undefined
    ? undefined
    : createRuntime({ config: runtimeConfig, files: store.files, results: store.results });
  const infrastructure = config.redisUrl === undefined
    ? undefined
    : createQueue(config, logger, mode);
  let initialized = false;
  return {
    store,
    runtime,
    queue: infrastructure,
    infrastructure,
    /** Initializes native framework tables separately from Drizzle. @throws Error on storage initialization failure. */
    initialize: async () => {
      if (runtime !== undefined) {
        await runtime.initialize();
        initialized = true;
      }
    },
    /** Reports dependency state without exposing addresses or exceptions. It does not throw. */
    readiness: async () => {
      const database = store === undefined
        ? false
        : await store.check().then(() => true, () => false);
      const queue = infrastructure === undefined
        ? false
        : await infrastructure.check().then(() => true, () => false);
      const missing = getMissingConfiguration(config);
      return {
        ready: missing.length === 0 && database && queue && initialized,
        missing,
        dependencies: { database, queue, runtime: initialized },
      };
    },
    /** Closes all native clients even when one close fails. @throws AggregateError on incomplete cleanup. */
    close: async () => {
      const results = await Promise.allSettled([
        infrastructure?.close(),
        runtime?.close(),
        store?.close(),
      ]);
      const errors = results.filter(result => result.status === 'rejected').map(result => result.reason);
      if (errors.length > 0) {
        throw new AggregateError(errors, 'Infrastructure shutdown failed');
      }
    },
  };
};
