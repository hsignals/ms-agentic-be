// Builds the Hono application independently of its listener and native infrastructure.

import { Hono } from 'hono';
import { bearerAuth } from 'hono/bearer-auth';
import { bodyLimit } from 'hono/body-limit';
import { HTTPException } from 'hono/http-exception';
import type { Logger } from 'pino';
import { z } from 'zod';
import type { Config } from '../config';
import type { ApplicationServices } from '../services';
import type {
  RunInput,
  TrustedScope,
} from '../runtime/types';

type AppEnvironment = { Variables: { scope: TrustedScope, requestId: string } };
const RunRequestSchema = z.object({
  prompt: z.string().trim().min(1).max(12_000),
  restoreFileIds: z.array(z.uuid()).max(20).optional(),
  sandbox: z.boolean().optional(),
}).strict();

/** Creates authenticated routes with server-bound synthetic scope. @throws Error for invalid injected dependencies. */
export const createApp = (config: Config, services: ApplicationServices, logger: Logger): Hono<AppEnvironment> => {
  const app = new Hono<AppEnvironment>();
  app.use('*', async (c, next) => {
    const requestId = crypto.randomUUID();
    const startedAt = performance.now();
    c.set('requestId', requestId);
    c.header('X-Request-Id', requestId);
    await next();
    logger.info({
      event: 'http.completed',
      requestId,
      method: c.req.method,
      status: c.res.status,
      durationMs: Math.round(performance.now() - startedAt),
    });
  });
  app.get('/health', c => c.json({ status: 'ok', deploymentId: config.deploymentId }));
  app.get('/health/ready', async c => {
    const readiness = await services.readiness();
    return c.json(
      {
        status: readiness.ready
          ? 'ready'
          : 'unavailable',
        deploymentId: config.deploymentId,
        ...readiness,
      },
      readiness.ready
        ? 200
        : 503,
    );
  });
  app.use('/v1/*', async (c, next) => {
    if (config.stagingAuthToken === undefined) {
      return c.json({ error: 'authentication_unavailable' }, 503);
    }
    return bearerAuth<AppEnvironment>({ token: config.stagingAuthToken })(c, next);
  });
  app.use('/v1/*', async (c, next) => {
    c.set('scope', { accountId: config.stagingAccountId, channelId: config.stagingChannelId });
    await next();
  });
  app.use('/v1/*', bodyLimit({ maxSize: 65_536 }));

  /** Validates external JSON without retaining it in logs. @throws HTTPException on invalid input. */
  const parseRequest = async (request: Request, scope: TrustedScope, defaultSandbox: boolean): Promise<RunInput> => {
    const json: unknown = await request.json().catch(error => {
      throw new HTTPException(400, { message: 'Invalid JSON', cause: error });
    });
    const parsed = RunRequestSchema.safeParse(json);
    if (!parsed.success) {
      throw new HTTPException(400, { message: 'Invalid request' });
    }
    return {
      runId: crypto.randomUUID(),
      scope,
      prompt: parsed.data.prompt,
      sandbox: parsed.data.sandbox ?? defaultSandbox,
      ...(parsed.data.restoreFileIds === undefined
        ? {}
        : { restoreFileIds: parsed.data.restoreFileIds }),
    };
  };

  /** Enforces exact requested capabilities before paid work. It does not throw. */
  const canExecute = (input: RunInput): boolean => {
    if (services.store === undefined || services.runtime === undefined || config.openaiApiKey === undefined) {
      return false;
    }
    if (
      (input.sandbox === true || (input.restoreFileIds?.length ?? 0) > 0)
      && (config.e2bApiKey === undefined || config.gcsBucketName === undefined)
    ) {
      return false;
    }
    return true;
  };

  app.post('/v1/runs', async c => {
    const input = await parseRequest(c.req.raw, c.get('scope'), false);
    if (!canExecute(input) || services.store === undefined || services.runtime === undefined) {
      return c.json({ error: 'execution_unavailable' }, 503);
    }
    await services.store.createRun(input, 'foreground');
    try {
      const result = await services.runtime.execute(input);
      await services.store.completeRun(input);
      logger.info({
        event: 'run.completed',
        requestId: c.get('requestId'),
        runId: input.runId,
        usage: result.usage,
        retainedFiles: result.files.length,
      });
      return c.json({ runId: input.runId, ...result });
    } catch (error) {
      await services.store.failRun(input.runId, input.scope, 'execution_failed');
      logger.error({ event: 'run.execution_failed', requestId: c.get('requestId'), runId: input.runId, err: error });
      return c.json({ error: 'execution_failed', runId: input.runId }, 502);
    }
  });
  app.post('/v1/jobs', async c => {
    const input = await parseRequest(c.req.raw, c.get('scope'), true);
    if (!canExecute(input) || services.store === undefined || services.queue === undefined) {
      return c.json({ error: 'execution_unavailable' }, 503);
    }
    await services.store.createRun(input, 'background');
    try {
      await services.queue.submit(input);
      return c.json({ jobId: input.runId, runId: input.runId, status: 'queued' }, 202);
    } catch (error) {
      logger.error({ event: 'job.enqueue_failed', runId: input.runId, err: error });
      await services.store.failRun(input.runId, input.scope, 'queue_unavailable');
      return c.json({ error: 'queue_unavailable', runId: input.runId }, 503);
    }
  });
  app.get('/v1/jobs/:id', async c => {
    if (!z.uuid().safeParse(c.req.param('id')).success) {
      return c.json({ error: 'invalid_id' }, 400);
    }
    if (services.store === undefined) {
      return c.json({ error: 'storage_unavailable' }, 503);
    }
    const record = await services.store.getRun(c.req.param('id'), c.get('scope'));
    if (record === undefined) {
      return c.json({ error: 'not_found' }, 404);
    }
    // Native stalled recovery can fail a job without calling its processor.
    if (
      record.mode === 'background' && record.status !== 'completed' && services.queue !== undefined
      && await services.queue.getState(record.id) === 'failed'
    ) {
      await services.store.failRun(record.id, c.get('scope'), 'execution_failed');
      return c.json({ ...record, status: 'failed', errorCode: 'execution_failed' });
    }
    return c.json(record);
  });
  app.get('/v1/files/:id', async c => {
    if (!z.uuid().safeParse(c.req.param('id')).success) {
      return c.json({ error: 'invalid_id' }, 400);
    }
    if (services.runtime === undefined) {
      return c.json({ error: 'storage_unavailable' }, 503);
    }
    const file = await services.runtime.files.get(c.get('scope'), c.req.param('id'));
    return file === undefined
      ? c.json({ error: 'not_found' }, 404)
      : c.json(file);
  });
  app.get('/v1/files/:id/content', async c => {
    if (!z.uuid().safeParse(c.req.param('id')).success) {
      return c.json({ error: 'invalid_id' }, 400);
    }
    if (services.runtime === undefined || config.gcsBucketName === undefined) {
      return c.json({ error: 'storage_unavailable' }, 503);
    }
    const content = await services.runtime.files.read(c.get('scope'), c.req.param('id'));
    if (content === undefined) {
      return c.json({ error: 'not_found' }, 404);
    }
    return new Response(content.bytes, {
      headers: { 'Content-Type': 'application/octet-stream', 'Cache-Control': 'private, no-store' },
    });
  });
  app.onError((error, c) => {
    if (error instanceof HTTPException) {
      return error.getResponse();
    }
    logger.error({ event: 'http.failed', requestId: c.get('requestId') });
    return c.json({ error: 'internal_error' }, 500);
  });
  return app;
};
