// Verifies native Responses settings and fresh trusted request context per invocation.
import { createOpenAI } from '@ai-sdk/openai';
import type { AgentExecutionOptions } from '@mastra/core/agent';
import {
  MASTRA_RESOURCE_ID_KEY,
  MASTRA_THREAD_ID_KEY,
} from '@mastra/core/request-context';
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { generateResponse } from '@/runtime/agent.ts';
import type { RunInput } from '@/runtime/types.ts';
import type { RunWorkspace } from '@/runtime/workspace.ts';

const mastra = vi.hoisted(() => ({
  config: vi.fn<(config: Record<string, unknown>) => void>(),
  generate: vi.fn<
    (prompt: string, opts: AgentExecutionOptions) => Promise<{
      text: string;
      error?: Error;
      totalUsage: { inputTokens: number, outputTokens: number, totalTokens: number, reasoningTokens: number };
    }>
  >(),
}));

vi.mock('@mastra/core/agent', () => ({
  Agent: class {
    constructor(config: Record<string, unknown>) {
      mastra.config(config);
    }
    generate = mastra.generate;
    __setLogger = vi.fn();
  },
}));

const input: RunInput = {
  runId: 'run-a',
  prompt: 'Compute a result',
  scope: { accountId: 'account-a', channelId: 'channel-a' },
};

describe('native agent configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mastra.generate.mockResolvedValue({
      text: '42',
      totalUsage: { inputTokens: 1, outputTokens: 2, totalTokens: 3, reasoningTokens: 1 },
    });
  });

  it('uses Responses Luna with fast tier and xhigh reasoning', async () => {
    const openai = createOpenAI({ apiKey: 'model-key' });
    const responses = vi.spyOn(openai, 'responses');
    // No sandbox tool is registered, so the foreground branch does not consume a workspace.
    const workspace = Object.create(null) as RunWorkspace;

    expect(await generateResponse(input, openai, workspace, [])).toEqual({
      text: '42',
      usage: { inputTokens: 1, outputTokens: 2, totalTokens: 3, reasoningTokens: 1 },
    });

    expect(responses).toHaveBeenCalledWith('gpt-6-luna');
    expect(mastra.generate).toHaveBeenCalledWith(
      input.prompt,
      expect.objectContaining({
        providerOptions: { openai: { serviceTier: 'fast', reasoningEffort: 'xhigh', store: false } },
      }),
    );
    expect(JSON.stringify(mastra.config.mock.calls)).not.toContain('model-key');
  });

  it('binds fresh trusted account and channel context for separate runs', async () => {
    const openai = createOpenAI({ apiKey: 'model-key' });
    const workspace = Object.create(null) as RunWorkspace;
    await generateResponse(input, openai, workspace, []);
    await generateResponse(
      { ...input, runId: 'run-b', scope: { accountId: 'account-b', channelId: 'channel-b' } },
      openai,
      workspace,
      [],
    );
    const first = mastra.generate.mock.calls[0]?.[1].requestContext;
    const second = mastra.generate.mock.calls[1]?.[1].requestContext;

    expect(first).not.toBe(second);
    expect(first?.get(MASTRA_RESOURCE_ID_KEY)).toBe('account-a');
    expect(first?.get(MASTRA_THREAD_ID_KEY)).toBe('channel-a');
    expect(second?.get(MASTRA_RESOURCE_ID_KEY)).toBe('account-b');
    expect(second?.get(MASTRA_THREAD_ID_KEY)).toBe('channel-b');
    expect(first?.get('runId')).toBe('run-a');
    expect(second?.get('runId')).toBe('run-b');
  });

  it('rejects a native returned stream error instead of persisting an empty successful answer', async () => {
    const openai = createOpenAI({ apiKey: 'model-key' });
    const workspace = Object.create(null) as RunWorkspace;
    mastra.generate.mockResolvedValue({
      text: '',
      error: new Error('Authorization: private-secret'),
      totalUsage: { inputTokens: 1, outputTokens: 0, totalTokens: 1, reasoningTokens: 0 },
    });

    await expect(generateResponse(input, openai, workspace, [])).rejects.toThrow('Model execution failed.');
  });
});
