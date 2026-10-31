// Checks retained bytes and identities that distinguish restoration from a model-written answer.

/** Original run evidence held by the smoke runner, outside the restoration prompt. */
export type OriginalFileEvidence = {
  runId: string;
  sandboxId: string;
  fileId: string;
  bytes: Uint8Array;
};

/** Fresh run metadata and content read back through the protected backend file route. */
export type RestoredFileEvidence = {
  runId: string;
  sandboxId: string | null;
  file: { id: string, runId: string, sizeBytes: number } | undefined;
  bytes: Uint8Array | undefined;
};

/**
 * Requires a new run, sandbox, retained object, and an exact copy of the original bytes.
 * @throws Error when fresh retention or the protected byte comparison is missing or incorrect.
 */
export const assertRestorationEvidence = (original: OriginalFileEvidence, restored: RestoredFileEvidence): void => {
  if (restored.runId === original.runId || restored.sandboxId === null || restored.sandboxId === original.sandboxId) {
    throw new Error('Restoration did not execute in a new run and sandbox.');
  }
  if (restored.file === undefined || restored.bytes === undefined) {
    throw new Error('Restoration did not retain a new verification file.');
  }
  if (restored.file.id === original.fileId || restored.file.runId !== restored.runId) {
    throw new Error('Restoration verification file does not belong to the new run.');
  }
  if (
    restored.file.sizeBytes !== original.bytes.byteLength
    || !Buffer.from(restored.bytes).equals(original.bytes)
  ) {
    throw new Error('Restoration verification file did not match the original retained bytes.');
  }
};
