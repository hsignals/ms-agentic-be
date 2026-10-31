// Authorizes retained-file access and transfers bytes using the native GCS SDK.
import { randomUUID } from 'node:crypto';
import { Storage } from '@google-cloud/storage';
import {
  RuntimeExecutionError,
  RuntimeUnavailableError,
} from '@/runtime/errors.ts';
import type { TrustedScope } from '@/runtime/scope.ts';
import type {
  FileMetadataRepository,
  RetainedFile,
  RetainedFileService,
} from './types.ts';
import { RetainedFileSchema } from './types.ts';

/** Builds an object name bound to stored ownership. It has no intentional exception path. */
const buildObjectName = (accountId: string, id: string): string => {
  return `accounts/${encodeURIComponent(accountId)}/files/${id}`;
};

/** Checks account evidence and channel privacy. It has no intentional exception path. */
const canReadFile = (scope: TrustedScope, file: RetainedFile): boolean => {
  return file.accountId === scope.accountId
    && (file.access === 'accountEvidence' || file.channelId === scope.channelId);
};

/**
 * Creates one backend file boundary using Application Default Credentials.
 * @throws If native GCS client construction fails.
 */
export const createFileService = (
  repository: FileMetadataRepository,
  bucketName: string | undefined,
): RetainedFileService => {
  const storage = new Storage();

  /** Requires the backend bucket. @throws {RuntimeUnavailableError} If it is absent. */
  const getBucket = () => {
    if (!bucketName) {
      throw new RuntimeUnavailableError('Retained-file storage is not configured.');
    }

    return storage.bucket(bucketName);
  };

  /**
   * Resolves and authorizes metadata before object access.
   * @throws {RuntimeExecutionError} If stored metadata or its storage binding is invalid.
   * @throws If the repository read fails.
   */
  const get: RetainedFileService['get'] = async (scope, id) => {
    const value = await repository.get(id);
    if (!value) {
      return;
    }

    const parsed = RetainedFileSchema.safeParse(value);
    if (!parsed.success) {
      throw new RuntimeExecutionError('Retained-file metadata is invalid.');
    }

    const file = parsed.data;
    if (!canReadFile(scope, file)) {
      return;
    }

    const expected = `gs://${bucketName}/${buildObjectName(file.accountId, file.id)}`;
    if (file.storageReference !== expected) {
      throw new RuntimeExecutionError('Retained-file storage binding is invalid.');
    }

    return file;
  };

  return {
    get,
    /** @throws {RuntimeExecutionError} If an authorized transfer or access write fails. */
    read: async (scope, id) => {
      const file = await get(scope, id);
      if (!file) {
        return;
      }

      const bucket = getBucket();
      try {
        // simplified: buffer scaffold files; stream when retained datasets exceed the process memory budget.
        const [bytes] = await bucket.file(buildObjectName(file.accountId, file.id)).download();
        const retrievedAt = new Date();
        await repository.recordRetrieval(file.id, retrievedAt);

        return { file: { ...file, retrievedAt }, bytes };
      } catch (err) {
        throw new RuntimeExecutionError('Retained-file retrieval failed.', { cause: err });
      }
    },
    /** @throws {RuntimeExecutionError} If bytes or required metadata cannot be saved. */
    save: async (scope, input) => {
      const bucket = getBucket();
      const id = randomUUID();
      const objectName = buildObjectName(scope.accountId, id);
      const file: RetainedFile = {
        id,
        ...scope,
        runId: input.runId,
        name: input.name,
        dataType: input.dataType,
        access: input.access,
        contentType: input.contentType,
        provider: input.provider ?? null,
        connectionId: input.connectionId ?? null,
        savedAt: new Date(),
        retrievedAt: null,
        sourceAsOf: input.sourceAsOf ?? null,
        sizeBytes: input.bytes.byteLength,
        storageReference: `gs://${bucketName}/${objectName}`,
      };

      if (!RetainedFileSchema.safeParse(file).success) {
        throw new RuntimeExecutionError('Retained-file metadata is invalid.');
      }

      try {
        await bucket.file(objectName).save(Buffer.from(input.bytes), {
          resumable: false,
          metadata: {
            contentType: file.contentType,
            cacheControl: 'private, no-store',
            metadata: {
              accountId: file.accountId,
              channelId: file.channelId,
              runId: file.runId,
              dataType: file.dataType,
              savedAt: file.savedAt.toISOString(),
              sourceAsOf: file.sourceAsOf?.toISOString() ?? 'unknown',
            },
          },
          preconditionOpts: { ifGenerationMatch: 0 },
        });
        // Keep successfully uploaded bytes if metadata persistence fails; the run fails visibly.
        await repository.save(file);

        return file;
      } catch (err) {
        throw new RuntimeExecutionError('Retained-file persistence failed.', { cause: err });
      }
    },
  };
};
