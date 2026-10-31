# Repository instructions

These instructions apply throughout `ms-agentic-be`. Keep shared agent guidance here; `CLAUDE.md` imports this file.

## 1. Required context

- Confirm the checkout and branch, preserve unrelated edits, and read [README.md](README.md) for setup and document owners.
- Before implementation or review, explicitly read this full file, the [conventions index](docs/conventions/README.md), every applicable topic, and the affected system contracts. An excerpt or unopened link does not satisfy this requirement.
- Before writing or reviewing Markdown, including skills and templates, read the [writing convention](docs/conventions/writing.md).
- Current code and tests establish implemented behavior. Design documents describe required behavior; verify deployed state separately when the task depends on it.
- Use Bun and `bun.lock`; keep dependency changes and the lockfile together. Use `bun install --frozen-lockfile` for an existing dependency set.
- Prefer a provider's CLI when it supports the operation. Keep authentication on its owning host and redact secrets from diagnostics.

## 2. Scope and authority

- Perform only the requested work. Follow the task's authority for commits, pushes, PR writes, provisioning, and deployment. Stage only named paths when authorized; after a commit, inspect `git show --stat`. Destructive actions require explicit consent.
- Preserve secrets and unrelated work. Keep local environments, credentials, review artifacts, and test data out of commits and images.
- Follow [CONTRIBUTING.md](CONTRIBUTING.md) for independent review, branches, readiness, exceptions, and personal acceptance. Keep incomplete PRs in draft; automated testing cannot supply the author's personal confirmation.
- Deploy only with explicit deployment authority. Preserve the manual release trigger, migrations, immutable-image verification, health checks, and recovery controls in the [staging runbook](docs/operations/staging.md).
- A convention change is a visible design change. Preserve accepted rules and operating limits unless the task changes them; update the owning document with an accepted contract change.
- Keep internal workflow names out of public PR titles, descriptions, reviews, comments, and commit messages.

## 3. Document owners

| Area | Owner |
| --- | --- |
| Setup, commands, and repository map | [README](README.md) |
| Contribution, branch selection, readiness, and merge policy | [Contributing](CONTRIBUTING.md) |
| Code, names, comments, boundaries, failures, verification, and writing | [Conventions](docs/conventions/README.md) |
| Product behavior and financial authority | [Requirements](docs/requirements.md) |
| Components, data scope, and product execution | [Architecture](docs/architecture.md), [runtime design](docs/design/runtime.md), and [task design](docs/design/tasks.md) |
| Scaffold delivery and deferred acceptance | [Scaffolding delivery](docs/design/scaffolding.md) |
| Verification commands and prerequisites | [Testing](docs/test.md) |
| Releases, credentials, provisioning, and recovery | [Staging runbook](docs/operations/staging.md) |
| Standing decisions and rationale | [ADRs](docs/ADRS/README.md) |
| Unfinished product and integration obligations | [TODO](docs/TODO.md) |

Keep each durable fact in one owner. Nested instructions may add local constraints without defining a competing glossary.
