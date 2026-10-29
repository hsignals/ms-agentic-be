# Phase 1 technical designs

## 1. Scope and authority

**Status: overall architecture under joint review.** This design set supports the **complete Phase 1 experience** described by the [user stories](../user-stories/README.md). It records responsibilities, data and authority boundaries, and execution flows. Agreed product behavior and Phase 1 execution decisions remain distinct from provisional technology integrations and open implementation choices. None of these documents claims a running implementation.

The [architecture](../architecture.md) and [ADRs](../ADRS/) own the accepted shared Mastra runtime, backend financial authority, direct foreground chat, queued background execution with provisional BullMQ + Redis, and E2B generated-code boundary. The [channel-turn ADR](../ADRS/0009-channel-turns-and-background-subagents.md) explains main-agent ownership of replies and background continuations. These designs refine those decisions. The [requirements](../requirements.md) own product authority, supported connection categories, best-effort monitoring, and information quality.

Chat is the default assistant surface after phone/SMS signup and channel linking. The persistent website dashboard manages financial connections and messaging channels through the same Add account flow for new and returning users, with previews and Add more. Each iMessage or WhatsApp chat manages its own tasks and jobs; personal memory and financial evidence are shared across the account. The [channel scope ADR](../ADRS/0008-channel-scoped-work-and-shared-memory.md) owns that trade-off.

All answers and reports are concise, precise text suited to chat. Available-source research, substantial calculations, and background execution can support that output; image replies are low priority, while extensive deep-research reports and polished website report artifacts are deferred.

Logical components may share a deployment. This set does not select an implementation schedule, deployment topology, storage engine, model provider, or authentication vendor. Implementation and milestone planning follow agreement on the relevant product behavior and technical contracts.

## 2. Design ownership

| Design | Owns | User-story coverage |
| --- | --- | --- |
| [Onboarding and account connections](onboarding.md) | Stable account and primary phone binding, signup, separate channel links, EVM wallet-control verification, financial connection setup, recovery, and data controls. | `US-ONB` |
| [Portfolio evidence](portfolio.md) | Provider data and code-based calculations without a Phase 1 indexer; shared financial observations, USD display, valuation and comparison semantics, freshness, and partial results. | `US-PORT`, financial evidence used by every other area. |
| [Runtime and memory](runtime.md) | Direct chat, ordered turns and model/tool rounds, main-agent delegation and completion events, continuation examples, protected tools, E2B, native structured personal memory with flexible text, and channel histories. | `US-CHAT`, `US-MEM` |
| [Tasks and notifications](tasks.md) | Saved-schedule quotas and minimum cadence, independent occurrence admission, scheduled-execution retries, scheduler ownership, fixed-channel work, lifecycle controls, randomized proactive investigations, notification history, and examples. | `US-TASK`, delivery for continued conversational work. |

Setup and data retrieval have distinct owners: onboarding establishes a connection and its allowed access; portfolio adapters retrieve and normalize evidence under that binding. The runtime and scheduled work consume the same financial operations. Adding providers should reuse identity, evidence, task, memory, and delivery contracts.

## 3. Cross-area contracts to preserve

### 3.1 Identity and authority

The backend establishes account and channel identity and authorizes each protected operation. Personal memory and financial access use account scope; histories, jobs, tasks, and results additionally enforce their originating channel. Task tools receive the current channel from trusted context, not model-selected destinations. Provider and database credentials stay with trusted backend adapters and out of model context, sandbox execution, and traces.

### 3.2 Financial evidence and memory

Current holdings, prices, and permissions come from authorized backend evidence. Personal memory is shared across channels and can guide explanations, but cannot override those facts or act as a copy of channel transcripts and task logs. Common calculation definitions keep website, chat, and scheduled work consistent. Evidence retains missing coverage; conversational answers describe their actual scope without routine missing-data warnings. An unknown value is not zero.

### 3.3 Work and delivery

Conversations, user-defined tasks, digests, and independent initiative use common protected tools and delivery controls. Background job records and required results persist independently of worker processes. Direct foreground chat accepts interrupted replies without automatic continuation recovery in Phase 1. Background completion invokes the same ordered channel handler as incoming messages; the main agent uses returned work to reason further and compose the reply. Actual job status belongs to the backend, while the main agent judges whether the user's request is answered.

User-created tasks and their results stay in the creating channel, including after disconnection and relinking; independent proactive insights use account-level preference routing. Schedule eligibility, saved task intent, execution attempts, and delivery outcomes remain distinct concepts with one authority for each record. The backend supplies trusted account, channel, and original-request bindings; a subagent result does not grant additional permission.

### 3.4 Changes to access and retained data

Website source disconnection stops future reads and changes portfolio coverage. Tasks continue only if remaining authorized data fulfills their request; otherwise pause and explain why once. Channel disconnection pauses that channel's tasks. Restoring a source or channel leaves affected tasks paused until explicit resume from their originating channel. Edits apply to future runs, while current permissions and pause/cancel state still constrain active work. Forgetting memory requires coordination across enabled stores and an accurate completion claim. Account deletion is deferred; its future scope and retention policy remain separate from accepted memory controls.

## 4. Design completion criteria

- Each in-scope user journey has a success path, meaningful partial or failure outcomes, and the controls a user needs.
- Each protected action has an owner and a trusted user binding; each durable record has one authority.
- Shared financial evidence supports the portfolio, conversation, and proactive paths without incompatible provider-specific calculations in each consumer.
- Open choices that materially affect behavior, authority, cost, or recovery are explicit rather than hidden in example code or a vendor default.
- Representative verification covers user isolation, partial financial data, actual scheduled eligibility, delivery controls, durable memory, and sandbox execution through their real application boundaries.

These criteria guide the joint architecture review and later targeted implementation checks. Capturing a tentative approach does not finalize it or authorize implementation.
