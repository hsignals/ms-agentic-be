# Architecture decision records

## 1. Purpose and authority

These records make accepted choices and their trade-offs explicit, including small decisions. The overall architecture remains under review, and no record claims that the runtime is implemented. Each ADR states its accepted direction and any provisional technology or open integration details.

Keep one living record for each standing decision. Related choices may use separate decision sections in an existing ADR when they share a rationale. The [requirements](../requirements.md) own product outcomes; the [technical designs](../design/README.md) own detailed flows and verification. ADRs explain why those boundaries and trade-offs were chosen.

## 2. Decision catalogue

### 2.1 Runtime, execution, and security

| Record | Accepted choice and trade-off |
| --- | --- |
| [0001: Shared runtime and orchestration](0001-custom-runtime-and-orchestration.md) | Shared execution capacity and centrally deployed code, with user context and orchestration kept logically separate; per-user persistent runtimes are not selected. |
| [0002: Backend-owned financial credentials](0002-backend-owned-financial-credentials.md) | Application keys use GCP Secret Manager; durable per-user credentials use KMS-encrypted PostgreSQL storage. **Credential brokering** supplies provider authentication outside the VM through an egress proxy or user-bound backend read bridge. Raw provider secrets stay outside sandbox environments, files, and prompts; authorized current-user financial-data exposure remains an accepted trade-off. Exact lifecycle, encryption integration, IAM, and run-bound authorization remain open. |
| [0003: Sandboxed code execution](0003-sandboxed-code-execution.md) | Each independent run needing shell or code owns one E2B workspace for shell, files, Python, and JavaScript. Required outputs survive termination; fresh whole-job retries use fresh workspaces. Default-deny network policy permits only backend-approved provider egress. |
| [0004: Durable scheduling and queued execution](0004-durable-scheduling-and-queued-execution.md) | Durable task records and one shared BullMQ queue prioritize delegated subagents, requested schedules, then proactive investigations, accepting contention. Native queue recovery restarts eligible whole jobs within a shared two-attempt allowance, reusing completed results; proactive failures wait for the next check. In-agent checkpoints are deferred. Also records task limits, overlap, timezones, cancellation, and delivery uncertainty. DBOS stays future-only until concrete benefits justify adoption. |
| [0005: Mastra runtime framework](0005-mastra-runtime-framework.md) | Reuse Mastra's runtime facilities while retaining application authority and financial logic. Additive LangSmith tracing is low priority; LangSmith Deployment is not selected. |
| [0006: Composable agent capabilities](0006-composable-agent-capabilities.md) | **Programmatic tool calling** lets scripts compose broad provider SDK/API reads, loops, pagination, and concurrency without a bespoke tool or model round for every step. **Credential brokering** uses native egress-proxy injection for supported authentication and a user-bound backend read bridge for application signing or proxy-incompatible authentication. |
| [0007: Verified wallet connections](0007-verified-evm-wallet-connections.md) | Require off-chain wallet-control proof before tracking; EVM uses SIWE, and proof-challenge expiry is separate from connection lifetime. |
| [0009: Channel turns and background subagents](0009-channel-turns-and-background-subagents.md) | One backend coordinator serves concurrent channels with ordered turns. Workers save PostgreSQL results before native BullMQ events normally wake it; startup and periodic pending-completion checks reuse saved work through the same handler. Main-agent turns own replies without an exactly-once guarantee. Direct chat accepts interruption; one-level delegation avoids a parent-request workflow. |
| [0017: Cloud Run worker pool](0017-cloud-run-worker-pool.md) | A Cloud Run API service keeps CPU available after acknowledgement; separate background consumers start with one or two manually scaled instances, accepting idle cost for independent capacity. Independent project resources follow sibling deployment conventions. Stop/start downtime is accepted; preserving one active coordinator during replacement remains unresolved. Configurable execution limits and per-run measurements guide capacity; exact limits await evidence and per-user spending budgets are deferred. |

### 2.2 Context, memory, and storage

