// Proves paid-route authentication, fixed identity binding, capability gates, and safe failures.

import {
  describe,
  expect,
  it,
} from 'vitest';
import { loadConfig } from '../../../src/config';
import { createApp } from '../../../src/http/app';
import { createLogger } from '../../../src/logger';
import { buildFixture } from './support';

const token = 'synthetic-staging-token-for-local-tests-only';
const config = loadConfig({
  NODE_ENV: 'test',
  LOG_LEVEL: 'silent',
  OPENAI_API_KEY: 'synthetic',
  STAGING_AUTH_TOKEN: token,
  STAGING_ACCOUNT_ID: 'account',
  STAGING_CHANNEL_ID: 'channel',
});
const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

describe('HTTP application', () => {
  it('serves public safe liveness and preserves dependency readiness status', async () => {
    const fixture = buildFixture();
    fixture.services.readiness = async () => ({
      ready: false,
      missing: ['DATABASE_URL'],
      dependencies: { database: false, queue: false, runtime: false },
    });
    const app = createApp(config, fixture.services, createLogger(config));
    expect((await app.request('/health')).status).toBe(200);
    const ready = await app.request('/health/ready');
    expect(ready.status).toBe(503);
    expect(await ready.text()).not.toContain('synthetic');
  });

  it('rejects unauthenticated paid routes before execution or job creation', async () => {
    const fixture = buildFixture();
    const app = createApp(config, fixture.services, createLogger(config));
    for (const path of ['/v1/runs', '/v1/jobs']) {
      expect((await app.request(path, { method: 'POST', body: JSON.stringify({ prompt: 'hi' }) })).status).toBe(401);
    }
    expect(fixture.inputs).toHaveLength(0);
    expect(fixture.records.size).toBe(0);
  });

  it('binds fresh foreground runs to verified server scope without E2B configuration', async () => {
    const fixture = buildFixture();
    const app = createApp(config, fixture.services, createLogger(config));
    for (let index = 0; index < 2; index++) {
      const response = await app.request('/v1/runs', {
        method: 'POST',
        headers,
        body: JSON.stringify({ prompt: 'hi' }),
      });
      expect(response.status).toBe(200);
    }
    expect(fixture.inputs).toHaveLength(2);
    expect(fixture.inputs[0]?.scope).toEqual({ accountId: 'account', channelId: 'channel' });
    expect(fixture.inputs[0]?.runId).not.toBe(fixture.inputs[1]?.runId);
    expect(fixture.inputs[0]?.scope).not.toBe(fixture.inputs[1]?.scope);
  });

  it('rejects caller identity fields and malformed JSON before paid work', async () => {
    const fixture = buildFixture();
    const app = createApp(config, fixture.services, createLogger(config));
    for (
      const body of [
        '{',
        JSON.stringify({ prompt: 'hi', accountId: 'victim' }),
        JSON.stringify({ prompt: 'hi', scope: { accountId: 'victim' } }),
      ]
    ) {
      expect((await app.request('/v1/runs', { method: 'POST', headers, body })).status).toBe(400);
    }
    expect(fixture.inputs).toHaveLength(0);
  });

  it('blocks sandbox work before persistence when its required services are absent', async () => {
    const fixture = buildFixture();
    const app = createApp(config, fixture.services, createLogger(config));
    expect(
      (await app.request('/v1/runs', {
        method: 'POST',
        headers,
        body: JSON.stringify({ prompt: 'calculate', sandbox: true }),
      })).status,
    ).toBe(503);
    expect(
      (await app.request('/v1/jobs', { method: 'POST', headers, body: JSON.stringify({ prompt: 'calculate' }) }))
        .status,
    ).toBe(503);
    expect(fixture.records.size).toBe(0);
  });

  it('queues a server-bound job using the same independent run contract', async () => {
    const fixture = buildFixture();
    const readyConfig = { ...config, e2bApiKey: 'synthetic', gcsBucketName: 'synthetic' };
    const app = createApp(readyConfig, fixture.services, createLogger(config));
    const response = await app.request('/v1/jobs', {
      method: 'POST',
      headers,
      body: JSON.stringify({ prompt: 'calculate' }),
    });
    expect(response.status).toBe(202);
    expect(fixture.submitted[0]?.sandbox).toBe(true);
    expect(fixture.submitted[0]?.scope).toEqual({ accountId: 'account', channelId: 'channel' });
    expect(fixture.inputs).toHaveLength(0);
  });

  it('persists safe failure status without returning provider exceptions', async () => {
    const fixture = buildFixture();
    fixture.fail();
    const app = createApp(config, fixture.services, createLogger(config));
    const response = await app.request('/v1/runs', { method: 'POST', headers, body: JSON.stringify({ prompt: 'hi' }) });
    expect(response.status).toBe(502);
    expect(await response.text()).not.toContain('SECRET');
    expect([...fixture.records.values()][0]?.status).toBe('failed');
  });

  it('returns no other account or channel result', async () => {
    const fixture = buildFixture();
    const input = { runId: crypto.randomUUID(), scope: { accountId: 'account', channelId: 'other' }, prompt: 'hi' };
    await fixture.store.createRun(input, 'background');
    const app = createApp(config, fixture.services, createLogger(config));
    expect((await app.request(`/v1/jobs/${input.runId}`, { headers })).status).toBe(404);
  });
});
