// Centralizes signal-driven process shutdown without hiding cleanup errors.

import type { Logger } from 'pino';

/** Registers one idempotent graceful shutdown handler. It does not throw during registration. */
export const registerShutdown = (close: () => Promise<void>, logger: Logger): void => {
  let closing = false;
  /** Stops owned work and releases native clients. It reports failures through the process exit code. */
  const shutdown = async (signal: string): Promise<void> => {
    if (closing) {
      return;
    }
    closing = true;
    logger.info({ event: 'process.stopping', signal });
    try {
      await close();
      logger.info({ event: 'process.stopped' });
      process.exitCode = 0;
    } catch (error) {
      logger.error({ event: 'process.shutdown_failed', err: error });
      process.exitCode = 1;
    }
  };
  process.once('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
  process.once('SIGINT', () => {
    void shutdown('SIGINT');
  });
};
