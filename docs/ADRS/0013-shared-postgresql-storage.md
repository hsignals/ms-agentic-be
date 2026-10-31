# Shared PostgreSQL storage

## 1. Status and scope

**Status: ACCEPTED Phase 1 storage direction.** MyStacks uses one PostgreSQL database hosted on Tiger Cloud for application records and Mastra runtime state, with separate tables for their respective owners. Application and Mastra tables use ordinary PostgreSQL. When portfolio-history infrastructure is built, its history tables begin as hypertables before their first write; the indexer remains deferred. The overall architecture and concrete hosting configuration remain tentative.

The [architecture](../architecture.md) owns state responsibilities. The [runtime design](../design/runtime.md) and [task design](../design/tasks.md) own the contracts that use these records.

## 2. Decision

### 2.1 Application and runtime records

Application-owned tables hold accounts, channel bindings, connected-account records, saved tasks, run statuses, small structured results, retained-data metadata and file references, pending/handled completion state, and the other durable application records described by the architecture. Cancellation requests and known or uncertain delivery outcomes belong to application-owned records. Exact schemas remain open. Mastra-managed tables hold conversation history, shared personal profiles, and channel compaction state. Each record retains one owning boundary even though both use the same database.

Per-user provider credentials are encrypted in application-owned PostgreSQL records using GCP KMS; application-wide keys use GCP Secret Manager. Trusted API and worker financial adapters may resolve them after authorization. The [credential decision](0002-backend-owned-financial-credentials.md) owns that split, its trust trade-off, and unresolved schemas, IAM, and encryption mechanism.

Use Mastra's PostgreSQL storage adapter for its native state. Its resource-scoped structured working-memory merges use row-locked transactions to preserve simultaneous changes to different fields. The [profile update decision](0012-last-save-wins-profile-updates.md) owns same-field last-successful-save semantics. These short storage transactions do not serialize entire conversations or introduce an application-level cross-channel lock. [Mastra working memory](https://mastra.ai/docs/memory/working-memory#concurrent-updates)

### 2.2 Queue and execution boundaries

**BullMQ uses managed Valkey through its Redis-compatible backend for queue and scheduling state.** The [queue-storage decision](0020-managed-valkey-queue-storage.md) owns the dedicated GCP Memorystore instance; pinned versions and native integration still require validation. PostgreSQL owns saved task definitions, run records, completion state, and personal memory. The [scheduling decision](0004-durable-scheduling-and-queued-execution.md) owns timing, claims, cancellation, retries, and delivery policy.

Workers persist run state and results in PostgreSQL before completing a BullMQ job. Native QueueEvents is the normal wakeup path for the existing API/chat coordinator to resolve trusted routing and results from those authoritative records. Startup and periodic checks recover pending saved completions through the same ordered channel handler with current authorization, cancellation, and delivery checks. Empty checks make no model calls, and completed analysis is reused. The [channel-turn decision](0009-channel-turns-and-background-subagents.md) owns this completion boundary; the exact pending/handled schema and handled boundary remain open without an exactly-once turn or reply guarantee.

PostgreSQL and queue storage run independently of the application processes and retain state across application stop/start deployment. Native queue recovery handles unfinished eligible work under the scheduling policy; pending-completion checks handle saved results without re-enqueueing their analysis.

Worker and E2B sandbox lifetimes do not determine record durability. Private Google Cloud Storage holds retained datasets and workspace files; PostgreSQL keeps their metadata and references alongside application records. The [analysis retention decision](0023-analysis-data-retention-and-object-storage.md) owns this division by purpose, useful-data retention, and deferred pruning. Workers save useful retained files before sandbox destruction; later authorized runs may restore selected files into fresh sandboxes.

Account and channel isolation continue to depend on trusted backend identity and authorization. Sharing a database does not grant models, tools, or sandbox code arbitrary database access, and database credentials remain in trusted backend infrastructure.

### 2.3 Tiger Cloud hosting and future portfolio history