| Record | Accepted choice and trade-off |
| --- | --- |
| [0008: Channel-scoped work and shared memory](0008-channel-scoped-work-and-shared-memory.md) | Separate conversations and user-requested work, with one shared structured personal profile and account-wide financial connections; website setup and chat have distinct responsibilities. |
| [0010: Native channel context compaction](0010-native-channel-context-compaction.md) | Native Mastra token-based compaction retains recent raw context and compact older context per channel; summaries are lossy and raw history remains stored. |
| [0011: Profile-only forgetting](0011-profile-only-forgetting.md) | The normal memory-update tool removes saved profile content; retained history and summaries may still influence answers or be relearned. |
| [0012: Last-save-wins profile updates](0012-last-save-wins-profile-updates.md) | Native partial merges preserve separate fields; the last successful save wins for the same field, including saves from older turns. |
| [0013: Shared PostgreSQL storage](0013-shared-postgresql-storage.md) | One TimescaleDB-enabled Tiger Cloud PostgreSQL service holds ordinary application and Mastra tables, accepting shared capacity and failure scope; Valkey stores BullMQ queue state. Operational familiarity and future portfolio history motivate the choice; future history tables begin as hypertables when built. Phase 1 adds no indexer or history reconstruction. |
| [0020: Managed Valkey queue storage](0020-managed-valkey-queue-storage.md) | Dedicated Memorystore for Valkey uses one `custom-pico` node, cluster mode disabled, zero replicas, AOF every second, and `noeviction`, with private VPC connectivity and TLS. Accept maintenance/node-recovery downtime and possible loss of recent unflushed writes; exact integration and provisioning remain open. |
| [0023: Analysis data retention and object storage](0023-analysis-data-retention-and-object-storage.md) | Retain useful provider inputs, intermediate calculations, and results for follow-ups. Private GCS holds files; PostgreSQL holds records, small results, metadata, and file references. Automatic pruning is deferred, with metadata for later cleanup; provider retention rights and source freshness still apply. |

### 2.3 Account and product boundaries

| Record | Accepted choice and trade-off |
| --- | --- |
| [0014: Stable account and independent channel links](0014-stable-account-and-independent-channel-links.md) | Privy with Twilio Verify supplies phone signup/login. A stable internal account ID maps to a unique `privy_user_id`; the first authenticated API request creates the account idempotently. Messaging links remain separately verified. |
| [0015: Provider-backed portfolio calculations](0015-provider-backed-portfolio-calculations.md) | Available provider evidence and reusable calculations support Phase 1; accepting coverage limits defers a MyStacks indexer and infrastructure-dependent historical reconstruction. |
| [0016: Chat-first reports](0016-chat-first-reports.md) | Concise text reports and follow-ups serve messaging channels; images are low priority and extensive reports or polished web artifacts are deferred. |
| [0018: Managed financial data providers](0018-managed-financial-data-providers.md) | SnapTrade and Zerion supply the initial exchange/brokerage and wallet coverage; direct Hyperliquid reads use Webshare at low priority. Accept provider-dependent coverage and explicit validation gaps; DeBank is an optional future EVM complement. |
| [0019: Current portfolio evidence](0019-current-portfolio-evidence.md) | Request fresh or near-fresh relevant account evidence for current analysis, allowing brief appropriate reuse. Separate source time from retrieval and holdings freshness from price freshness; delayed evidence supports bounded claims while periodic monitoring still accepts missed events. |
| [0021: Apple Messages with Bird](0021-apple-messages-with-bird.md) | Bird is the primary Apple Messages for Business MSP, with Photon as a backup integration plan. iMessage supports scheduled and proactive work; WhatsApp retains chat and one-off analysis while scheduling, proactive insights, and templates are deferred. |
| [0022: Human support conversation ownership](0022-human-support-conversation-ownership.md) | Bird Conversations supplies the Apple staff interface. The backend pauses automated delivery during human ownership, keeps requested computation running, skips proactive starts, and requires explicit handback before processing pending results. |

## 3. Remaining design work

Accepted choices do not settle exact schemas, model and token budgets, provider coverage and saved credentials, financial formulas, package integration, Tiger Cloud service configuration, Cloud Run resource configuration and single-coordinator handoff, Valkey networking/authentication and provisioning, completion and attempt-accounting integration, definitive send-failure retries, or provider-specific retention constraints and future pruning rules. The [architecture](../architecture.md) and owning technical designs identify those open questions; [TODO](../TODO.md) tracks unresolved provider credentials, support operations, Apple approval and notification scope, and storage integration.
