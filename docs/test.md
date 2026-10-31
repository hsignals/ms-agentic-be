# Testing and local checks

This document owns local verification commands, prerequisites, and suite boundaries. [Verification conventions](conventions/verification.md) own evidence quality; [CONTRIBUTING.md](../CONTRIBUTING.md) owns readiness.

## 1. Prerequisites and configuration

Use the Bun version pinned by the repository and install with `bun install --frozen-lockfile`. A Docker-compatible runtime is required for disposable PostgreSQL/Valkey integration suites and container smoke checks. Routine tests use synthetic configuration, disable developer environment loading, and do not require OpenAI or E2B credentials.

Keep actual `.env` values local. Application development may use `docker compose up -d --wait` and `bun run db:migrate`; the test runner owns separate isolated resources and must never infer a live database from a developer URL.

## 2. Check commands

| Command | Purpose |
| --- | --- |
| `bun run db:generate` | Generate application migrations and snapshots from Drizzle schemas. |
| `bun run format` | Apply configured formatting. |
| `bun run format:check` | Verify formatting without changing files. |
| `bun run lint` | Run Biome and applicable custom code rules. |
| `bun run typecheck` | Run strict TypeScript checks. |
| `bun run check:docs` | Check local Markdown links. |
| `bun run check:imports` | Check repository dependency boundaries. |
| `bun run check:names` | Check scoped naming rules. |
| `bun run check:logs` | Check logging rules. |
| `bun run check:comments` | Check production headers and exported TSDoc coverage. |
| `bun run check:repository` | Run all repository checks, including production headers and exported TSDoc. |
| `bun run check` | Run format, lint, type, and repository checks. |
| `bun run test:unit` | Run deterministic unit and process tests. |
| `bun run test:integration` | Run tests with disposable PostgreSQL and Valkey. |
| `bun run test` | Run unit and integration suites. |
| `bun run test:container` | Build/start the container and verify health and shutdown. |

Run focused checks while developing. Before a code push or PR, run `bun run check`, `bun run test`, and `bun run test:container`. Docs-only changes run the applicable formatting and document checks without application tests. Hook installation is explicit with `bun run hooks:install`; dependency installation must not mutate Git configuration.

## 3. Suite boundaries

Unit tests cover pure decisions and narrow controlled dependencies. Local integration tests cover real database/queue initialization, persistence, ownership, failure behavior, attempt accounting, and cleanup. The integration runner owns unique disposable resources, dynamic ports, initialization, and cleanup after success, failure, or interruption; cleanup must preserve the test's failure exit status.

Container smoke verifies image construction, synthetic health/startup, and graceful shutdown. CI exposes `typecheck`, `test`, and `container-smoke`; their results prove only their configured scope.

Repository checks cover Markdown links/anchors and shared-skill links; imports from production into tests/scripts/entrypoints and non-HTTP code into Hono; schema/predicate naming; obvious unsafe logging; production responsibility headers; and exported TSDoc. Biome custom rules cover angle assertions, bare catches, and single-line ternaries. Human review still owns semantic names, complete failure contracts, privacy, and unchanged-consumer coverage.

## 4. Live acceptance

The [staging runbook](operations/staging.md) owns authenticated smoke and deployment commands. Keep live checks short: real foreground model execution, queued E2B calculation, retained-file persistence/restoration, and redeployment of the same candidate.

Database creation and its URL, the E2B key, and dependent live tests are deferred for the current scaffold delivery. Full E2B integration remains required in code. Bootstrap health evidence must remain distinct from full acceptance, and the runtime/cloud PRs remain draft pending the required evidence and personal acceptance.

For each result, record command, outcome, tested revision, and missing prerequisites. Do not present a skipped test, a synthetic provider response, or a model-written answer as a live pass.
