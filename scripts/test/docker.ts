// Owns uniquely named disposable containers and images, including cancellation cleanup.
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { setTimeout } from 'node:timers/promises';

/** Runs a Docker command, throwing its safe diagnostic when Docker fails. */
export const runDocker = (arguments_: string[], timeoutMs = 120_000): string => {
  const result = spawnSync('docker', arguments_, { encoding: 'utf8', timeout: timeoutMs });
  if (result.error || result.status !== 0) {
    throw new Error(`docker ${arguments_[0]} failed: ${result.error?.message ?? result.stderr.trim()}`);
  }

  return result.stdout.trim();
};

/** Requires an available Docker daemon before creating disposable resources. */
export const assertDockerAvailable = (): void => {
  runDocker(['info', '--format', '{{.ServerVersion}}']);
};

/** A single invocation's containers and images, isolated from development services and parallel runs. */
export class TestResources {
  readonly namespace = `agentic-test-${randomUUID()}`;
  private readonly names: string[] = [];
  private readonly imageTags: string[] = [];
  private readonly stop = (): void => {
    this.cleanup();
    process.exit(130);
  };

  constructor() {
    process.once('SIGINT', this.stop);
    process.once('SIGTERM', this.stop);
    process.once('exit', this.cleanup);
  }

  /** Starts a named disposable container; Docker assigns its loopback-only host port. */
  start = (role: string, arguments_: string[]): string => {
    const name = `${this.namespace}-${role}`;
    this.names.push(name);
    runDocker(
      ['run', '--detach', '--name', name, '--label', `ms-agentic.test=${this.namespace}`, ...arguments_],
      600_000,
    );

    return name;
  };

  /** Registers an invocation-owned image tag for cleanup after its containers stop. */
  registerImage = (imageTag: string): void => {
    this.imageTags.push(imageTag);
  };

  /** Reads the published host port for one container service. */
  getPort = (name: string, containerPort: number): number => {
    const binding = runDocker(['port', name, `${containerPort}/tcp`]);
    const port = Number(binding.split(':').at(-1));
    if (!Number.isInteger(port) || port <= 0) {
      throw new Error(`No published port for ${name}:${containerPort}`);
    }

    return port;
  };

  /** Waits for a readiness command, throwing with container logs if the service stays unavailable. */
  waitForCommand = async (name: string, arguments_: string[]): Promise<void> => {
    const deadline = Date.now() + 60_000;
    while (Date.now() < deadline) {
      const result = spawnSync('docker', ['exec', name, ...arguments_], { encoding: 'utf8', timeout: 5_000 });
      if (result.status === 0) {
        return;
      }
      await setTimeout(250);
    }
    throw new Error(`${name} failed readiness: ${runDocker(['logs', name])}`);
  };

  /** Removes this invocation's containers, anonymous storage, and registered image tags after any outcome. */
  cleanup = (): void => {
    for (const name of this.names.toReversed()) {
      const result = spawnSync('docker', ['rm', '--force', '--volumes', name], { encoding: 'utf8', timeout: 15_000 });
      if (result.error || result.status !== 0) {
        console.error(`Cleanup failed for ${name}: ${result.error?.message ?? result.stderr.trim()}`);
        process.exitCode = 1;
      }
    }
    for (const imageTag of this.imageTags.toReversed()) {
      const result = spawnSync('docker', ['image', 'rm', imageTag], { encoding: 'utf8', timeout: 15_000 });
      if (result.error || result.status !== 0) {
        console.error(`Image cleanup failed for ${imageTag}: ${result.error?.message ?? result.stderr.trim()}`);
        process.exitCode = 1;
      }
    }
    this.names.length = 0;
    this.imageTags.length = 0;
    process.removeListener('SIGINT', this.stop);
    process.removeListener('SIGTERM', this.stop);
    process.removeListener('exit', this.cleanup);
  };
}
