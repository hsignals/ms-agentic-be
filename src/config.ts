// Validates process settings without exposing supplied secret values.

import { z } from 'zod';

const optionalValue = z.preprocess(value =>
  value === ''
    ? undefined
    : value, z.string().min(1).optional());
const optionalUrl = (protocols: readonly string[]) =>
  z.preprocess(
    value =>
      value === ''
        ? undefined
        : value,
    z.url().refine(value => protocols.some(protocol => value.startsWith(protocol))).optional(),
  );

const ConfigSchema = z.object({
  nodeEnv: z.enum(['development', 'test', 'production']).default('development'),
  port: z.coerce.number().int().min(1).max(65535).default(8080),
  logLevel: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent']).default('info'),
  deploymentId: z.string().min(1).max(200).default('local'),
  databaseUrl: optionalUrl(['postgres:', 'postgresql:']),
  redisUrl: optionalUrl(['redis:', 'rediss:']),
  redisTlsCa: optionalValue,
  openaiApiKey: optionalValue,
  e2bApiKey: optionalValue,
  gcsBucketName: optionalValue,
  stagingAuthToken: z.preprocess(
    value =>
      value === ''
        ? undefined
        : value,
    z.string().regex(/^[A-Za-z0-9._~+/-]{32,}={0,2}$/).optional(),
  ),
  stagingAccountId: z.string().min(1).max(200).default('synthetic-account'),
  stagingChannelId: z.string().min(1).max(200).default('synthetic-channel'),
  workerConcurrency: z.coerce.number().int().min(1).max(16).default(1),
  sandboxTimeoutMs: z.coerce.number().int().min(1000).max(3_600_000).default(120_000),
});

/** Process-wide validated settings; absent dependencies keep bootstrap health available. */
export type Config = Readonly<z.infer<typeof ConfigSchema>>;

/**
 * Reads only the application's documented environment variables.
 * @throws Error when a supplied value is invalid; the error names fields only.
 */
export const loadConfig = (env: Record<string, string | undefined> = process.env): Config => {
  const result = ConfigSchema.safeParse({
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    logLevel: env.LOG_LEVEL,
    deploymentId: env.DEPLOYMENT_ID ?? env.K_REVISION,
    databaseUrl: env.DATABASE_URL,
    redisUrl: env.REDIS_URL,
    redisTlsCa: env.REDIS_TLS_CA,
    openaiApiKey: env.OPENAI_API_KEY,
    e2bApiKey: env.E2B_API_KEY,
    gcsBucketName: env.GCS_BUCKET_NAME,
    stagingAuthToken: env.STAGING_AUTH_TOKEN,
    stagingAccountId: env.STAGING_ACCOUNT_ID,
    stagingChannelId: env.STAGING_CHANNEL_ID,
    workerConcurrency: env.WORKER_CONCURRENCY,
    sandboxTimeoutMs: env.SANDBOX_TIMEOUT_MS,
  });
  if (!result.success) {
    throw new Error(
      `Invalid configuration fields: ${result.error.issues.map(issue => issue.path.join('.')).join(', ')}`,
    );
  }
  return Object.freeze(result.data);
};

/** Lists absent capabilities without including credentials. It does not throw. */
export const getMissingConfiguration = (config: Config): string[] => {
  const required = {
    DATABASE_URL: config.databaseUrl,
    REDIS_URL: config.redisUrl,
    OPENAI_API_KEY: config.openaiApiKey,
    E2B_API_KEY: config.e2bApiKey,
    GCS_BUCKET_NAME: config.gcsBucketName,
    STAGING_AUTH_TOKEN: config.stagingAuthToken,
  };
  return Object.entries(required).filter(([, value]) => value === undefined).map(([name]) => name);
};
