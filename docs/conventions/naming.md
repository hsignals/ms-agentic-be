# Naming conventions

This topic owns vocabulary for first-party code, database objects, APIs, scripts, tests, configuration, logs, and current documentation. Naming rules preserve behavior and do not authorize migrations or public-contract changes.

## 1. Canonical concepts

### 1.1 One name per meaning

Carry one semantic name through declarations, parameters, values, SQL, API fields, stored JSON, logs, tests, and docs. Map vendor or approved compatibility spellings once at their owning boundary. Casing, plurals, units, and meaningful representation qualifiers do not create competing names.

Name durable entities for their established design and consumers. Do not narrow an entity to its first writer or invent future capabilities. Equal fields or values do not merge distinct ownership, authority, lifecycle, or representation contracts. Reuse a clear existing name; avoid cosmetic renames, empty aliases, forwarding wrappers, and per-import synonyms.

Qualify exported function names so an importer can identify their subject, such as `isRunCompleted` rather than `isCompleted`. A shorter private name may use its local context; an exported contract must remain clear across files.

### 1.2 Project vocabulary

| Term | Meaning |
| --- | --- |
| Account | Stable internal identity owning financial connections and shared personal memory. |
| Channel | Independently linked conversation and requested-work scope. |
| Run | One independent agent execution with fresh trusted account/channel context. |
| Job | Durable queued background work; an attempt is one execution of that job. |
| Workspace | One run-owned E2B sandbox created lazily for shell or code. |
| Retained file | Useful analysis file saved in private GCS with PostgreSQL ownership and evidence metadata. |
| Result | Persisted output of work; completion does not grant permission to send it. |
| Task | A user-requested saved instruction or schedule in the product design; it is distinct from a queue job. |

The [architecture](../architecture.md) and [runtime design](../design/runtime.md) own these product meanings. Mastra, BullMQ, and provider identifiers keep their native spelling at the integration boundary.

### 1.3 Short forms and casing

Use `camelCase` for functions and runtime values, `PascalCase` for types/classes/schemas, `UPPER_SNAKE_CASE` for environment variables and fixed named constants, and established `snake_case` for SQL, wire, stored, and log keys. Treat acronyms as words, such as `accountId`, `HttpClient`, and `rpcUrl`.

Reading-level local, parameter, function, and internal property names use these short forms: transaction `tx`, message `msg`, operation `op`, context `ctx`, database `db`, current `cur`, previous `prev`, performance `perf`, options `opts`, signature `sig`, variables `vars`, configuration `config`, calculate `calc`, parameter `param`, property `prop`, sequence `seq`, reference `ref`, implementation `impl`, integer `int`, milliseconds `ms`, maximum `max`, minimum `min`, identifier `id`, environment `env`, argument `arg`, address `addr`, source `src`, destination `dst`, index `idx`, and error `err`. Plurals add `s`; `conn` names a connection wrapper. Other words retain their full spelling.

Fixed constants whose names are not environment variables are reading-level names too, including `UPPER_SNAKE_CASE` constants; apply the same short forms word by word.

Formal names retain full words: types, schemas, database declarations and their matching properties, wire/stored/log keys, routes, and environment variables. Values copied directly from a row, decoded stored shape, config schema, or native SDK keep that property's spelling. Preserve mandated external names and meaningful generic type parameters; avoid `I`/`T` prefixes and blanket `Async` suffixes.

Organize related files by responsibility with simple names inside their owning directory, such as `types/catalog.ts`, `utils/catalog.ts`, or `db/catalog/store.ts`. Reuse an existing owner before adding a module.

### 1.4 Values and collections

Name production locals and parameters after their actual subject. Avoid `value`, `data`, `result`, `item`, `record`, `rows`, `input`, `obj`, `tmp`, `res`, `entry`, and `payload`; parsed HTTP input may be `body`, `query`, or `params`. Name a call result for its operation, and keep the canonical noun through its parameters and returned properties. Add `prev`, `cur`, `expected`, or `actual` only when the distinct values coexist. Preserve protocol and stored field contracts during a local rename.

Use singular names for values and plural names for collections. A keyed collection exposes its key, such as `runsById` or `filesByRunId`, and keeps that name across consumers. Avoid container-only names; the type carries grouped multiplicity. Name page envelopes as pages rather than plain lists.

Use `compare` for ordering comparators returning a negative number, zero, or a positive number, and `matches`/`equals` for equality predicates. Sorting/projection names reveal their output or ordering. Preserve tie-breakers, null placement, exact comparisons, duplicates, and empty-input behavior; an `InPlace` suffix describes existing permitted mutation and does not authorize it.

