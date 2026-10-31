// Dedicated queue consumer process; missing dependencies never claim paid work.

import {
  getMissingConfiguration,
  loadConfig,
} from './config';
import { createAnalysisWorker } from './jobs/queue';
import { registerShutdown } from './lifecycle';
import { createLogger } from './logger';
import { createServices } from './services';

const config = loadConfig();
const logger = createLogger(config);
const missing = getMissingConfiguration(config);
if (missing.length > 0) {
  logger.error({ event: 'worker.configuration_unavailable', missing });
  process.exitCode = 1;
} else {
  const services = createServices(config, logger, 'worker');
  if (services.runtime === undefined || services.store === undefined || services.infrastructure === undefined) {
    throw new Error('Worker dependencies unavailable');
  }
  try {
    await services.initialize();
    const worker = createAnalysisWorker({
      config,
      infrastructure: services.infrastructure,
      runtime: services.runtime,
      store: services.store,
      logger,
    });
    logger.info({ event: 'worker.started', concurrency: config.workerConcurrency });
    registerShutdown(async () => {
      // BullMQ stops admission and waits for active processors before closing clients.
      await worker.close();
      await services.close();
    }, logger);
  } catch (error) {
    logger.error({ event: 'worker.initialization_failed', err: error });
    await services.close();
    process.exitCode = 1;
  }
}
