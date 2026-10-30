# Shared PostgreSQL storage

## 1. Status and scope

**Status: ACCEPTED Phase 1 storage direction.** MyStacks uses one PostgreSQL database for application records and Mastra runtime state, with separate tables for their respective owners. The overall architecture remains tentative; this decision does not provision a database or select its hosting service.

The [architecture](../architecture.md) owns state responsibilities. The [runtime design](../design/runtime.md) and [task design](../design/tasks.md) own the contracts that use these records.

## 2. Decision

### 2.1 Application and runtime records

Application-owned tables hold accounts, channel bindings, connected-account records, saved tasks, run statuses and results, and the other durable application records described by the architecture. Mastra-managed tables hold conversation history, shared personal profiles, and channel compaction state. Each record retains one owning boundary even though both use the same database.

Per-user provider credentials are encrypted in application-owned PostgreSQL records using GCP KMS; application-wide keys use GCP Secret Manager. Trusted API and worker financial adapters may resolve them after authorization. The [credential decision](0002-backend-owned-financial-credentials.md) owns that split, its trust trade-off, and unresolved schemas, IAM, and encryption mechanism.

Use Mastra's PostgreSQL storage adapter for its native state. Its resource-scoped structured working-memory merges use row-locked transactions to preserve simultaneous changes to different fields. The [profile update decision](0012-last-save-wins-profile-updates.md) owns same-field last-successful-save semantics. These short storage transactions do not serialize entire conversations or introduce an application-level cross-channel lock. [Mastra working memory](https://mastra.ai/docs/memory/working-memory#concurrent-updates)

### 2.2 Queue and execution boundaries

**BullMQ is the initial queue baseline; its Redis-backed integration remains provisional.** Redis supplies queue and scheduling state under that design; PostgreSQL owns saved task definitions, run records, and personal memory. The [scheduling decision](0004-durable-scheduling-and-queued-execution.md) owns timing, claims, and retry responsibilities.

Workers persist run state and results in PostgreSQL before completing a BullMQ job. The selected native QueueEvents path notifies the existing API/chat coordinator to resolve trusted routing and results from those authoritative records. The [channel-turn decision](0009-channel-turns-and-background-subagents.md) owns this completion boundary.

Worker and E2B sandbox lifetimes do not determine record durability. Required generated files must persist outside disposable execution environments; the file-storage service and retention policy remain open.

Account and channel isolation continue to depend on trusted backend identity and authorization. Sharing a database does not grant models, tools, or sandbox code arbitrary database access, and database credentials remain in trusted backend infrastructure.

## 3. Rationale and alternatives

**One database keeps the initial operating model small.** Application state and Mastra state both need durable records, and the selected PostgreSQL adapter supports the native memory behavior. Separate application and runtime databases would introduce another deployment, backup, and connection-management boundary without a current requirement that justifies it.

**Separate table ownership preserves responsibilities.** Sharing infrastructure does not require a second representation of each record or make queue state the authority for the user's saved task. Redis remains replaceable with the provisional queue integration.

**The trade-off is shared capacity and failure scope.** Application queries and runtime persistence consume the same database resources. Dedicated databases may become justified by demonstrated load, isolation, or operating requirements; Phase 1 accepts the shared arrangement.

## 4. Consequences and open choices

- **Selected:** PostgreSQL is the database engine for durable application and Mastra records; its selection is not an open architecture question.
- **Integration:** exact tables, migration ownership, adapter versions, connection handling, and permissions remain implementation design work.
- **Operations:** hosting, sizing, backup and recovery configuration, retention, and file storage remain open.
- **Queue consistency:** using one PostgreSQL database does not make PostgreSQL and Redis updates one transaction. Definition-to-queue updates and recovery of persisted results whose completion has not been handled remain part of the task design.