## 2. Truthful function contracts

### 2.1 Questions and verbs

| Form | Meaning |
| --- | --- |
| `is` / `are` | State or classification. |
| `has` | Presence or possession. |
| `can` | Eligibility under named checked conditions. |
| `should` | Policy recommendation. |
| `needs` / `requires` | Requirement. |
| `matches` / `equals` | Relation or equality. |
| `supports` | Supported capability. |
| `meets` / `exceeds` | Threshold comparison. |

Boolean functions read as questions without overstating their checks. Preserve polarity, empty-collection behavior, and distinctions among `0`, `false`, `null`, `undefined`, and empty strings. Name compound domain conditions; share repeated predicates under one owner. A boolean name does not promise a no-throw contract or replace a fresh authoritative check.

Use `get`/`list` for reads, `build` for construction, `calc` for derived quantities, `plan` for decisions without I/O, `to` for projections, and `serialize`/`deserialize` for encodings. Use `prepare` for later-action artifacts, `create` for bringing an entity/component into existence, `save` for persistence, `record` for facts, `apply` for supplied state changes, `submit` for sending, and `reconcile` for comparing evidence and resolving state. Document writes in `refresh`. A getter must not hide a business-state change.

### 2.2 Parsing and evidence

Use `assert` for a throwing precondition with no meaningful success value, `parse` for interpreting and validating input, `safeParse` for returned expected parse failures, `validate` for a documented validation result, `verify` for establishing a named fact from evidence, `normalize` for representation changes, and `restore` for reconstructing and validating saved state. Avoid ambiguous `check` names and broad `safe` claims.

Preserve actual narrowing, conversion, failure, and absence contracts. A parsed value does not prove authorization. A new nullable entity lookup normally returns `null`; collection reads return an empty collection. Use `OrThrow` when contrasting required presence with a nullable variant. Provider failure is distinct from valid empty state.

### 2.3 Types, units, and lifecycle

Use `XRow` for one table row, `XRecord` for a joined storage-shaped result, `XRequest`/`XQuery` for parsed client input, `XInput` for internal input, `XResponse` for wire output, `XResult` for acted-on outcomes, `XOptions` for optional choices, `XConfig` for runtime settings, and `XContext` for invocation/attempt context. Reuse unchanged contracts; avoid parallel `Data`, `Info`, or `Model` aliases without distinct meaning.

Declare each table's row aliases once under its database owner, deriving `$inferSelect`/`$inferInsert` only in those aliases. Build joined records from the shared row aliases, and keep domain shapes distinct from their storage representations.

Make units and identities explicit: `durationMs`, `timeoutSeconds`, `savedAt`, `sourceAsOfAt`, `accountId`, `jobId`, and `objectKey` describe different values. Distinguish instants from durations, quoted from actual amounts, and IDs from addresses, indexes, and hashes. Conversions, rounding, sort tie-breakers, null placement, duplicates, and empty-input semantics are behavior.

Name commands with verbs, events as facts, implementations `handle<Event>`, and supplied callbacks `on<Event>`. Distinguish prepared, saved, submitted, acknowledged, finished, succeeded, and failed by their actual evidence. A finished job or acknowledged request does not prove success or message delivery.

### 2.4 Readable call sites

When same-typed IDs or behavioral booleans are easy to confuse, use a named input/options object. Keep already-clear short signatures. A signature change preserves omitted versus explicit `undefined`, defaults, evaluation order, overloads, callbacks, and every caller; it does not add modes merely to fit an example.

## 3. Coordinated changes

Before a rename, map its meaning, declaration, direct and indirect consumers, tests, and external/stored impact. Update internal symbols together. SQL, API fields, stored JSON, environment names, log events, hashes, and serialized formats require an explicitly authorized coordinated scope; preserve native fields, signed bytes, raw evidence, and applied migrations.

Preserve accepted inputs, return/error shapes, defaults, optionality, ordering, transaction boundaries, provider calls, timing, authorization, idempotency, and retry limits. Do not change behavior to fit a name or add wrappers to preserve a retired alias. Keep live compatibility readers until their removal is authorized.

Use syntax-aware or exact-owner checks for deterministic rules; document narrow vendor or immutable-history exceptions. A passing name check does not prove meaning. Review the full affected chain and report commands, exceptions, unproved scope, and the actual tested revision.
