// Owns one lazy E2B sandbox and backend-controlled transfers for one run attempt.
import { randomUUID } from 'node:crypto';
import { basename } from 'node:path';
import type { CommandResult } from 'e2b';
import {
  CommandExitError,
  Sandbox,
} from 'e2b';
import type {
  RetainedFile,
  RetainedFileService,
} from '@/files/types.ts';
import {
  RuntimeExecutionError,
  RuntimeUnavailableError,
} from './errors.ts';
import type { RunInput } from './types.ts';

/** Restored evidence keeps its source metadata and receives a new sandbox path. */
export type RestoredFile = { file: RetainedFile, path: string };

/** A per-attempt workspace; generated programs never execute in the backend. */
export class RunWorkspace {
  #input: RunInput;
  #e2bApiKey: string | undefined;
  #sandboxTimeoutMs: number;
  #files: RetainedFileService;
  #sandbox: Sandbox | undefined;
  #sandboxPromise: Promise<Sandbox> | undefined;
  #retainedFiles: RetainedFile[] = [];
  #hasPersistenceFailure = false;

  /** Binds trusted dependencies without creating a sandbox. It has no intentional exception path. */
  constructor(input: RunInput, files: RetainedFileService, e2bApiKey: string | undefined, sandboxTimeoutMs: number) {
    this.#input = input;
    this.#e2bApiKey = e2bApiKey;
    this.#sandboxTimeoutMs = sandboxTimeoutMs;
    this.#files = files;
  }

  /** Returns completed saves only. It has no intentional exception path. */
  get retainedFiles(): RetainedFile[] {
    return [...this.#retainedFiles];
  }

  /** Returns the native identifier without an access token. It has no intentional exception path. */
  get sandboxId(): string | null {
    return this.#sandbox?.sandboxId ?? null;
  }

  /**
   * Creates at most one network-isolated workspace, even for concurrent tools.
   * @throws {RuntimeUnavailableError} If the E2B key is absent.
   * @throws {RuntimeExecutionError} If sandbox creation fails.
   */
  async #getOrCreateSandbox(): Promise<Sandbox> {
    const apiKey = this.#e2bApiKey;
    if (!apiKey) {
      throw new RuntimeUnavailableError('Sandbox execution is not configured.');
    }

    if (!this.#sandboxPromise) {
      this.#sandboxPromise = Sandbox.create({
        apiKey,
        allowInternetAccess: false,
        network: { allowPublicTraffic: false },
        timeoutMs: this.#sandboxTimeoutMs,
        metadata: { runId: this.#input.runId },
      });
    }

    try {
      this.#sandbox = await this.#sandboxPromise;

      return this.#sandbox;
    } catch (err) {
      throw new RuntimeExecutionError('Sandbox creation failed.', { cause: err });
    }
  }

  /**
   * Restores only backend-authorized file IDs into this attempt's sandbox.
   * @throws {RuntimeExecutionError} If authorization, download, or sandbox write fails.
   * @throws {RuntimeUnavailableError} If a required SDK capability is absent.
   */
  async restoreSelectedFiles(): Promise<RestoredFile[]> {
    const restoredFiles: RestoredFile[] = [];
    for (const id of this.#input.restoreFileIds ?? []) {
      const content = await this.#files.read(this.#input.scope, id);
      if (!content) {
        throw new RuntimeExecutionError('A selected retained file is unavailable.');
      }

      const sandbox = await this.#getOrCreateSandbox();
      const path = `/home/user/retained/${content.file.id}/${basename(content.file.name)}`;
      try {
        await sandbox.files.write(path, Uint8Array.from(content.bytes).buffer);
      } catch (err) {
        throw new RuntimeExecutionError('Retained-file restoration failed.', { cause: err });
      }
      restoredFiles.push({ file: content.file, path });
    }

    return restoredFiles;
  }

  /**
   * Executes a command only through the native E2B client.
   * @returns Command failures remain repairable results; management failures throw safe errors.
   * @throws {RuntimeExecutionError} If the E2B command request fails.
   * @throws {RuntimeUnavailableError} If sandbox execution is unconfigured.
   */
  async runCommand(command: string): Promise<CommandResult> {
    const sandbox = await this.#getOrCreateSandbox();
    try {
      return await sandbox.commands.run(command, {
        timeoutMs: this.#sandboxTimeoutMs,
      });
    } catch (err) {
      if (err instanceof CommandExitError) {
        return { exitCode: err.exitCode, stdout: err.stdout, stderr: err.stderr };
      }

      throw new RuntimeExecutionError('Sandbox command execution failed.', { cause: err });
    }
  }

  /**
   * Writes generated source as data, then runs it in E2B with a server-owned path.
   * @throws {RuntimeExecutionError} If writing or command execution fails.
   * @throws {RuntimeUnavailableError} If sandbox execution is unconfigured.
   */
  async executeCode(language: 'python' | 'javascript', code: string): Promise<CommandResult> {
    const sandbox = await this.#getOrCreateSandbox();
    const extension = language === 'python'
      ? 'py'
      : 'js';
    const executable = language === 'python'
      ? 'python3'
      : 'node';
    const path = `/home/user/programs/${randomUUID()}.${extension}`;
    try {
      await sandbox.files.write(path, code);
    } catch (err) {
      throw new RuntimeExecutionError('Sandbox code transfer failed.', { cause: err });
    }

    return this.runCommand(`${executable} ${path}`);
  }

  /**
   * Retains an explicitly useful workspace file before it can be destroyed.
   * @throws {RuntimeExecutionError} If reading, object upload, or metadata persistence fails.
   * @throws {RuntimeUnavailableError} If required execution or storage is unconfigured.
   */
  async retainFile(path: string, dataType: string, contentType: string): Promise<RetainedFile> {
    const sandbox = await this.#getOrCreateSandbox();
    try {
      const bytes = await sandbox.files.read(path, { format: 'bytes' });
      const file = await this.#files.save(this.#input.scope, {
        runId: this.#input.runId,
        name: basename(path),
        bytes,
        dataType,
        contentType,
        // Scaffold outputs belong to their channel; only trusted provider code classifies account evidence.
        access: 'channelPrivate',
      });
      this.#retainedFiles.push(file);

      return file;
    } catch (err) {
      // A model cannot turn a failed required save into a successful prose answer.
      this.#hasPersistenceFailure = true;
      throw new RuntimeExecutionError('Workspace-file persistence failed.', { cause: err });
    }
  }

  /** @throws {RuntimeExecutionError} If any required file persistence failed during the tool loop. */
  assertPersistenceSucceeded(): void {
    if (this.#hasPersistenceFailure) {
      throw new RuntimeExecutionError('Required workspace-file persistence failed.');
    }
  }

  /**
   * Destroys the native sandbox after execution and required persistence finish.
   * @throws {RuntimeExecutionError} If termination cannot be confirmed by the SDK.
   */
  async close(): Promise<void> {
    if (this.#sandbox) {
      try {
        await this.#sandbox.kill();
      } catch (err) {
        throw new RuntimeExecutionError('Sandbox cleanup failed.', { cause: err });
      }
    }
  }
}
