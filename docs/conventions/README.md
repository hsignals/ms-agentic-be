# Contributor conventions

Before implementation or review, read the full [repository instructions](../../AGENTS.md), this index, the applicable topics below, and [CONTRIBUTING.md](../../CONTRIBUTING.md). Read the system contract that owns the behavior you change; a startup excerpt does not satisfy this requirement.

## 1. Reading map

| Topic | Read when | Owns |
| --- | --- | --- |
| [Naming](naming.md) | Every change and review | Canonical vocabulary, verbs, units, identities, and coordinated renames. |
| [Writing](writing.md) | Writing or reviewing Markdown, including skills and templates | Document structure, wording, ownership, and preservation of meaning. |
| [Code](code.md) | Adding, changing, or reviewing code | Functions, types, schemas, control flow, and decomposition. |
| [Comments](comments.md) | Adding, changing, or reviewing code or comments | Responsibility headers, TSDoc, and failure contracts. |
| [Boundaries](boundaries.md) | Runtime, dependencies, validation, storage, providers, or source layout | Composition, narrow dependencies, native values, trust boundaries, and persistence. |
| [Failures and logging](failures-and-logging.md) | Runtime paths, errors, catches, or logs | Outcomes, error ownership, safe diagnostics, and failure evidence. |
| [Verification](verification.md) | Code, tests, fixtures, or evidence | Behavioral coverage, isolation, assertions, and result freshness. |

Apply these rules throughout the affected consumer chain, including unchanged consumers. A proposed convention change must be visible for review; reviewers assess it against the accepted rule on the comparison base.

## 2. System contracts

The [requirements](../requirements.md) own product behavior. The [architecture](../architecture.md), [runtime design](../design/runtime.md), [task design](../design/tasks.md), and [ADRs](../ADRS/README.md) own execution and security contracts. The [scaffolding specification](../design/scaffolding.md) owns the initial foundation and its acceptance boundary. [Testing](../test.md) owns commands and suite prerequisites; the [staging runbook](../operations/staging.md) owns provisioning, release, and recovery.

Conventions explain how code preserves those contracts. Code and tests establish implemented behavior; live claims require live evidence. Keep each maintained rule in its owning topic.
