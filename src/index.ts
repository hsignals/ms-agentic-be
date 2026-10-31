// API process entrypoint; application construction remains importable without a listener.

import { createApp } from './http/app';
import { loadConfig } from './config';
import { registerShutdown } from './lifecycle';
import { createLogger } from './logger';
import { createServices } from './services';

const config = loadConfig();
const logger = createLogger(config);
const services = createServices(config, logger);
const app = createApp(config, services, logger);
const server = Bun.serve({ port: config.port, fetch: app.fetch, idleTimeout: 255 });
logger.info({ event: 'api.started', port: server.port });
void services.initialize().then(() => {
  logger.info({ event: 'storage.initialized' });
}).catch(() => {
  logger.error({ event: 'storage.initialization_failed' });
});
registerShutdown(async () => {
  // Stop admission and wait for foreground requests before releasing their clients.
  await server.stop();
  await services.close();
}, logger);
