// Builds the shared runtime image and verifies its harmless public bootstrap in a disposable container.
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { runTestProject } from './environment.ts';
import {
  assertDockerAvailable,
  runDocker,
  TestResources,
} from './docker.ts';

process.env.BUILDX_CONFIG ??= resolve('.cache/docker-buildx');
mkdirSync(process.env.BUILDX_CONFIG, { recursive: true });
assertDockerAvailable();
const resources = new TestResources();
const image = `${resources.namespace}:local`;
const buildCommit = '0123456789abcdef0123456789abcdef01234567';
try {
  runDocker(['build', '--build-arg', `BUILD_COMMIT=${buildCommit}`, '--tag', image, '.'], 600_000);
  resources.registerImage(image);
  const api = resources.start('api', ['--publish', '127.0.0.1::8080', image]);
  process.exitCode = await runTestProject('container', {
    TEST_CONTAINER_NAME: api,
    TEST_CONTAINER_IMAGE: image,
    TEST_BUILD_COMMIT: buildCommit,
    TEST_CONTAINER_URL: `http://127.0.0.1:${resources.getPort(api, 8080)}`,
  });
} finally {
  resources.cleanup();
}
