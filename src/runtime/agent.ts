// Registers a regular Mastra agent with native OpenAI Responses and E2B code tools.
import type { OpenAIProvider } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';
import { noopLogger } from '@mastra/core/logger';
import {
  MASTRA_RESOURCE_ID_KEY,
  MASTRA_THREAD_ID_KEY,
  RequestContext,
} from '@mastra/core/request-context';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import {
  RuntimeExecutionError,
  RuntimeUnavailableError,
} from './errors.ts';
import type {
  RunInput,
  RunUsage,
} from './types.ts';
import type {
  RestoredFile,
  RunWorkspace,
} from './workspace.ts';

/** A safe model response and aggregate usage without raw transport metadata. */
export type AgentResult = { text: string, usage: RunUsage };

/**
 * Runs a native agent with fresh trusted context and invocation-bound tools.
 * @throws {RuntimeUnavailableError} If the model credential is absent.
 * @throws {RuntimeExecutionError} If the model execution fails.
 */
export const generateResponse = async (
  input: RunInput,
  openai: OpenAIProvider | undefined,
  workspace: RunWorkspace,
  restoredFiles: RestoredFile[],
): Promise<AgentResult> => {
  if (!openai) {
    throw new RuntimeUnavailableError('Model execution is not configured.');
  }

  const requestContext = new RequestContext();
  requestContext.set(MASTRA_RESOURCE_ID_KEY, input.scope.accountId);
  requestContext.set(MASTRA_THREAD_ID_KEY, input.scope.channelId);
  requestContext.set('runId', input.runId);

  const tools = input.sandbox
    ? {
      executeCode: createTool({
        id: 'execute-code',
        description:
          'Run Python or JavaScript in this run’s isolated E2B sandbox. Save useful files and retain them before finishing.',
        inputSchema: z.object({ language: z.enum(['python', 'javascript']), code: z.string().min(1) }),
        /** @throws {RuntimeExecutionError} If native sandbox execution fails. */
        execute: async ({ language, code }) => {
          return workspace.executeCode(language, code);
        },
      }),
      runCommand: createTool({
        id: 'run-command',
        description: 'Run a shell command inside this run’s E2B sandbox. Network access is denied.',
        inputSchema: z.object({ command: z.string().min(1) }),
        /** @throws {RuntimeExecutionError} If native sandbox execution fails. */
        execute: async ({ command }) => {
          return workspace.runCommand(command);
        },
      }),
      retainFile: createTool({
        id: 'retain-file',
        description:
          'Save a useful input, calculation, dataset, or result file to private backend storage before the sandbox ends.',
        inputSchema: z.object({
          path: z.string().min(1),
          dataType: z.string().min(1),
          contentType: z.string().min(1),
        }),
        /** @throws {RuntimeExecutionError} If required retention fails. */
        execute: async ({ path, dataType, contentType }) => {
          const file = await workspace.retainFile(path, dataType, contentType);

          return { id: file.id, name: file.name, sizeBytes: file.sizeBytes };
        },
      }),
    }
    : {};

  const restoredContext = restoredFiles.map(({ file, path }) => ({
    id: file.id,
    name: file.name,
    path,
    sourceAsOf: file.sourceAsOf?.toISOString() ?? null,
    savedAt: file.savedAt.toISOString(),
  }));
  const agent = new Agent({
    id: 'analysis-runtime',
    name: 'Analysis runtime',
    instructions: [
      'Help with the requested task using authorized inputs. Never claim a tool ran unless it actually ran.',
      'Generated code executes only through the sandbox tools. The sandbox has no outbound network access.',
      'For calculations, use executeCode and save useful inputs, intermediate calculations, and final evidence with retainFile.',
      'A failed required file save means the task failed. Report it clearly.',
      'Saved or retrieved time does not establish source freshness. Treat unknown source time as unknown.',
      'Provide informational analysis; do not give specific buy, sell, or rebalance recommendations or execute financial transactions.',
      `Authorized restored files: ${JSON.stringify(restoredContext)}`,
    ].join('\n'),
    model: openai.responses('gpt-6-luna'),
    tools,
  });
  // The pinned native Agent exposes this logger setter; AgentConfig has no logger option.
  agent.__setLogger(noopLogger);

  try {
    const result = await agent.generate(input.prompt, {
      requestContext,
      maxSteps: 12,
      providerOptions: { openai: { serviceTier: 'fast', reasoningEffort: 'xhigh', store: false } },
    });
    if (result.error) {
      throw new RuntimeExecutionError('Model execution failed.', { cause: result.error });
    }
    const usage = result.totalUsage;

    return {
      text: result.text,
      usage: {
        inputTokens: usage.inputTokens ?? 0,
        outputTokens: usage.outputTokens ?? 0,
        totalTokens: usage.totalTokens ?? 0,
        reasoningTokens: usage.reasoningTokens ?? 0,
      },
    };
  } catch (err) {
    throw new RuntimeExecutionError('Model execution failed.', { cause: err });
  }
};
