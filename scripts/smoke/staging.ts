// Exercises authenticated synthetic staging boundaries without printing bearer credentials.
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { assertRestorationEvidence } from './restoration.ts';

const environment = z.object({
  STAGING_URL: z.url(),
  STAGING_AUTH_TOKEN: z.string().min(32),
  EXPECTED_DEPLOYMENT_ID: z.string().min(1),
  SMOKE_MODE: z.enum(['bootstrap', 'full']).default('full'),
}).parse(process.env);
const origin = new URL(environment.STAGING_URL);
if (origin.protocol !== 'https:') {
  throw new Error('Staging smoke requires an HTTPS service URL.');
}
const headers = {
  authorization: `Bearer ${environment.STAGING_AUTH_TOKEN}`,
  'content-type': 'application/json',
};
const healthSchema = z.object({ deploymentId: z.string() });
const fileSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  runId: z.uuid(),
  savedAt: z.string(),
  sizeBytes: z.number().int().nonnegative(),
});
const resultSchema = z.object({
  text: z.string(),
  files: z.array(fileSchema),
  sandboxId: z.string().nullable(),
  usage: z.unknown(),
});
const runSchema = z.object({
  id: z.uuid(),
  status: z.enum(['queued', 'running', 'completed', 'failed']),
  deploymentId: z.string().nullable(),
  result: resultSchema.nullable(),
  errorCode: z.string().nullable(),
});

/** Sends one bounded operational request; errors omit response bodies and secrets. */
const request = async (path: string, init: RequestInit = {}): Promise<Response> => {
  return fetch(new URL(path, origin), { ...init, signal: AbortSignal.timeout(180_000) });
};

/** Checks a response status before callers parse its public contract. */
const assertStatus = (response: Response, expected: number, operation: string): void => {
  if (response.status !== expected) {
    throw new Error(`${operation}: expected HTTP ${expected}, received ${response.status}.`);
  }
};

/** Retrieves a completed durable run, rejecting failed, stale, and timed-out outcomes. */
const waitForRun = async (runId: string): Promise<z.infer<typeof runSchema>> => {
  const deadline = Date.now() + 180_000;
  while (Date.now() < deadline) {
    const response = await request(`/v1/jobs/${runId}`, { headers });
    assertStatus(response, 200, 'Retrieve run');
    const run = runSchema.parse(await response.json());
    if (run.status === 'failed') {
      throw new Error(`Synthetic run failed with code ${run.errorCode ?? 'unknown'}.`);
    }
    if (run.status === 'completed') {
      if (run.deploymentId !== environment.EXPECTED_DEPLOYMENT_ID) {
        throw new Error('Run was completed by an unexpected deployment.');
      }
      return run;
    }
    await Bun.sleep(2_000);
  }
  throw new Error('Synthetic run did not complete within three minutes.');
};

