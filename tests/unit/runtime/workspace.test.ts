// Verifies E2B isolation, native transfers, and cleanup with narrow SDK fakes.
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import type {
  RetainedFile,
  RetainedFileService,
} from '@/files/types.ts';
import { RuntimeExecutionError } from '@/runtime/errors.ts';
import type { RunInput } from '@/runtime/types.ts';
import { RunWorkspace } from '@/runtime/workspace.ts';

const e2b = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock('e2b', () => ({
  Sandbox: { create: e2b.create },
  CommandExitError: class extends Error {},
}));

const input: RunInput = {
  runId: 'run-a',
  prompt: 'Compute a result',
  scope: { accountId: 'account-a', channelId: 'channel-a' },
  sandbox: true,
};

/** Builds only native methods invoked by a workspace. It has no intentional exception path. */
const buildSandbox = (sandboxId: string) => ({
  sandboxId,
  commands: { run: vi.fn().mockResolvedValue({ exitCode: 0, stdout: '42', stderr: '' }) },
  files: { read: vi.fn().mockResolvedValue(Buffer.from('42')), write: vi.fn().mockResolvedValue({}) },
  kill: vi.fn().mockResolvedValue(true),
});

/** Builds protected transfer fakes. It has no intentional exception path. */
const buildFiles = (): RetainedFileService => ({
  get: vi.fn().mockResolvedValue(undefined),
  read: vi.fn().mockResolvedValue(undefined),
  save: vi.fn().mockRejectedValue(new Error('storage failed')),
});

