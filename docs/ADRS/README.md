# Architecture decision records

## 1. Purpose and authority

These records make accepted choices and their trade-offs explicit, including small decisions. The overall architecture remains under review, and no record claims that the runtime is implemented. Each ADR states its accepted direction and any provisional technology or open integration details.

Keep one living record for each standing decision. Related choices may use separate decision sections in an existing ADR when they share a rationale. The [requirements](../requirements.md) own product outcomes; the [technical designs](../design/README.md) own detailed flows and verification. ADRs explain why those boundaries and trade-offs were chosen.

## 2. Decision catalogue

### 2.1 Runtime, execution, and security

| Record | Accepted choice and trade-off |
| --- | --- |
| [0001: Shared runtime and orchestration](0001-custom-runtime-and-orchestration.md) | Shared execution capacity and centrally deployed code, with user context and orchestration kept logically separate; per-user persistent runtimes are not selected. |
| [0002: Backend-owned financial credentials](0002-backend-owned-financial-credentials.md) | Backend-authorized tools encapsulate credentials; model and sandbox flexibility stays within that authority boundary. |
| [0003: Sandboxed code execution](0003-sandboxed-code-execution.md) | E2B isolates generated code; trusted tools supply required data, financial-analysis internet access defaults off, and required outputs survive sandbox termination. |
| [0004: Durable scheduling and queued execution](0004-durable-scheduling-and-queued-execution.md) | Durable task records and shared workers replace per-user timers. Records requested-task limits, overlapping occurrences, bounded retries, explicit timezones, and the separate proactive cadence, eligibility, and failure policy. BullMQ + Redis remains provisional. |
| [0005: Mastra runtime framework](0005-mastra-runtime-framework.md) | Reuse Mastra's runtime facilities while retaining application authority and financial logic. |
| [0006: Composable agent capabilities](0006-composable-agent-capabilities.md) | Curated credential-encapsulating tools plus code execution provide flexibility; a broader credential-injecting API proxy waits for a concrete need. |
| [0007: Verified wallet connections](0007-verified-evm-wallet-connections.md) | Require off-chain wallet-control proof before tracking; EVM uses SIWE, and proof-challenge expiry is separate from connection lifetime. |
| [0009: Channel turns and background subagents](0009-channel-turns-and-background-subagents.md) | Direct foreground chat accepts interruption loss. Ordered channel turns and one-level background delegation keep the main agent responsible for replies without a separate parent-request workflow. |

### 2.2 Context, memory, and storage

| Record | Accepted choice and trade-off |
| --- | --- |
| [0008: Channel-scoped work and shared memory](0008-channel-scoped-work-and-shared-memory.md) | Separate conversations and user-requested work, with one shared structured personal profile and account-wide financial connections; website setup and chat have distinct responsibilities. |
| [0010: Native channel context compaction](0010-native-channel-context-compaction.md) | Native Mastra token-based compaction retains recent raw context and compact older context per channel; summaries are lossy and raw history remains stored. |
| [0011: Profile-only forgetting](0011-profile-only-forgetting.md) | The normal memory-update tool removes saved profile content; retained history and summaries may still influence answers or be relearned. |
| [0012: Last-save-wins profile updates](0012-last-save-wins-profile-updates.md) | Native partial merges preserve separate fields; the last successful save wins for the same field, including saves from older turns. |
| [0013: Shared PostgreSQL storage](0013-shared-postgresql-storage.md) | One database holds separately owned application and Mastra tables, accepting shared capacity and failure scope; Redis serves the provisional queue. |

### 2.3 Account and product boundaries

| Record | Accepted choice and trade-off |
| --- | --- |
| [0014: Stable account and independent channel links](0014-stable-account-and-independent-channel-links.md) | A stable account uses verified phone login and separately verified messaging links; additional linking preserves account continuity and distinct authority. |
| [0015: Provider-backed portfolio calculations](0015-provider-backed-portfolio-calculations.md) | Available provider evidence and reusable calculations support Phase 1; accepting coverage limits defers a MyStacks indexer and infrastructure-dependent historical reconstruction. |
| [0016: Chat-first reports](0016-chat-first-reports.md) | Concise text reports and follow-ups serve messaging channels; images are low priority and extensive reports or polished web artifacts are deferred. |

## 3. Remaining design work

Accepted choices do not settle exact schemas, model and token budgets, provider coverage, financial formulas, package integration, database or worker hosting, delivery constraints, or retention. The [architecture](../architecture.md) and owning technical designs identify those open questions; [TODO](../TODO.md) owns the unresolved support and Apple-provider decisions.
