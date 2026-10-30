# Phase 1 technical designs

## 1. Scope and authority

**Status: overall architecture under joint review.** This design set supports the **complete Phase 1 experience** described by the [user stories](../user-stories/README.md). It records responsibilities, data and authority boundaries, and execution flows. Agreed product behavior and Phase 1 execution decisions remain distinct from provisional technology integrations and open implementation choices. None of these documents claims a running implementation.

The [architecture](../architecture.md) and [ADRs](../ADRS/) own the accepted shared Mastra runtime, backend financial authority, direct foreground chat, queued background execution with BullMQ as the initial baseline and provisional Redis integration, separate [Cloud Run worker-pool hosting](../ADRS/0017-cloud-run-worker-pool.md) with manual instance scaling, and E2B generated-code boundary. The [channel-turn ADR](../ADRS/0009-channel-turns-and-background-subagents.md) explains main-agent ownership of replies and background continuations. These designs refine those decisions. The [requirements](../requirements.md) own product authority, supported connection categories, best-effort monitoring, and information quality.

Phone/SMS signup opens the persistent website dashboard. New and returning users manage financial connections and messaging channels through the same Add account flow, with previews and Add more. Financial connections and channel linking can be completed in either order; financial connections remain optional, while chat requires a verified linked channel. Channel linking supports buttons and QR codes. Chat is the default assistant surface, and each iMessage or WhatsApp chat manages its own tasks and jobs; personal memory and financial evidence are shared across the account. The [channel scope ADR](../ADRS/0008-channel-scoped-work-and-shared-memory.md) owns that trade-off.

All answers and reports are concise, precise text suited to chat. Available-source research, substantial calculations, and background execution can support that output; image replies are low priority, while extensive deep-research reports and polished website report artifacts are deferred.

Human support is available within working hours and replies in the originating channel. [US-CHAT-07](../user-stories/assistant.md) owns that experience; [TODO](../TODO.md) owns the unresolved operating details and proposed internal Slack tool.

The same backend codebase has distinct API/chat and worker entrypoints and deployments, which may reuse one container image. The worker pool has no HTTP ingress and starts with one or two running instances, adjusted manually as needed; its instance count is separate from application worker job concurrency. Initially, one active ordinary API/backend process handles all users and channels concurrently, with one foreground main-agent turn per channel. The chat coordinator accepts brief traffic interruptions during simple stop/start deployments; cross-replica coordination and custom switching or zero-downtime mechanisms are deferred until an observed need justifies them. This coordinator policy does not constrain background worker replicas.

One [PostgreSQL database](../ADRS/0013-shared-postgresql-storage.md) holds application and Mastra records in separately owned tables. Native BullMQ `QueueEvents` notifies the coordinator after workers save results and complete their jobs. API/chat hosting and execution after acknowledgement, saved-result recovery and pending-event integration, worker region and resource configuration, exact BullMQ recovery and attempt accounting, stopping and duplicate-result handling, implementation schedule, database and Redis hosting, model provider, and authentication vendor remain open. Implementation and milestone planning follow agreement on the relevant product behavior and technical contracts.

## 2. Design ownership

| Design | Owns | User-story coverage |
| --- | --- | --- |
| [Onboarding and account connections](onboarding.md) | Stable account and primary phone binding, signup, separate verified channel links through buttons or QR codes, EVM and Solana off-chain wallet-control proof, provider-led exchange and brokerage setup, Hyperliquid verified-address binding, recovery, and data controls. | `US-ONB` |
| [Portfolio evidence](portfolio.md) | Current portfolio aggregated from provider data, provider-supplied history, and code-based calculations; shared financial observations, USD display, valuation and comparison semantics, freshness, and partial results. A MyStacks indexer and historical P&L or reconstruction requiring MyStacks infrastructure are deferred at low priority. | `US-PORT`, financial evidence used by every other area. |
| [Runtime and memory](runtime.md) | Direct chat through one active backend coordinator, ordered turns and model/tool rounds, main-agent delegation and completion events, continuation examples, protected tools, E2B, native structured personal memory with partial updates and profile-only forgetting, and token-based channel compaction. | `US-CHAT`, `US-MEM` |
| [Tasks and notifications](tasks.md) | Saved-schedule quotas and minimum cadence, independent occurrence admission, bounded whole-job retries and interruption recovery, scheduler ownership, fixed-channel work, lifecycle controls, randomized proactive investigations, notification history, and examples. | `US-TASK`, delivery for continued conversational work. |

Setup and data retrieval have distinct owners: onboarding establishes a connection and its allowed access; portfolio adapters retrieve and normalize evidence under that binding. The runtime and scheduled work consume the same financial operations. Adding providers should reuse identity, evidence, task, memory, and delivery contracts.

The [provider decision](../ADRS/0018-managed-financial-data-providers.md) selects SnapTrade for the target Binance, Coinbase, IBKR, moomoo, and Robinhood accounts; Zerion for supported EVM and Solana wallets; and direct Hyperliquid reads through Webshare at low priority. Actual coverage and freshness remain provider-dependent for the mixed, global audience. DeBank is an optional future EVM complement; Bybit, Upbit, and prediction-market connectors are deferred.

## 3. Cross-area contracts to preserve

### 3.1 Identity and authority