describe('run workspace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates lazily and reuses one network-denied sandbox for concurrent tools', async () => {
    const sandbox = buildSandbox('sandbox-a');
    e2b.create.mockResolvedValue(sandbox);
    const workspace = new RunWorkspace(input, buildFiles(), 'management-key', 120_000);
    expect(e2b.create).not.toHaveBeenCalled();

    await Promise.all([workspace.executeCode('python', 'print(42)'), workspace.runCommand('pwd')]);

    expect(e2b.create).toHaveBeenCalledOnce();
    expect(e2b.create).toHaveBeenCalledWith({
      apiKey: 'management-key',
      allowInternetAccess: false,
      network: { allowPublicTraffic: false },
      timeoutMs: 120_000,
      metadata: { runId: 'run-a' },
    });
    expect(JSON.stringify(sandbox.files.write.mock.calls)).not.toContain('management-key');
    expect(JSON.stringify(sandbox.commands.run.mock.calls)).not.toContain('management-key');
    expect(sandbox.files.write).toHaveBeenCalledWith(
      expect.stringMatching(/^\/home\/user\/programs\/.+\.py$/),
      'print(42)',
    );
    expect(sandbox.commands.run).toHaveBeenCalledWith(
      expect.stringMatching(/^python3 \/home\/user\/programs\/.+\.py$/),
      { timeoutMs: 120_000 },
    );
    await workspace.close();
    expect(sandbox.kill).toHaveBeenCalledOnce();
  });

  it('creates a fresh sandbox for every independent attempt', async () => {
    const first = buildSandbox('sandbox-a');
    const second = buildSandbox('sandbox-b');
    e2b.create.mockResolvedValueOnce(first).mockResolvedValueOnce(second);
    const previous = new RunWorkspace(input, buildFiles(), 'management-key', 120_000);
    await previous.runCommand('true');
    await previous.close();
    const retry = new RunWorkspace(input, buildFiles(), 'management-key', 120_000);
    await retry.runCommand('true');

    expect(previous.sandboxId).toBe('sandbox-a');
    expect(retry.sandboxId).toBe('sandbox-b');
    expect(e2b.create).toHaveBeenCalledTimes(2);
    await retry.close();
  });

  it('does not allocate a sandbox for a forbidden selected file', async () => {
    const workspace = new RunWorkspace(
      { ...input, restoreFileIds: ['forbidden'] },
      buildFiles(),
      'management-key',
      120_000,
    );

    await expect(workspace.restoreSelectedFiles()).rejects.toThrow('selected retained file is unavailable');
    expect(e2b.create).not.toHaveBeenCalled();
  });

  it('restores exact authorized bytes through backend SDK transfer into a fresh sandbox', async () => {
    const file: RetainedFile = {
      id: 'b0784461-2bc9-44e5-aad7-e3b732b71602',
      accountId: 'account-a',
      channelId: 'channel-a',
      runId: 'previous-run',
      access: 'channelPrivate',
      dataType: 'synthetic',
      name: 'calculation.txt',
      contentType: 'text/plain',
      provider: null,
      connectionId: null,
      sourceAsOf: null,
      savedAt: new Date('2026-01-01T00:00:00Z'),
      retrievedAt: new Date('2026-01-02T00:00:00Z'),
      sizeBytes: 3,
      storageReference: 'gs://private-bucket/retained-file',
    };
    const bytes = new Uint8Array([0, 255, 42]);
    const files = buildFiles();
    vi.mocked(files.read).mockResolvedValue({ file, bytes });
    const sandbox = buildSandbox('fresh-sandbox');
    e2b.create.mockResolvedValue(sandbox);
    const workspace = new RunWorkspace({ ...input, restoreFileIds: [file.id] }, files, 'management-key', 120_000);

    const restored = await workspace.restoreSelectedFiles();

    const path = '/home/user/retained/b0784461-2bc9-44e5-aad7-e3b732b71602/calculation.txt';
    expect(files.read).toHaveBeenCalledWith(input.scope, file.id);
    expect(sandbox.files.write).toHaveBeenCalledWith(path, new Uint8Array([0, 255, 42]).buffer);
    expect(restored).toEqual([{ file, path }]);
    expect(restored[0]?.file.runId).toBe('previous-run');
    expect(restored[0]?.file.sourceAsOf).toBeNull();
    expect(workspace.sandboxId).toBe('fresh-sandbox');
    await workspace.close();
  });

  it('remembers a failed required file save even if a model catches the tool error', async () => {
    const sandbox = buildSandbox('sandbox-a');
    e2b.create.mockResolvedValue(sandbox);
    const workspace = new RunWorkspace(input, buildFiles(), 'management-key', 120_000);

    await expect(workspace.retainFile('/home/user/result.txt', 'result', 'text/plain')).rejects.toThrow(
      'persistence failed',
    );
    expect(() => workspace.assertPersistenceSucceeded()).toThrow('Required workspace-file persistence failed');
    await workspace.close();
    expect(sandbox.kill).toHaveBeenCalledOnce();
  });

  it('exposes fixed safe errors when SDK requests or cleanup fail', async () => {
    const sandbox = buildSandbox('sandbox-a');
    sandbox.commands.run.mockRejectedValue(new Error('E2B_API_KEY=private-secret'));
    sandbox.kill.mockRejectedValue(new Error('Authorization: private-secret'));
    e2b.create.mockResolvedValue(sandbox);
    const workspace = new RunWorkspace(input, buildFiles(), 'management-key', 120_000);

    await expect(workspace.runCommand('true')).rejects.toThrow('Sandbox command execution failed.');
    await expect(workspace.close()).rejects.toThrow('Sandbox cleanup failed.');
  });

  it('keeps raw provider causes outside serializer-visible error fields', () => {
    const nativeError = new Error('Authorization: private-secret');
    const err = new RuntimeExecutionError('Sandbox creation failed.', { cause: nativeError });

    expect(err.cause).toBeUndefined();
    expect(JSON.stringify(err)).not.toContain('private-secret');
    expect(String(err)).not.toContain('private-secret');
    const outerError = new RuntimeExecutionError('Runtime execution failed.', { cause: err });
    expect(outerError.cause).toBe(err);
  });
});
