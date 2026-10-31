# MyStacks agent backend

## 1. Purpose

`ms-agentic-be` owns the MyStacks personal investing agent backend. Phase 1 focuses on concise financial answers and reports in chat, supported by provider data, calculations, and background tasks. The [scaffold delivery](docs/design/scaffolding.md) defines the Bun/Hono API, separate worker, storage, sandbox integration, and dedicated staging foundation; product workflows remain separate implementation work.

The accepted financial-data baseline uses **SnapTrade** for target exchange and brokerage accounts, **Zerion** for supported EVM and Solana wallets, and the direct **Hyperliquid API through Webshare** at low priority. Current portfolio analysis requires fresh or near-fresh relevant account evidence; provider coverage and freshness gaps remain explicit in the [provider decision](docs/ADRS/0018-managed-financial-data-providers.md) and [current-evidence decision](docs/ADRS/0019-current-portfolio-evidence.md).

**Bird** connects our Apple Messages for Business account to the shared backend. The iMessage channel supports scheduled and proactive work; WhatsApp supports chat and one-off analysis while scheduling, proactive insights, and templates are deferred. **GCS** retains useful analysis files, with metadata and small results in PostgreSQL.

## 2. Local development

The repository provides the runnable API, background worker, and local storage setup. Use Bun and `bun.lock`. If `.env` is absent, create it from `.env.example`; preserve an existing file. For the local Compose resources, set `DATABASE_URL=postgres://agentic:agentic_local@127.0.0.1:5432/agentic` and `REDIS_URL=redis://127.0.0.1:6379`. These are local development credentials; cloud secrets remain separate.

```sh
bun install --frozen-lockfile
docker compose up -d --wait
bun run db:migrate
bun run dev
```

After editing application schemas, run `bun run db:generate` and review the SQL and generation metadata together. Commit both before running `bun run db:migrate`, which initializes application and native Mastra storage under their separate owners.

After configuring the remaining values in `.env.example`, run `bun run worker` in another terminal. Without provider/storage credentials, bootstrap health remains available and protected work reports incomplete configuration. Install staged-file hooks explicitly with `bun run hooks:install`. [Testing](docs/test.md) lists required checks, isolated integration resources, and container verification. The [staging runbook](docs/operations/staging.md) owns provisioning and manual deployment.

Database creation/URL, the E2B key, and dependent live tests are deferred. Full E2B integration remains in the foundation scope; bootstrap staging health does not establish full acceptance. The three new scaffold PRs remain draft above existing PR #1.

## 3. Documentation

- [Context](CONTEXT.md): project status, document ownership, and decision boundaries.
- [Requirements](docs/requirements.md): product behavior, financial authority, and scale assumptions.
- [Architecture](docs/architecture.md): tentative overall design using the selected Mastra shared runtime, E2B execution workspaces, one Tiger Cloud PostgreSQL database, private GCS analysis-file storage, a GCP Cloud Run API service and separate worker pool, and dedicated managed Valkey queue storage, with direct chat and main-agent continuations.
- [Architecture diagram](docs/architecture.html): browser-viewable conversation flow and trusted backend boundaries.
- [Architecture decision records](docs/ADRS/README.md): explicit decisions, alternatives, and accepted trade-offs for runtime execution, security, channels, memory, storage, and product boundaries.
- [User stories](docs/user-stories/README.md): the complete Phase 1 experience, observable outcomes, and open product decisions.
- [Technical designs](docs/design/README.md): responsibilities and flows supporting those stories, including [turn and subagent examples](docs/design/runtime.md) and [proactive investigation behavior](docs/design/tasks.md); the overall architecture remains under review.
- [Scaffolding delivery](docs/design/scaffolding.md): three new draft PRs above existing PR #1, with foundation/staging scope, private retained-file storage, verification, budget, and deferred dependencies.
- [Contributor guide](CONTRIBUTING.md) and [conventions](docs/conventions/README.md): required reading, branch policy, independent review, checks, and personal acceptance.
- [Testing](docs/test.md) and [staging runbook](docs/operations/staging.md): command contracts, suite prerequisites, provisioning, release, and recovery.
