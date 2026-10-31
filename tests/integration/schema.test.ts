// Verifies generated application migrations reject invalid values at the PostgreSQL boundary.

import postgres from 'postgres';
import {
  describe,
  expect,
  it,
} from 'vitest';
import { loadConfig } from '../../src/config';

const config = loadConfig();

describe('application schema constraints', () => {
  it.each([
    { mode: 'unknown', status: 'queued', constraint: 'analysis_runs_mode_check' },
    { mode: 'background', status: 'unknown', constraint: 'analysis_runs_status_check' },
  ])('rejects invalid values through $constraint', async ({ mode, status, constraint }) => {
    if (config.databaseUrl === undefined) {
      throw new Error('Disposable integration database is required');
    }
    const client = postgres(config.databaseUrl, { max: 1 });
    try {
      await expect(client`
        INSERT INTO analysis_runs (id, account_id, channel_id, mode, status)
        VALUES (${crypto.randomUUID()}, 'schema-account', 'schema-channel', ${mode}, ${status})
      `).rejects.toMatchObject({ code: '23514', constraint_name: constraint });
    } finally {
      await client.end();
    }
  });

  it.each([
    { access: 'unknown', sizeBytes: 0, constraint: 'retained_files_access_check' },
    { access: 'channelPrivate', sizeBytes: -1, constraint: 'retained_files_size_check' },
  ])('rejects invalid values through $constraint', async ({ access, sizeBytes, constraint }) => {
    if (config.databaseUrl === undefined) {
      throw new Error('Disposable integration database is required');
    }
    const client = postgres(config.databaseUrl, { max: 1 });
    try {
      const runId = crypto.randomUUID();
      await client`
        INSERT INTO analysis_runs (id, account_id, channel_id, mode, status)
        VALUES (${runId}, 'schema-account', 'schema-channel', 'background', 'running')
      `;
      await expect(client`
        INSERT INTO retained_files
          (id, account_id, channel_id, run_id, data_type, access, saved_at, size_bytes, storage_reference, name, content_type)
        VALUES
          (${crypto.randomUUID()}, 'schema-account', 'schema-channel', ${runId}, 'synthetic', ${access},
           ${new Date()}, ${sizeBytes}, 'gs://synthetic-bucket/synthetic-object', 'calculation.txt', 'text/plain')
      `).rejects.toMatchObject({ code: '23514', constraint_name: constraint });
    } finally {
      await client.end();
    }
  });
});