The backend establishes account and channel identity and authorizes each protected operation. Personal memory and financial access use account scope; conversation histories, user-requested jobs, tasks, and their results additionally enforce their originating channel. Task tools receive the current channel from trusted context, not model-selected destinations. Provider and database credentials stay with trusted backend adapters and out of model context, sandbox execution, and traces.

### 3.2 Financial evidence and memory

Current holdings, prices, and permissions come from authorized backend evidence. Personal memory is shared across channels and can guide explanations, but cannot override those facts or act as a copy of channel transcripts and task logs. Native partial profile updates preserve different fields; the last successful save wins for the same field. Mastra's native Observational Memory manages channel context through token-based compaction, with exact budgets still open. Common calculation definitions keep website, chat, and scheduled work consistent. Evidence retains missing coverage; conversational answers describe their actual scope without routine missing-data warnings. An unknown value is not zero.

The [current-evidence decision](../ADRS/0019-current-portfolio-evidence.md) requires the latest relevant provider evidence at analysis time, with brief appropriate reuse and exact age limits still open. Current account-state freshness and market-price freshness are separate: a new price cannot make old holdings current. Delayed sources can support bounded historical claims, and requested answers explain material limitations concisely; proactive work avoids current-exposure conclusions that lack timely evidence. Provider polling and permitted-use constraints must be resolved without silently changing accepted task frequencies or substituting stale account state.

### 3.3 Work and delivery

Conversations, user-defined tasks, digests, and independent initiative use common protected tools and delivery controls. User messages and background completions enter the same ordered channel handler in the active backend process. Native BullMQ completion events notify that coordinator after results are saved in PostgreSQL. Different channels can run concurrently while each channel has one foreground turn. Direct foreground chat accepts interrupted replies without automatic continuation recovery in Phase 1. A completion turn receives a compact summary and result references and can read details when useful. The main agent uses returned work to reason further and compose the reply; actual job status belongs to the backend, while the main agent judges whether the user's request is answered. Recovery of saved, unhandled results remains an integration requirement, with its mechanism and duplicate-delivery handling open.

Background job records and required results persist independently of worker processes. A worker-pool instance lifecycle does not establish job recovery, and the shutdown warning cannot guarantee completion of a long-running job. Reuse a completed result without rerunning successful work. Otherwise, interrupted requested background work that remains active and authorized restarts from the beginning within at most two whole-job attempts in total, including any known temporary scheduled-failure retry. Cancelled work and work whose authority has been revoked do not restart; interrupted proactive investigations wait for the next scheduled check. The [scheduling decision](../ADRS/0004-durable-scheduling-and-queued-execution.md) owns this policy. In-agent checkpoints, replay, and resumption are outside the selected execution design.

User-requested jobs, tasks, histories, and results stay in their originating channel, including after disconnection and relinking. Dashboard and chat share the account's **proactive insight delivery channels** setting, selecting one, both, or none of the linked channels; every newly linked channel is selected by default. Selecting none stops investigations and unsent proactive delivery. Removing or disconnecting a selected channel does not automatically select another. At most one proactive investigation per account runs at a time; each qualifying finding is delivered to all selected, currently eligible verified destinations, with a separate delivery outcome for each channel. The setting routes only proactive insights; chat replies retain their current channel. Schedule eligibility, saved task intent, execution attempts, and delivery outcomes remain distinct concepts with one authority for each record. The backend supplies trusted account, channel, and original-request bindings; a subagent result does not grant additional permission.

### 3.4 Changes to access and retained data

Website source disconnection stops future reads and changes portfolio coverage. Tasks continue only if remaining authorized data fulfills their request; otherwise pause and explain why once. Channel disconnection pauses that channel's tasks. Restoring a source or channel leaves affected tasks paused until explicit resume from their originating channel. Edits apply to future runs, while current permissions and pause/cancel state still constrain active work. Forgetting updates only the saved personal profile and leaves histories and compact summaries intact; retained context may still influence replies or be relearned. Account deletion is deferred; its future scope and retention policy remain separate from accepted memory controls.

### 3.5 Execution limits and measured capacity

The [worker-pool decision](../ADRS/0017-cloud-run-worker-pool.md) owns configurable execution limits and measurement-first capacity planning. Native SDK controls should bound run length and resource use where appropriate. The backend records per-run duration, model usage, and outcome; operators use those records with queue-delay and resource-use observations to adjust worker instance count and job concurrency manually. Exact limits remain provisional until representative jobs provide evidence. A per-user spending budget system is deferred until actual usage justifies it.

## 4. Design completion criteria

- Each in-scope user journey has a success path, meaningful partial or failure outcomes, and the controls a user needs.
- Each protected action has an owner and a trusted user binding; each durable record has one authority.
- Shared financial evidence supports the portfolio, conversation, and proactive paths without incompatible provider-specific calculations in each consumer.
- Open choices that materially affect behavior, authority, cost, or recovery are explicit rather than hidden in example code or a vendor default.
- Representative verification covers user isolation, partial financial data, actual scheduled eligibility, delivery controls, durable memory, and sandbox execution through their real application boundaries.

These criteria guide the joint architecture review and later targeted implementation checks. Capturing a tentative approach does not finalize it or authorize implementation.
