# Managed Valkey queue storage

## 1. Status and scope

**Status: ACCEPTED queue-store provider, initial single-node configuration, and measured upgrade policy; integration validation remains open.** MyStacks uses a dedicated GCP Memorystore for Valkey instance through BullMQ's Redis-compatible backend. This decision selects hosting and operating assumptions; it does not claim a provisioned or tested service.

The [scheduling decision](0004-durable-scheduling-and-queued-execution.md) owns task intent, queue priorities, retries, cancellation, and delivery policy. The [PostgreSQL decision](0013-shared-postgresql-storage.md) owns durable application records and saved results, and the [channel-turn decision](0009-channel-turns-and-background-subagents.md) owns ordered completion handling. This record owns queue storage, its failure limits, and the evidence needed to change its initial size or topology.

## 2. Decision

### 2.1 Dedicated managed queue store

Use **GCP Memorystore for Valkey** for BullMQ schedule and queue state. This independent project owns the instance, networking, identities, secrets, and configuration. No resource or runtime dependency from another project is selected. The [PostgreSQL decision](0013-shared-postgresql-storage.md) owns database hosting.

Valkey is the first-party queue store. References to Redis describe the compatible protocol/API or a named alternative, rather than a separate deployed store. BullMQ documents Valkey as a compatible server for its [Redis-backend production guidance](https://docs.bullmq.io/guide/going-to-production). Compatibility does not establish a strict superset of newer Redis features; Valkey documents compatibility with [Redis OSS 7.2 and earlier](https://valkey.io/topics/migration/). Pin and validate the actual BullMQ, client, and managed Valkey versions before claiming native integration works.

### 2.2 Initial configuration

| Setting | Selected baseline |
| --- | --- |
| Node type and count | One `custom-pico` primary node, 1.25 GB total capacity |
| Cluster mode | Disabled; one shard |
| Replicas | Zero |
| Persistence | AOF with `appendfsync=everysec` |
| Memory policy | `maxmemory-policy=noeviction` |
| Connectivity | Private VPC connectivity with TLS |

Google's [node specification](https://docs.cloud.google.com/memorystore/docs/valkey/instance-node-specification) lists the 1.25 GB `custom-pico` node and restricts custom nodes to cluster mode disabled. Total capacity includes reserved overhead and is not all writable queue keyspace. [Cluster mode disabled](https://docs.cloud.google.com/memorystore/docs/valkey/cluster-mode-enabled-and-disabled) keeps one shard and the ordinary Valkey/Redis client connection model.

Configure `noeviction` explicitly. Arbitrary eviction can remove keys BullMQ needs; its [production guidance](https://docs.bullmq.io/guide/going-to-production#max-memory-policy) requires this policy. The managed service [returns errors at the memory limit instead of evicting data](https://docs.cloud.google.com/memorystore/docs/valkey/supported-instance-configurations), so sizing and observed memory pressure remain operational responsibilities.

Private connectivity and TLS are required. Region, network attachment, authentication method, exact permissions, and client connection details remain open; this decision does not choose IAM or token authentication.

### 2.3 Persistence and failure limits

**Accept queue downtime during maintenance or node recovery and possible loss of recent unflushed writes after a queue-store failure.** With zero replicas, this baseline has no replica available to serve as a replacement primary. [Memorystore replicas](https://docs.cloud.google.com/memorystore/docs/valkey/product-overview) provide availability and read-capacity options, but are not part of the initial configuration.

AOF records writes for recovery, and `everysec` flushes them every second. Writes still in memory can be lost before the flush; see [AOF persistence](https://docs.cloud.google.com/memorystore/docs/valkey/about-aof-persistence). This improves persistence without establishing zero data loss, exactly-once execution, or exactly-once delivery. Backup and restore policy remains open.

Application deployment stops old processes and starts new ones while independently hosted queue storage and PostgreSQL retain their state. Use native BullMQ shutdown, reconnection, and stalled-job handling under the scheduling policy. Reuse saved PostgreSQL results and pending-completion recovery. The selected availability limit does not add custom queue recovery or orchestration machinery, change current permissions or cancellation checks, or authorize rerunning completed analysis.

## 3. Rationale and trade-offs

### 3.1 Managed hosting and one node

Managed Valkey avoids operating a queue-store server alongside the application while preserving BullMQ as the selected queue library. A single small node keeps initial resource cost and topology small while actual workload demand is unknown. The trade-off is shared single-node capacity and accepted maintenance and failure downtime. A self-managed Valkey server or another managed Redis-compatible service would retain queue-store operations or require a different provider decision without a current benefit that justifies either choice.

AOF with one-second flushing balances durability and write overhead. It preserves more recent queue state than an in-memory-only configuration while retaining the accepted loss window. Adding a replica would improve availability at additional cost; it would not itself establish exactly-once execution or delivery. The selected baseline accepts downtime until observed availability needs justify that cost.

### 3.2 Measured upgrade triggers

- **Increase memory** when measured queue memory pressure shows the current writable capacity is insufficient. The initial 1.25 GB node is a starting configuration, not a future-capacity guarantee.
- **Add a replica** only when observed maintenance or recovery impact establishes an availability need that justifies the additional resource cost.
- **Consider clustering** only when demonstrated single-node throughput or capacity limits justify distribution. Cluster mode is chosen at creation, so a later move requires a replacement instance and validated client and queue integration under [Google's cluster-mode contract](https://docs.cloud.google.com/memorystore/docs/valkey/cluster-mode-enabled-and-disabled).

## 4. Remaining decisions and acceptance evidence

- **Integration:** pin BullMQ, client, and managed Valkey versions; verify supported commands and native scheduling, explicit priorities, QueueEvents, retries, reconnection, and process restarts against that combination. Redis compatibility alone is not this evidence.
- **Operations:** select the GCP project and region, private network configuration, TLS client setup, authentication, permissions, exact provisioning settings, backup and restore policy, and relevant queue retention settings.
- **Recovery:** verify native stalled-job and retry behavior respects the shared two-total-attempt ceiling, preserves waiting jobs through application stop/start, and suppresses cancelled or revoked work. Saved completions must return through the same ordered handler without repeating their analysis; exact pending/handled and duplicate-handling mechanics remain open under the existing owners.
- **Capacity:** record representative memory use, queue delay, command throughput, and maintenance or recovery impact before claiming capacity or changing size, replica count, or cluster topology. No workload-capacity or uninterrupted-service guarantee follows from the initial node size.
