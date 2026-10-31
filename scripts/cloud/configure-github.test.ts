// GitHub setup must not require imaginary checks or write anything during a dry run.
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

const workflow =
  'on:\n  pull_request:\njobs:\n  typecheck:\n    steps: [{run: echo types}]\n  test:\n    steps: [{run: echo tests}]\n  container-smoke:\n    steps: [{run: echo image}]\n';

type GitHubCase = {
  name: string;
  mode: string;
  content: string;
  active: boolean;
  status: number;
  dryRun?: boolean;
  existingProtection?: unknown;
  protectionError?: string;
};

test.each<GitHubCase>([
  { name: 'missing CI', mode: 'missing', content: '', active: false, status: 0 },
  { name: 'actual stable CI names', mode: 'present', content: workflow, active: true, status: 0 },
  {
    name: 'renamed check',
    mode: 'present',
    content: workflow.replace('  test:', '  renamed-test:'),
    active: false,
    status: 1,
  },
  {
    name: 'matrix-expanded check',
    mode: 'present',
    content: workflow.replace('  test:', '  test:\n    strategy: {matrix: {version: [1, 2]}}'),
    active: false,
    status: 1,
  },
  {
    name: 'missing CI with existing legacy contexts',
    mode: 'missing',
    content: '',
    active: false,
    status: 1,
    dryRun: false,
    existingProtection: { required_status_checks: { contexts: ['existing-check'] } },
  },
  {
    name: 'missing CI with existing app-bound checks',
    mode: 'missing',
    content: '',
    active: false,
    status: 1,
    dryRun: false,
    existingProtection: { required_status_checks: { checks: [{ context: 'existing-check', app_id: 123 }] } },
  },
  {
    name: 'an unrecognized protection 404',
    mode: 'missing',
    content: '',
    active: false,
    status: 1,
    dryRun: false,
    protectionError: 'Not Found',
  },
])(
  '$name performs no remote mutations',
  ({ mode, content, active, status, dryRun = true, existingProtection, protectionError }) => {
    const directory = mkdtempSync(join(tmpdir(), 'ms-agentic-github-test-'));
    const log = join(directory, 'calls.log');
    const gh = join(directory, 'gh');
    writeFileSync(
      gh,
      `#!/usr/bin/env bash
set -euo pipefail
printf '%s\\n' "$*" >> "$CALL_LOG"
if [[ "$*" == *'--method'* ]]; then echo 'Unexpected mutation' >&2; exit 90; fi
case "$2" in
  repos/hsignals/ms-agentic-be) printf '%s' '{"id":1432887469,"full_name":"hsignals/ms-agentic-be","default_branch":"main"}' ;;
  repos/hsignals/ms-agentic-be/branches/main/protection)
    if [[ -n "$PROTECTION_ERROR" ]]; then
      printf '%s' "$PROTECTION_RESPONSE"
      echo "gh: $PROTECTION_ERROR (HTTP 404)" >&2
      exit 1
    fi
    printf '%s' "$PROTECTION_RESPONSE" ;;
  'repos/hsignals/ms-agentic-be/contents/.github/workflows/ci.yml?ref=main')
    if [[ "$WORKFLOW_MODE" == missing ]]; then echo 'gh: Not Found (HTTP 404)' >&2; exit 1; fi
    printf '%s' "$WORKFLOW_RESPONSE" ;;
  *) echo 'Unexpected endpoint' >&2; exit 91 ;;
esac
`,
    );
    chmodSync(gh, 0o700);
    try {
      const args = [new URL('./configure-github.sh', import.meta.url).pathname];
      if (dryRun) {
        args.push('--dry-run');
      }
      const result = spawnSync('bash', args, {
        env: {
          ...process.env,
          PATH: `${directory}:${process.env.PATH ?? ''}`,
          CALL_LOG: log,
          WORKFLOW_MODE: mode,
          PROTECTION_ERROR: protectionError ?? (existingProtection === undefined ? 'Branch not protected' : ''),
          PROTECTION_RESPONSE: JSON.stringify(
            existingProtection ?? { message: protectionError ?? 'Branch not protected' },
          ),
          WORKFLOW_RESPONSE: JSON.stringify({
            type: 'file',
            encoding: 'base64',
            content: Buffer.from(content).toString('base64'),
          }),
        },
        encoding: 'utf8',
      });
      expect(result.status).toBe(status);
      expect(readFileSync(log, 'utf8')).not.toContain('--method');
      if (!dryRun && existingProtection !== undefined) {
        expect(result.stderr).toContain('refusing to clear them');
      }
      if (status === 0) {
        expect(result.stdout).toContain(
          active ? 'Default-branch CI verified; required checks selected:' : 'Required checks pending:',
        );
        expect(result.stdout).toContain(active ? '"typecheck"' : '"required_status_checks": null');
        expect(result.stdout).toContain('"shunjizhan"');
        expect(result.stdout).toContain('"dismiss_stale_reviews": false');
      }
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  },
);
