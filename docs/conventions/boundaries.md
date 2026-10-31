# Dependency and validation boundaries

This topic owns application composition, dependency direction, validation, native values, and storage seams. The [architecture](../architecture.md) and [ADRs](../ADRS/README.md) own required behavior.

## 1. Composition and ownership

Validate configuration before work starts. Build process dependencies in an explicit composition root, separate app construction from listener/worker startup, and keep request/run context out of process-wide mutable state. Importing a module must not start background work.

Pass each function only the collaborators it uses. Prefer a narrow native SDK type or method when it meets the contract; add an adapter for a real application boundary or repeated policy, not to duplicate the SDK. Inject dependencies when configuration, ownership, or lifetime varies. Reuse a shared infrastructure client through a narrow accessor when its configuration and lifetime are application-wide.

Keep pure decisions free of configuration loading, persistence, providers, clocks, and logging. Keep imports acyclic and dependencies directed toward their owner; features do not import process entrypoints, tests, or scripts. Keep production code under `src/`, test-only helpers under `tests/`, and operational tools under `scripts/`.

## 2. Trust and representation

### 2.1 Validation ownership

Parse client input at the HTTP edge, provider evidence in its adapter, and stored input in one owning decoder. Reject unknown enumerable values and invalid supplied configuration instead of silently defaulting. Reuse a checked value while its input and binding are unchanged; do not repeat equivalent checks in trusted internal calls.

Derive identity from verified credentials. Authorize account/channel/run ownership at the protected action and persistence boundary; a stored object reference grants no access. Recheck mutable security state where the action needs fresh evidence, using the transaction or lock that owns the state. Do not trust identity, permissions, or freshness supplied by a request body or model.

### 2.2 Native values and persistence

Keep domain values native inside business logic; encode/decode at database and transport boundaries. Preserve native SDK and protocol fields at their boundary. Do not pass storage encodings between internal functions or reimplement SDK serialization, signing, or cryptography.

Application migrations own application tables; the native Mastra adapter owns its tables. Stores enforce ownership, constraints, and atomic writes. Keep separate writes atomic when their invariant requires it; do not split a transaction to make a method look narrower. Preserve accepted signed bytes, canonical hashes, and stored compatibility.

Use the concrete production store type. Keep test-double shapes in test files or `tests/support/`; do not duplicate store methods in a separate production interface. Database-specific helpers stay beside their store, and helpers shared only by stores belong to the database owner.

Keep stored JSON `unknown` until code reads it to decide behavior. At that point, give it one named type and one owning decoder under the store's `utils/`; readers call that decoder instead of casting the column. A failed decode throws an invariant error identifying the column. Stores returning raw rows leave decoding to the reader; stores constructing a domain shape decode during that read. Native SDK authority is restored only at its owning restoration boundary.

Use Drizzle and the application driver selected in the [PostgreSQL decision](../ADRS/0013-shared-postgresql-storage.md#24-application-driver-and-migrations), preserving the checked-in migration workflow. Keep transactions short and release their connections before external provider/model/sandbox work, signing, broadcasts, or confirmation waits.

### 2.3 HTTP and execution

A Hono route parses input, invokes an application operation, and selects its success response. Application logic does not import Hono or choose HTTP status codes. One owning error boundary translates failures into safe responses.

Generated code runs in a run-owned E2B workspace. Backend credentials stay outside prompts, logs, traces, results, and sandbox files or environments. Save required results and useful retained files through trusted backend transfers before cleanup; report a required-persistence failure. Restoration reauthorizes selected files into a fresh workspace. The [sandbox](../ADRS/0003-sandboxed-code-execution.md) and [retention](../ADRS/0023-analysis-data-retention-and-object-storage.md) decisions own these limits.

## 3. Budgets, retries, and cleanup

Give an outbound call one timeout owner and one retry owner. Keep its call timeout distinct from a request/job budget; a timeout cannot undo a committed side effect. Prefer native SDK retry support when it meets the requirement and avoid nested retry loops.

BullMQ owns durable whole-job retry and stalled recovery. Preserve the [two-total-attempt ceiling](../ADRS/0004-durable-scheduling-and-queued-execution.md), including interruption recovery; `attempts=2` alone does not establish compliance. Keep operation-specific budgets and retries in the calling workflow rather than overlapping them across layers.

Cleanup follows resource ownership and runs on success and failure. Preserve the primary failure when cleanup also fails, and make incomplete cleanup visible. Disposable test cleanup is distinct from deletion of retained evidence. Additional recovery, persistence, coordination, or optimization needs a concrete unmet requirement; a possible failure alone does not authorize a stronger guarantee.

## 4. Modules, barrels, and pure helpers

### 4.1 Pure utility owners

`utils` is a folder with an `index.ts` barrel and one file per responsibility, never a `utils.ts` file. It holds pure helpers only. Import utilities through their barrel rather than another folder's internal utility file. Adapters, stores, protocols, and routes stay beside their owner under a name describing their work.

Every `utils/` folder is pure. Pure folders must not load process configuration, runtime clients, retry machinery, loggers, stores, or startup effects, directly or through a barrel. When another feature's entrypoint loads runtime code, pure code imports the helper from its lowest pure owner instead.

### 4.2 Domain entrypoints and exports

Across domain directories, use the owning domain's `index.ts` through the configured `@/*` alias; let directory imports resolve `index.ts`. Reach another domain's utility through that domain's entrypoint unless the pure-owner rule above applies. Within a domain, use direct relative imports to avoid cycles; do not create an alias per domain.

The owning file exports only declarations another module consumes or an explicit external contract requires. Barrels use `export * from` without selecting, renaming, or filtering names; resolve collisions at the owner and update consumers. Type-only barrels use `export type * from`. Group values in one import and types in a separate `import type` statement from the same entrypoint.

### 4.3 Acyclic imports

Runtime imports, type-only imports, and re-exports form a directed acyclic graph. Implementation modules must not import their own barrel, directly or indirectly; tests may consume public barrels. Move shared types, constants, or helpers to a lower owner when needed to break a cycle, and inspect the graph after changing barrel boundaries.
