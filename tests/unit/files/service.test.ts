// Verifies ownership gates and persistence semantics without cloud credentials.
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { createFileService } from '@/files/service.ts';
import type { RetainedFile } from '@/files/types.ts';

const gcs = vi.hoisted(() => ({
  save: vi.fn(),
  download: vi.fn(),
  file: vi.fn(),
  bucket: vi.fn(),
}));

vi.mock('@google-cloud/storage', () => ({
  Storage: class {
    bucket = gcs.bucket;
  },
}));

/** Builds independently fixed ownership and evidence times. It has no intentional exception path. */
const buildFile = (): RetainedFile => ({
  id: 'b0784461-2bc9-44e5-aad7-e3b732b71602',
  accountId: 'account-a',
  channelId: 'channel-a',
  runId: 'run-a',
  dataType: 'synthetic-calculation',
  access: 'channelPrivate',
  provider: null,
  connectionId: null,
  savedAt: new Date('2026-10-01T00:00:00Z'),
  retrievedAt: null,
  sourceAsOf: new Date('2026-09-30T00:00:00Z'),
  sizeBytes: 2,
  storageReference: 'gs://private-bucket/accounts/account-a/files/b0784461-2bc9-44e5-aad7-e3b732b71602',
  name: 'result.txt',
  contentType: 'text/plain',
});

/** Builds only the repository methods consumed by this boundary. It has no intentional exception path. */
const buildRepository = () => ({
  save: vi.fn<(file: RetainedFile) => Promise<void>>().mockResolvedValue(undefined),
  get: vi.fn<(id: string) => Promise<RetainedFile | undefined>>().mockResolvedValue(buildFile()),
  recordRetrieval: vi.fn<(id: string, at: Date) => Promise<void>>().mockResolvedValue(undefined),
});

describe('retained-file access', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gcs.save.mockResolvedValue(undefined);
    gcs.download.mockResolvedValue([Buffer.from('42')]);
    gcs.file.mockReturnValue({ save: gcs.save, download: gcs.download });
    gcs.bucket.mockReturnValue({ file: gcs.file });
  });

  it('rejects another account before touching object storage', async () => {
    const repository = buildRepository();
    const service = createFileService(repository, 'private-bucket');

    expect(await service.read({ accountId: 'account-b', channelId: 'channel-a' }, buildFile().id)).toBeUndefined();
    expect(gcs.bucket).not.toHaveBeenCalled();
    expect(repository.recordRetrieval).not.toHaveBeenCalled();
  });

  it('keeps channel-private files in their originating channel', async () => {
    const service = createFileService(buildRepository(), 'private-bucket');

    expect(await service.read({ accountId: 'account-a', channelId: 'channel-b' }, buildFile().id)).toBeUndefined();
    expect(gcs.download).not.toHaveBeenCalled();
  });

  it('allows account evidence across authorized linked channels and preserves freshness', async () => {
    const repository = buildRepository();
    repository.get.mockResolvedValue({ ...buildFile(), access: 'accountEvidence' });
    const service = createFileService(repository, 'private-bucket');

    const content = await service.read({ accountId: 'account-a', channelId: 'channel-b' }, buildFile().id);

    expect(content?.bytes).toEqual(Buffer.from('42'));
    expect(content?.file.channelId).toBe('channel-a');
    expect(content?.file.savedAt).toEqual(new Date('2026-10-01T00:00:00Z'));
    expect(content?.file.sourceAsOf).toEqual(new Date('2026-09-30T00:00:00Z'));
    expect(content?.file.retrievedAt).toBeInstanceOf(Date);
    expect(repository.recordRetrieval).toHaveBeenCalledWith(buildFile().id, content?.file.retrievedAt);
  });

  it('rejects unknown stored access values instead of widening access', async () => {
    const repository = buildRepository();
    const file = buildFile();
    Reflect.set(file, 'access', 'public');
    repository.get.mockResolvedValue(file);
    const service = createFileService(repository, 'private-bucket');

    await expect(service.read({ accountId: 'account-a', channelId: 'channel-a' }, file.id)).rejects.toThrow(
      'metadata is invalid',
    );
    expect(gcs.download).not.toHaveBeenCalled();
  });

  it('rejects a stored reference that points outside its owning object', async () => {
    const repository = buildRepository();
    repository.get.mockResolvedValue({ ...buildFile(), storageReference: 'gs://other-bucket/private' });
    const service = createFileService(repository, 'private-bucket');

    await expect(service.read({ accountId: 'account-a', channelId: 'channel-a' }, buildFile().id)).rejects.toThrow(
      'binding is invalid',
    );
    expect(gcs.download).not.toHaveBeenCalled();
  });

  it('saves private bytes before complete metadata and keeps unknown source freshness', async () => {
    const repository = buildRepository();
    repository.save.mockImplementation(async () => {
      expect(gcs.save).toHaveBeenCalledOnce();
    });
    const service = createFileService(repository, 'private-bucket');

    const file = await service.save({ accountId: 'account-a', channelId: 'channel-a' }, {
      runId: 'run-a',
      name: 'result.txt',
      bytes: Buffer.from('42'),
      dataType: 'synthetic-calculation',
      access: 'channelPrivate',
      contentType: 'text/plain',
    });

    expect(file.sourceAsOf).toBeNull();
    expect(file.sizeBytes).toBe(2);
    expect(file.retrievedAt).toBeNull();
    expect(repository.save).toHaveBeenCalledWith(file);
    expect(gcs.save).toHaveBeenCalledWith(
      Buffer.from('42'),
      expect.objectContaining({
        preconditionOpts: { ifGenerationMatch: 0 },
        metadata: expect.objectContaining({ cacheControl: 'private, no-store' }),
      }),
    );
  });

  it('fails completion when metadata persistence fails after upload', async () => {
    const repository = buildRepository();
    repository.save.mockRejectedValue(new Error('database password secret'));
    const service = createFileService(repository, 'private-bucket');

    await expect(service.save({ accountId: 'account-a', channelId: 'channel-a' }, {
      runId: 'run-a',
      name: 'result.txt',
      bytes: Buffer.from('42'),
      dataType: 'synthetic-calculation',
      access: 'channelPrivate',
      contentType: 'text/plain',
    })).rejects.toThrow('Retained-file persistence failed.');
    expect(gcs.save).toHaveBeenCalledOnce();
  });

  it('does not present failed retrieval metadata persistence as a successful read', async () => {
    const repository = buildRepository();
    repository.recordRetrieval.mockRejectedValue(new Error('private database details'));
    const service = createFileService(repository, 'private-bucket');

    await expect(service.read({ accountId: 'account-a', channelId: 'channel-a' }, buildFile().id)).rejects.toThrow(
      'Retained-file retrieval failed.',
    );
  });
});
