// Verifies the built production image boots without secrets, reports missing dependencies, and stops cleanly.
import { spawnSync } from 'node:child_process';
import { setTimeout } from 'node:timers/promises';
import {
  describe,
  expect,
  it,
} from 'vitest';
import { runDocker } from '../../scripts/test/docker.ts';

const baseUrl = process.env.TEST_CONTAINER_URL;
const containerName = process.env.TEST_CONTAINER_NAME;
const image = process.env.TEST_CONTAINER_IMAGE;
if (!baseUrl || !containerName || !image) {
  throw new Error('Run container checks through bun run test:container');
}

/** Waits briefly for the production listener, failing with container diagnostics if it never starts. */
const getHealth = async (): Promise<Response> => {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      return await fetch(`${baseUrl}/health`, { signal: AbortSignal.timeout(1_000) });
    } catch (cause) {
      if (Date.now() >= deadline) {
        throw cause;
      }
      await setTimeout(200);
    }
  }
  throw new Error(`API did not start: ${runDocker(['logs', containerName])}`);
};

describe('production container', () => {
  it('binds the image revision label to its build source', () => {
    expect(
      runDocker([
        'image',
        'inspect',
        '--format',
        '{{ index .Config.Labels "org.opencontainers.image.revision" }}',
        image,
      ]),
    ).toBe(process.env.TEST_BUILD_COMMIT);
    expect(
      runDocker([
        'image',
        'inspect',
        '--format',
        '{{ index .Config.Labels "org.opencontainers.image.source" }}',
        image,
      ]),
    ).toBe('https://github.com/hsignals/ms-agentic-be');
    expect(runDocker(['exec', containerName, 'printenv', 'BUILD_COMMIT'])).toBe(process.env.TEST_BUILD_COMMIT);
  });

  it('runs as an unprivileged user and includes the worker and migration entrypoints', () => {
    expect(runDocker(['inspect', '--format', '{{.Config.User}}', containerName])).toBe('bun');
    runDocker(['exec', containerName, 'test', '-f', '/app/src/worker.ts']);
    runDocker(['exec', containerName, 'test', '-f', '/app/src/db/migrate.ts']);
    const credentials = spawnSync('docker', ['exec', containerName, 'test', '-e', '/app/.env']);
    expect(credentials.status).toBe(1);
  });

  it('serves safe liveness while dependency readiness is unavailable', async () => {
    const response = await getHealth();
    expect(response.status).toBe(200);
    const ready = await fetch(`${baseUrl}/health/ready`);
    expect(ready.status).toBe(503);
    const health = await response.text();
    expect(health).not.toMatch(/postgresql:\/\/|redis:\/\/|api[_-]?key|token/i);
  });

  it('denies unauthenticated paid work', async () => {
    const response = await fetch(`${baseUrl}/v1/runs`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ prompt: 'smoke' }),
    });
    expect([401, 403, 503]).toContain(response.status);
  });

  it('forwards termination and exits within the shutdown allowance', () => {
    runDocker(['stop', '--time', '15', containerName]);
    expect(runDocker(['inspect', '--format', '{{.State.Running}}', containerName])).toBe('false');
    expect(runDocker(['inspect', '--format', '{{.State.ExitCode}}', containerName])).toBe('0');
  });
});
