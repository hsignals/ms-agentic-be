// Owns the runtime's trusted caller inputs and durable completion boundary.
import type {
  FileMetadataRepository,
  RetainedFile,
  RetainedFileService,
} from '@/files/types.ts';
import type { TrustedScope } from './scope.ts';

export type { TrustedScope } from './scope.ts';

/** One independent invocation or queue attempt; every invocation gets fresh state. */
export type RunInput = {
  runId: string;
  prompt: string;
  scope: TrustedScope;
  restoreFileIds?: string[] | undefined;
  /** Enables sandbox tools; the sandbox is created only when a tool needs it. */
  sandbox?: boolean | undefined;
};

/** Aggregate native model usage across the complete tool loop. */
export type RunUsage = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  reasoningTokens: number;
};

/** Durable completion data; sandboxId is an identifier, never its access token. */
export type RunResult = {
  text: string;
  files: RetainedFile[];
  usage: RunUsage | null;
  sandboxId: string | null;
};

/** Saves the required result before the runtime destroys an execution workspace. */
export interface RunResultRepository {
  /** Persists the result while execution is running. @throws If required persistence fails. */
  save(input: RunInput, result: RunResult): Promise<void>;
}

/** Secrets remain in backend SDK clients and are never copied into run context. */
export type RuntimeConfig = {
  databaseUrl?: string;
  openaiApiKey?: string;
  e2bApiKey?: string;
  gcsBucketName?: string;
  sandboxTimeoutMs?: number;
};

/** Composition inputs from the application; repositories own database operations. */
export type RuntimeDependencies = {
  config: RuntimeConfig;
  files: FileMetadataRepository;
  results: RunResultRepository;
};

/** Shared SDK infrastructure with fresh invocation context and workspace state. */
export interface Runtime {
  files: RetainedFileService;
  /** Verifies access to migrated native Mastra storage. @throws If configuration or storage access fails. */
  initialize(): Promise<void>;
  /** Persists completion before sandbox cleanup. @throws If execution, persistence, or cleanup fails. */
  execute(input: RunInput): Promise<RunResult>;
  /** Closes the owned native database pool. @throws If pool shutdown fails. */
  close(): Promise<void>;
}