const startedAt = Date.now();
const healthResponse = await request('/health');
assertStatus(healthResponse, 200, 'Public health');
const health = healthSchema.parse(await healthResponse.json());
if (health.deploymentId !== environment.EXPECTED_DEPLOYMENT_ID) {
  throw new Error('Public health identified an unexpected deployment.');
}
const readiness = await request('/health/ready');
if (environment.SMOKE_MODE === 'bootstrap') {
  assertStatus(readiness, 503, 'Bootstrap readiness');
  console.log(JSON.stringify({
    mode: 'bootstrap',
    deploymentId: health.deploymentId,
    health: 'passed',
    readiness: 'incomplete',
    liveAcceptance: 'pending database and E2B configuration',
    durationMs: Date.now() - startedAt,
  }));
} else {
  assertStatus(readiness, 200, 'Full readiness');
  const unauthenticated = await request('/v1/runs', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ prompt: 'Reply with only 42.', sandbox: false }),
  });
  assertStatus(unauthenticated, 401, 'Unauthenticated paid work');
  const wrongToken = await request('/v1/runs', {
    method: 'POST',
    headers: { ...headers, authorization: 'Bearer invalid-synthetic-staging-identity' },
    body: JSON.stringify({ prompt: 'Reply with only 42.', sandbox: false }),
  });
  assertStatus(wrongToken, 401, 'Invalid identity');
  const foregroundResponse = await request('/v1/runs', {
    method: 'POST',
    headers,
    body: JSON.stringify({ prompt: 'Reply with only the number 42.', sandbox: false }),
  });
  assertStatus(foregroundResponse, 200, 'Foreground model execution');
  const foreground = resultSchema.extend({ runId: z.uuid() }).parse(await foregroundResponse.json());
  if (foreground.text.trim() !== '42') {
    throw new Error('Foreground model response did not match the expected answer.');
  }
  await waitForRun(foreground.runId);

  const nonce = randomBytes(24).toString('hex');
  const expectedBytes = new TextEncoder().encode(`42\nnonce:${nonce}\n`);
  const submission = await request('/v1/jobs', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      prompt:
        `Use executeCode with Python to compute 6 * 7. Write its decimal result followed by one newline, then the literal line nonce:${nonce} followed by one newline, to /home/user/calculation.txt. Call retainFile with path /home/user/calculation.txt, dataType synthetic-calculation, and contentType text/plain. Reply briefly after the tools finish.`,
      sandbox: true,
    }),
  });
  assertStatus(submission, 202, 'Background submission');
  const queued = z.object({ runId: z.uuid(), jobId: z.string() }).parse(await submission.json());
  const completed = await waitForRun(queued.runId);
  const result = resultSchema.parse(completed.result);
  if (result.sandboxId === null) {
    throw new Error('Background result did not identify a real sandbox.');
  }
  const file = result.files.find(candidate => candidate.name === 'calculation.txt');
  if (file === undefined) {
    throw new Error('Background result did not retain calculation.txt.');
  }
  const content = await request(`/v1/files/${file.id}/content`, { headers });
  assertStatus(content, 200, 'Private retained-file content');
  const bytes = new Uint8Array(await content.arrayBuffer());
  if (
    file.runId !== queued.runId || !Buffer.from(bytes).equals(expectedBytes)
    || file.sizeBytes !== expectedBytes.byteLength
  ) {
    throw new Error('Retained calculation file did not contain the expected bytes.');
  }
  const unauthenticatedFile = await request(`/v1/files/${file.id}/content`);
  assertStatus(unauthenticatedFile, 401, 'Unauthenticated retained-file access');

  const restoredResponse = await request('/v1/runs', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      prompt:
        `Use executeCode to read the restored file at /home/user/retained/${file.id}/calculation.txt. Copy its bytes unchanged to /home/user/restoration-copy.txt. Call retainFile with path /home/user/restoration-copy.txt, dataType synthetic-restoration, and contentType text/plain. Reply briefly after the tools finish.`,
      restoreFileIds: [file.id],
      sandbox: true,
    }),
  });
  assertStatus(restoredResponse, 200, 'Fresh sandbox restoration');
  const restored = resultSchema.extend({ runId: z.uuid() }).parse(await restoredResponse.json());
  await waitForRun(restored.runId);
  const restoredFile = restored.files.find(candidate => candidate.name === 'restoration-copy.txt');
  let restoredBytes: Uint8Array | undefined;
  if (restoredFile !== undefined) {
    const restoredContent = await request(`/v1/files/${restoredFile.id}/content`, { headers });
    assertStatus(restoredContent, 200, 'Fresh retained restoration copy');
    restoredBytes = new Uint8Array(await restoredContent.arrayBuffer());
  }
  assertRestorationEvidence({
    runId: queued.runId,
    sandboxId: result.sandboxId,
    fileId: file.id,
    bytes: expectedBytes,
  }, {
    runId: restored.runId,
    sandboxId: restored.sandboxId,
    file: restoredFile,
    bytes: restoredBytes,
  });
  const metadataResponse = await request(`/v1/files/${file.id}`, { headers });
  assertStatus(metadataResponse, 200, 'Retained-file metadata');
  const metadata = fileSchema.parse(await metadataResponse.json());
  if (metadata.savedAt !== file.savedAt) {
    throw new Error('Restoration changed the original retained-file timestamp.');
  }
  console.log(JSON.stringify({
    mode: 'full',
    deploymentId: health.deploymentId,
    foregroundRunId: foreground.runId,
    backgroundRunId: queued.runId,
    restoreRunId: restored.runId,
    fileId: file.id,
    fileBytes: file.sizeBytes,
    restorationFileId: restoredFile?.id,
    originalSandboxId: result.sandboxId,
    restoredSandboxId: restored.sandboxId,
    usage: { foreground: foreground.usage, background: result.usage, restoration: restored.usage },
    durationMs: Date.now() - startedAt,
    redeploymentAcceptance: 'requires a second deployment with this evidence preserved',
  }));
}
