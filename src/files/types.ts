// Owns retained-file metadata and the trusted backend file-access contract.
import type { TrustedScope } from '@/runtime/scope.ts';
import { z } from 'zod';

/** Validates stored file ownership, access, and native evidence times. */
export const RetainedFileSchema = z.object({
  id: z.uuid(),
  accountId: z.string().min(1),
  channelId: z.string().min(1),
  runId: z.string().min(1),
  dataType: z.string().min(1),
  access: z.enum(['accountEvidence', 'channelPrivate']),
  provider: z.string().nullable(),
  connectionId: z.string().nullable(),
  savedAt: z.date(),
  retrievedAt: z.date().nullable(),
  /** Null means that source freshness is unknown. */
  sourceAsOf: z.date().nullable(),
  sizeBytes: z.number().int().nonnegative(),
  storageReference: z.string(),
  name: z.string().min(1),
  contentType: z.string().min(1),
});

/** A retained object and its original ownership and evidence times. */
export type RetainedFile = z.infer<typeof RetainedFileSchema>;

/** Application-owned persistence; its methods never grant access by object ID. */
export interface FileMetadataRepository {
  /** Saves complete metadata after object upload. @throws If persistence fails. */
  save(file: RetainedFile): Promise<void>;
  /** Reads internal metadata. @throws If the database read fails. */
  get(id: string): Promise<RetainedFile | undefined>;
  /** Records access without changing source freshness. @throws If the write fails. */
  recordRetrieval(id: string, at: Date): Promise<void>;
}

/** Bytes selected by trusted backend code for permitted retention. */
export type SaveFileInput = {
  runId: string;
  name: string;
  bytes: Uint8Array;
  dataType: string;
  access: RetainedFile['access'];
  contentType: string;
  provider?: string | null;
  connectionId?: string | null;
  sourceAsOf?: Date | null;
};

/** Authorized file data; callers must keep its bytes out of logs. */
export type FileContent = { file: RetainedFile, bytes: Uint8Array };

/** Protected backend operations, with authorization before object storage I/O. */
export interface RetainedFileService {
  /** Returns undefined for absent or forbidden files. @throws If metadata is invalid or unavailable. */
  get(scope: TrustedScope, id: string): Promise<RetainedFile | undefined>;
  /** Returns undefined for absent or forbidden files. @throws If storage or persistence fails. */
  read(scope: TrustedScope, id: string): Promise<FileContent | undefined>;
  /** Persists bytes and metadata before returning. @throws If storage or persistence fails. */
  save(scope: TrustedScope, input: SaveFileInput): Promise<RetainedFile>;
}
