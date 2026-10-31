// Verifies completion persistence and cleanup ordering at the runtime boundary.
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import type {
  FileMetadataRepository,
  RetainedFile,
} from '@/files/types.ts';
import type { AgentResult } from '@/runtime/agent.ts';
import {
  createRuntime,
  RuntimeExecutionError,
  RuntimeUnavailableError,
} from '@/runtime/index.ts';
import type {
  RunInput,
  RunResult,
} from '@/runtime/types.ts';

const state = vi.hoisted(() => ({
  generate: vi.fn<() => Promise<AgentResult>>(),
  close: vi.fn<() => Promise<void>>(),
  restore: vi.fn().mockResolvedValue([]),
  assertPersistence: vi.fn(),
  initialized: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/runtime/agent.ts', () => ({ generateResponse: state.generate }));
vi.mock('@/runtime/workspace.ts', () => ({
  RunWorkspace: class {
    sandboxId = 'sandbox-a';
    retainedFiles: RetainedFile[] = [];
    restoreSelectedFiles = state.restore;
    assertPersistenceSucceeded = state.assertPersistence;
    close = state.close;
  },
}));
vi.mock('@/runtime/storage.ts', () => ({
  createMastraStorage: () => ({
    getStore: async () => ({ getThreadById: state.initialized }),
    close: vi.fn().mockResolvedValue(undefined),
  }),
}));

const input: RunInput = {
  runId: 'run-a',
  prompt: 'Compute a result',
  sandbox: true,
  scope: { accountId: 'account-a', channelId: 'channel-a' },
};

/** Builds narrow persistence dependencies with synthetic configuration. It has no intentional exception path. */
const buildDependencies = () => {
  const files: FileMetadataRepository = {
    save: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(undefined),
    recordRetrieval: vi.fn().mockResolvedValue(undefined),
  };

  return {
    config: { openaiApiKey: 'model-key', e2bApiKey: 'management-key', gcsBucketName: 'private-bucket' },
    files,
    results: { save: vi.fn<(run: RunInput, result: RunResult) => Promise<void>>().mockResolvedValue(undefined) },
  };
};

describe('runtime completion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.generate.mockResolvedValue({
      text: '42',
      usage: { inputTokens: 1, outputTokens: 2, totalTokens: 3, reasoningTokens: 1 },
    });
    state.close.mockResolvedValue(undefined);
    state.restore.mockResolvedValue([]);
    state.assertPersistence.mockImplementation(() => {});
  });

  it('persists the complete result before destroying its sandbox', async () => {
    const dependencies = buildDependencies();
    const order: string[] = [];
    dependencies.results.save.mockImplementation(async () => {
      order.push('saved');
    });
    state.close.mockImplementation(async () => {
      order.push('closed');
    });

    const result = await createRuntime(dependencies).execute(input);

    expect(result.text).toBe('42');
    expect(dependencies.results.save).toHaveBeenCalledWith(input, result);
    expect(order).toEqual(['saved', 'closed']);
  });

  it('closes the sandbox and fails when required result persistence fails', async () => {
    const dependencies = buildDependencies();
    dependencies.results.save.mockRejectedValue(new Error('database-url-with-private-secret'));

    await expect(createRuntime(dependencies).execute(input)).rejects.toThrow(
      'Required runtime result persistence failed.',
    );
    expect(state.close).toHaveBeenCalledOnce();
  });

  it('closes after model failure without claiming completion', async () => {
    const dependencies = buildDependencies();
    state.generate.mockRejectedValue(new RuntimeExecutionError('Model execution failed.'));

    await expect(createRuntime(dependencies).execute(input)).rejects.toThrow('Model execution failed.');
    expect(dependencies.results.save).not.toHaveBeenCalled();
    expect(state.close).toHaveBeenCalledOnce();
  });

  it('preserves both the primary execution failure and incomplete cleanup', async () => {
    state.generate.mockRejectedValue(new RuntimeExecutionError('Model execution failed.'));
    state.close.mockRejectedValue(new RuntimeExecutionError('Sandbox cleanup failed.'));

    const err = await createRuntime(buildDependencies()).execute(input).catch((failure: unknown) => failure);

    expect(err).toBeInstanceOf(AggregateError);
    if (!(err instanceof AggregateError)) {
      throw new Error('Expected combined execution and cleanup evidence.');
    }
    expect(err.errors.map((failure: Error) => failure.message)).toEqual([
      'Model execution failed.',
      'Sandbox cleanup failed.',
    ]);
  });

  it('refuses success after a tool persistence failure that the model absorbed', async () => {
    const dependencies = buildDependencies();
    state.assertPersistence.mockImplementation(() => {
      throw new RuntimeExecutionError('Required workspace-file persistence failed.');
    });

    await expect(createRuntime(dependencies).execute(input)).rejects.toThrow(
      'Required workspace-file persistence failed.',
    );
    expect(dependencies.results.save).not.toHaveBeenCalled();
    expect(state.close).toHaveBeenCalledOnce();
  });

  it('keeps foreground model execution available without sandbox credentials', async () => {
    const dependencies = buildDependencies();
    const runtime = createRuntime({ ...dependencies, config: { openaiApiKey: 'model-key' } });

    expect((await runtime.execute({ ...input, sandbox: false })).text).toBe('42');
    await expect(runtime.execute(input)).rejects.toBeInstanceOf(RuntimeUnavailableError);
  });

  it('initializes native storage without any model or sandbox credentials', async () => {
    const dependencies = buildDependencies();

    await createRuntime({ ...dependencies, config: { databaseUrl: 'postgres://synthetic' } }).initialize();

    expect(state.initialized).toHaveBeenCalledOnce();
    expect(state.generate).not.toHaveBeenCalled();
  });
});
