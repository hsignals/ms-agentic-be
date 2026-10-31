// Proves process cancellation releases both invocation-owned containers and the image tag.
import { randomUUID } from 'node:crypto';
import {
  spawn,
  spawnSync,
} from 'node:child_process';
import { once } from 'node:events';
import { createInterface } from 'node:readline';
import {
  expect,
  it,
} from 'vitest';
import { runDocker } from '../../scripts/test/docker.ts';

it('removes its container and image tag when the resource owner receives SIGTERM', async () => {
  const sourceImage = process.env.TEST_CONTAINER_IMAGE;
  if (!sourceImage) {
    throw new Error('Run container checks through bun run test:container');
  }
  const ownedImage = `agentic-cancellation-${randomUUID()}:local`;
  const child = spawn('bun', [
    '--no-env-file',
    'run',
    'tests/container/fixtures/cancellable.ts',
    sourceImage,
    ownedImage,
  ], {
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  const exited = once(child, 'exit');
  const lines = createInterface({ input: child.stdout });
  const filter = `label=ms-agentic.cancellation=${ownedImage}`;
  try {
    const [line] = await Promise.race([
      once(lines, 'line'),
      exited.then(() => {
        throw new Error('Resource owner exited before reporting readiness');
      }),
    ]);
    expect(line).toBe('ready');
    expect(runDocker(['ps', '-q', '--filter', filter])).not.toBe('');
    expect(runDocker(['image', 'inspect', '--format', '{{.Id}}', ownedImage])).toMatch(/^sha256:/);
    child.kill('SIGTERM');
    const [exitCode] = await exited;
    expect(exitCode).toBe(130);
    expect(runDocker(['ps', '-aq', '--filter', filter])).toBe('');
    expect(spawnSync('docker', ['image', 'inspect', ownedImage], { stdio: 'ignore' }).status).toBe(1);
  } finally {
    lines.close();
    child.kill('SIGKILL');
    const remaining = runDocker(['ps', '-aq', '--filter', filter]);
    if (remaining.length > 0) {
      runDocker(['rm', '--force', ...remaining.split('\n')]);
    }
    spawnSync('docker', ['image', 'rm', ownedImage], { stdio: 'ignore' });
  }
});