Use a new TimescaleDB-enabled Tiger Cloud service dedicated to this project, while initially using ordinary PostgreSQL tables. Tiger Cloud also offers a separate plain PostgreSQL service; an in-place conversion from that service type is not established by its documentation. Selecting the TimescaleDB-enabled service preserves the documented path for ordinary tables and future hypertables to coexist. Existing projects provide operational references, while this project owns its database and credentials independently. [Service configuration](https://www.tigerdata.com/docs/get-started/quickstart/create-service), [Table coexistence](https://www.tigerdata.com/docs/learn/tiger-cloud/tiger-cloud-essentials)

Use ordinary PostgreSQL tables for the initial application and Mastra records. MyStacks may later build an indexer to collect users' historical balances, positions, and portfolio-value snapshots. When that infrastructure is built, create its portfolio-history tables as hypertables before their first write. Ordinary application and Mastra tables remain alongside them. The indexer and financial calculation code remain application responsibilities; the database provides storage and query capabilities. The exact history schema, collection cadence, and TimescaleDB feature use remain open.

## 3. Rationale and alternatives

**One database keeps the initial operating model small.** Application state and Mastra state both need durable records, and the selected PostgreSQL adapter supports the native memory behavior. Separate application and runtime databases would introduce another deployment, backup, and connection-management boundary without a current requirement that justifies it.

**Separate table ownership preserves responsibilities.** Sharing infrastructure does not require a second representation of each record or make Valkey queue state the authority for the user's saved task or completed result. Queue storage and its lifecycle remain separate from PostgreSQL record ownership.

**The trade-off is shared capacity and failure scope.** Application queries and runtime persistence consume the same database resources. Dedicated databases may become justified by demonstrated load, isolation, or operating requirements; Phase 1 accepts the shared arrangement.

**Tiger Cloud preserves a concrete future TimescaleDB option.** A portfolio-history indexer may produce time-series data that benefits from hypertables and historical summaries. A TimescaleDB-capable Tiger Cloud service supports ordinary tables alongside hypertables, avoiding a provider change solely to adopt those features. The team's existing Tiger Cloud operating experience also reduces setup uncertainty. [Tiger Cloud essentials](https://www.tigerdata.com/docs/learn/tiger-cloud/tiger-cloud-essentials)

**Provider continuity does not guarantee migration-free adoption.** Creating portfolio-history tables as hypertables before their first write avoids converting those tables after data accumulates. Converting an existing populated table reorganizes its rows into chunks and may require primary-key changes or block writes while conversion runs. Existing application and Mastra tables can remain ordinary PostgreSQL tables. [Hypertable conversion](https://www.tigerdata.com/docs/learn/hypertables/creating-and-configuring-hypertables)

**The hosting trade-off is a separate vendor and cloud boundary.** Tiger Cloud offers AWS and Azure regions while application execution uses GCP; region selection must account for database connectivity and latency. Cloud SQL offers GCP-native managed PostgreSQL, but its supported extension list excludes TimescaleDB and it does not allow installing arbitrary extensions. Choosing Cloud SQL would require a different host or an additional database if TimescaleDB becomes necessary. [Tiger Cloud service configuration](https://www.tigerdata.com/docs/get-started/quickstart/create-service), [Cloud SQL extensions](https://docs.cloud.google.com/sql/docs/postgres/extensions)

## 4. Consequences and open choices

- **Selected:** A TimescaleDB-enabled Tiger Cloud service hosts the project's PostgreSQL database for durable application and Mastra records. Ordinary application and Mastra tables serve Phase 1; future portfolio-history tables start as hypertables when that deferred infrastructure is built.
- **Integration:** exact tables, migration ownership, adapter versions, connection handling, and permissions remain implementation design work.
- **Operations:** service plan, region, sizing, connectivity, backup and recovery configuration, and concrete storage configuration remain open under the analysis retention decision. The project owns its database independently of other projects.
- **Queue consistency:** using one PostgreSQL database does not make PostgreSQL and Valkey updates one transaction. The definition-to-queue update contract remains open. Pending saved completions are checked on startup and periodically; exact schemas, intervals, handled boundary, crash behavior, and duplicate-handling mechanics remain part of the task design.
