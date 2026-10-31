// Restoration proof rejects a remembered answer unless a fresh retained file preserves unknown original bytes.
import {
  expect,
  test,
} from 'vitest';
import type {
  OriginalFileEvidence,
  RestoredFileEvidence,
} from './restoration.ts';
import { assertRestorationEvidence } from './restoration.ts';

const original: OriginalFileEvidence = {
  runId: 'original-run',
  sandboxId: 'original-sandbox',
  fileId: 'original-file',
  bytes: new TextEncoder().encode('42\nnonce:runner-only-random-value\n'),
};
const restoredFile = { id: 'verification-file', runId: 'restored-run', sizeBytes: original.bytes.byteLength };
const restored: RestoredFileEvidence = {
  runId: 'restored-run',
  sandboxId: 'restored-sandbox',
  file: restoredFile,
  bytes: Uint8Array.from(original.bytes),
};

test('accepts an exact retained copy from a distinct run and sandbox', () => {
  expect(() => assertRestorationEvidence(original, restored)).not.toThrow();
});

test.each<{ name: string, evidence: RestoredFileEvidence }>([
  { name: 'the original run', evidence: { ...restored, runId: original.runId } },
  { name: 'the original sandbox', evidence: { ...restored, sandboxId: original.sandboxId } },
  { name: 'an absent sandbox', evidence: { ...restored, sandboxId: null } },
  { name: 'missing new retention', evidence: { ...restored, file: undefined } },
  { name: 'missing retrieved bytes', evidence: { ...restored, bytes: undefined } },
  {
    name: 'the unchanged original file ID',
    evidence: { ...restored, file: { ...restoredFile, id: original.fileId } },
  },
  {
    name: 'a file bound to another run',
    evidence: { ...restored, file: { ...restoredFile, runId: original.runId } },
  },
  { name: 'a guessed answer without the nonce', evidence: { ...restored, bytes: new TextEncoder().encode('42\n') } },
  {
    name: 'an incorrect retained size',
    evidence: { ...restored, file: { ...restoredFile, sizeBytes: 3 } },
  },
])('rejects $name', ({ evidence }) => {
  expect(() => assertRestorationEvidence(original, evidence)).toThrow();
});
