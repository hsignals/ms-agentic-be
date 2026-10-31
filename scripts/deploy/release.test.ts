// Missing deferred credentials must stop a release before any running resource changes.
import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  expect,
  test,
} from 'vitest';

test.each(['database-url', 'migrate-database-url', 'e2b-api-key', 'valkey-ca-cert'])(
  'full deployment rejects missing %s before cloud mutations',
  missingSecret => {
    const directory = mkdtempSync(join(tmpdir(), 'ms-agentic-release-test-'));
    const log = join(directory, 'calls.log');
    const gcloud = join(directory, 'gcloud');
    const docker = join(directory, 'docker');
    writeFileSync(
      gcloud,
      `#!/usr/bin/env bash
set -euo pipefail
printf '%s\\n' "$*" >> "$CALL_LOG"
if [[ "$1 $2 $3" == 'secrets versions list' ]]; then
  if [[ "$4" != "$MISSING_SECRET" ]]; then printf '1\\n'; fi
elif [[ "$1 $2 $3" == 'run services describe' || "$1 $2 $3" == 'run worker-pools describe' ]]; then
  echo 'NOT_FOUND: resource does not exist' >&2
  exit 1
else
  echo 'Unexpected cloud command' >&2
  exit 90
fi
`,
    );
    writeFileSync(docker, '#!/usr/bin/env bash\nprintf "0123456789abcdef0123456789abcdef01234567\\n"\n');
    chmodSync(gcloud, 0o700);
    chmodSync(docker, 0o700);
    try {
      const result = spawnSync('bash', [new URL('./release.sh', import.meta.url).pathname], {
        env: {
          ...process.env,
          PATH: `${directory}:${process.env.PATH ?? ''}`,
          CALL_LOG: log,
          MISSING_SECRET: missingSecret,
          DEPLOY_MODE: 'full',
          IMAGE_DIGEST: `sha256:${'a'.repeat(64)}`,
          DEPLOYMENT_ID: 'credential-gate-test',
          DEPLOY_ARTIFACT_DIR: join(directory, 'evidence'),
        },
        encoding: 'utf8',
      });
      expect(result.status).toBe(1);
      expect(result.stderr).toContain(`Required secret has no enabled version: ${missingSecret}`);
      expect(readFileSync(log, 'utf8')).not.toMatch(/run (deploy|jobs|services update|worker-pools update)/);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  },
);
