// Owns structured operational logs and excludes provider error messages and private inputs.

import pino from 'pino';
import type { Config } from './config';

/** Safe diagnostic category; arbitrary exception messages can contain credentials or prompts. */
export type SafeError = { name: string };

/** Converts untrusted exceptions to safe categories. It does not throw. */
export const getSafeError = (error: unknown): SafeError => ({
  name: error instanceof Error
    ? error.name
    : 'UnknownError',
});

/** Creates the shared JSON logger. @throws Error if Pino cannot open its destination. */
export const createLogger = (config: Config, destination?: pino.DestinationStream): pino.Logger => {
  const options: pino.LoggerOptions = {
    level: config.logLevel,
    base: { service: 'ms-agentic-be', deploymentId: config.deploymentId },
    redact: {
      paths: [
        'authorization',
        'password',
        'token',
        'apiKey',
        'databaseUrl',
        'redisUrl',
        'openaiApiKey',
        'e2bApiKey',
        'stagingAuthToken',
        '*.authorization',
        '*.password',
        '*.token',
        '*.apiKey',
        '*.databaseUrl',
        '*.redisUrl',
        '*.openaiApiKey',
        '*.e2bApiKey',
        '*.stagingAuthToken',
        'req.headers.authorization',
        'prompt',
        '*.prompt',
      ],
      censor: '[REDACTED]',
    },
    serializers: { err: getSafeError, error: getSafeError, msg: () => '[REDACTED]' },
  };
  return destination === undefined
    ? pino(options)
    : pino(options, destination);
};
