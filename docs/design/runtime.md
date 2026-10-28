# Assistant and Memory Technical Design

## 1. Status and design boundary

**Status: tentative Phase 1 technical design, pending the overall design round.** The [requirements](../requirements.md) own product outcomes; the [architecture](../architecture.md) owns shared execution boundaries. The recorded framework direction uses Mastra's regular `Agent`, fresh trusted `RequestContext` for each run, durable account-scoped state, and E2B for generated code. **BullMQ with Redis remains provisional.** Accepted product behavior constrains these notes; the technical mappings below do not select hosting, models, storage engines, schemas, or exact policies.

The design supports [assistant stories US-CHAT-01–06](../user-stories/assistant.md) and [memory stories US-MEM-01–04](../user-stories/memory.md). Phase 1 permits financial information, analysis, concise reports in chat, memory, and informational tasks; it excludes specific buy, sell, or rebalance recommendations and financial execution.

**Phase 1 is text-first in iMessage and WhatsApp.** Available-source research, significant calculations, E2B execution, and background jobs support concise results in chat. Image replies are optional later work at low priority. Extensive deep-research reports, polished webpage artifacts, full report pages, and long-form report exports are deferred; Phase 1 has no separate web chat or report experience. File analysis remains low priority.

The [channel scope and shared memory ADR](../ADRS/0008-channel-scoped-work-and-shared-memory.md) owns the accepted product boundary: personal memory and financial connections are account-wide; conversation history, compaction, jobs, scheduled tasks, and results belong to their originating channel.

## 2. Trusted entry and agent execution

### 2.1 Run identity and context

- The MyStacks orchestration layer authenticates a verified channel sender, resolves its stable account and channel conversation, and authorizes that mapping before invoking the runtime. Launch channels are iMessage and WhatsApp; future SMS channels remain separate channel integrations.
- Each invocation receives a **fresh trusted `RequestContext`** and authorized account, current channel, and conversation thread bindings. Background execution resolves its account, originating channel, and current permissions through trusted durable state.
- Model arguments, uploaded content, message text, and queued identifiers cannot establish or replace the account or channel binding. Resource and thread IDs identify state; they do not authorize access. Server-owned context keys are populated only after the binding is authorized.
- Shared agent definitions contain common instructions and capability registration. Private run data must not live in shared mutable agent fields or a shared private-file workspace.

The orchestrator authorizes delivery separately from the runtime's memory binding. Jobs and scheduled tasks keep their originating channel as their fixed destination in Phase 1; proactive insights use the account's preferred linked channel under the [task design](tasks.md). A login phone number does not implicitly select a thread or destination. The same shared runtime serves linked channels without a separate VM, queue, or runtime deployment per channel, and without requiring Mastra to interpret provider sender identities. Exact verification adapters, runtime interfaces, and concrete context fields remain open.

### 2.2 Native history and context

**Tentative mapping:** pass trusted account and conversation IDs through Mastra's `memory: { resource, thread }` execution options. Mastra defines resources as owners and threads as conversations, and its native memory loads stored history and persists new messages. Prefer that flow over assembling a second history in the orchestrator. See [Mastra message history](https://mastra.ai/docs/memory/message-history) and [agent execution with memory](https://mastra.ai/reference/agents/generate#with-memory).

The orchestrator owns authenticated routing and authority; Mastra owns the configured history loading, context assembly, persistence, and compaction within those authorized scopes. History and compaction stay within the current channel. Phase 1 does not expose cross-channel history lookup or handoff. The memory design below keeps useful personal facts shared across channels without merging their conversations. Exact memory layers, compaction thresholds, and context budgets remain open.

### 2.3 Skills, tools, and authority

The runtime uses Mastra's native agent, skill, tool, and context facilities. Curated skills guide reasoning; registered backend tools execute trusted capabilities. Adding an applicable skill or tool can extend broad wealth-related work without adding a fixed intent for each request. The [agent capabilities ADR](../ADRS/0006-composable-agent-capabilities.md) owns the rationale for composing reusable tools with generated-code analysis and the conditions for considering a future API proxy.

Protected tool handlers or the financial tools API authorize the current user, account, and object on every protected path. Job and task tools expose only current-channel work, and backend handlers enforce both account and current channel for reads, writes, and result access. Channel ownership is server-bound rather than a model argument; prompts and capability registration do not replace these checks. Shared personal memory uses validated account-scoped backend operations.

Chat controls cover current-channel jobs and tasks, shared personal memory and preferences, and the account-wide proactive on/off setting. The website owns financial connections, channel links and disconnection, and preferred-channel routing settings. Chat can explain those controls and link to the website; it cannot select another channel, transfer work, or change channel configuration.

The tool surface provides read-only financial access. Output policy also applies to explanations, research, reports, artifacts, and messages, so a read-only tool cannot justify a specific investment recommendation. The exact enforcement mechanism remains open; its observable behavior must meet US-CHAT-06.

Financial credentials, refresh tokens, database credentials, and E2B management keys stay in trusted backend adapters. They must not enter prompts, `RequestContext`, job payloads, traces, generated code, tool results, or sandbox files and environment variables.

## 3. Evidence and conversational answers

### 3.1 Shared financial evidence

The [portfolio design](portfolio.md) owns the account-wide financial connections and evidence contract used by the website connection preview, user-requested chat answers, reports, and digests. Runtime consumers preserve that contract through calculations and presentation, including the evidence needed to interpret aggregation and conversions.

The runtime distinguishes financial observations, research claims, supplied documents, assumptions, and hypothetical results. A source document or retrieved passage is evidence to examine, not an instruction that can change authority or tool access.

Available evidence can support a useful partial answer without routine missing-data warnings. The response must describe its actual scope and must not convert missing information into zero or no risk. When the user explicitly asks for unavailable information, explain what is unavailable and offer the closest useful supported answer. Personalization memory does not supply current holdings, prices, or permissions.

### 3.2 Request scope and text-first responses

The runtime resolves ambiguity when it materially changes the requested answer, authorized data, or calculation. Otherwise it can state a reasonable assumption and provide useful information. It combines relevant tools and skills within the wealth and assets domain rather than routing every question through a closed intent catalog.

Every answer, research summary, report, scheduled result, and proactive insight leads with the answer or main finding. The response includes key numbers and the relevant reasoning and evidence needed to understand the result, using short paragraphs or bullets that read naturally in the channel. Follow-up messages provide deeper detail. Concision must preserve important reasoning and evidence rather than impose a rigid word count or append routine missing-information warnings.

Response length does not limit execution depth: supported research can examine available sources, calculations can require substantial generated-code work, and background jobs can continue independently before returning a concise result.

For longer work, the assistant briefly acknowledges the request and describes the intended work, including useful initial information when available. It must clearly distinguish completed findings from work still underway. Exact latency targets and the boundary between synchronous and continued work remain open.

## 4. Continued work and durable outcomes

### 4.1 Ownership and durability

**Accepted behavior:** longer work can run as an independent agent job while the main chat remains usable. Each job has its own task-scoped context under its account and originating channel; ordinary new chat does not silently become input to that job. Multiple jobs may run within capacity limits that remain open.

**Tentative persistence:** continued analysis retains enough state under its account and originating channel to identify the request, authorized input references, task context, progress, and outcome outside the serving worker. Required outputs also persist outside the worker and disposable sandbox. Results return to the originating channel and are inspectable only within that channel. Concrete records and storage remain open.

A one-off continued analysis does not implicitly create an ongoing task. The [task design](tasks.md) owns standing task intent, schedule ownership, execution attempts, and delivery policy. A recurring task remains distinct from each attempt; the runtime supplies analysis within the claimed work.

Under the provisional queue choice, BullMQ owns queued eligibility and retries. Mastra performs agent execution within a claimed job; a second independent background scheduler or retry owner must not manage the same work. Whether initial chat execution enters the queue remains open.

Durability does not promise checkpoint resumption inside an interrupted model call. The implementation must select whether interrupted work restarts, resumes a supported boundary, or reports failure, and must preserve enough outcome information to tell the user what happened.

### 4.2 Progress, failure, cancellation, and delivery

The user can leave chat while longer work continues and receive its result in the originating channel later. In that channel, the user can list jobs, ask for status, inspect results, and cancel a selected job. Another linked channel cannot list or control that work or retrieve its result. Progress messages contain meaningful updates. Jobs reach completion, failure, or cancellation; the user must distinguish these terminal outcomes from work in progress and useful partial output. A tool error or exhausted budget must not become an unsupported success claim. Exact status names, progress presentation, timeouts, retry limits, and replay behavior remain open.

**Accepted chat control:** a user can ask the assistant to stop longer work. The implementation must distinguish accepting cancellation from confirming that execution has stopped. Exact stopping behavior and effects on in-flight tool calls, retained partial artifacts, charges, and later delivery remain open; cancellation does not promise rollback of work already performed. **Steering a running job is low priority and deferred.** A new chat message remains ordinary conversation unless it explicitly invokes a supported job control. Changing a standing task's settings is separate from steering its active attempt.

Before delivering an outcome, the orchestration layer rechecks current permissions, originating-channel validity, and delivery authority; task results also use current pause and cancellation state. A future-only task edit does not itself invalidate an active attempt using its original instructions. The [task design](tasks.md) owns pauses, edits, retries, and repeated delivery. Disconnecting a channel pauses its scheduled tasks, future runs, and pending deliveries without rerouting them; relinking retains history and work but requires the user to resume tasks from that channel. Cancellation or delivery checks cannot recall an already-started send, and one-off jobs retain the outcome and cancellation guarantees above.

## 5. Analysis execution and optional files

### 5.1 Supplied-file ownership and interpretation

File analysis is **low priority**. When an upload has no instructions, the assistant asks what the user wants and clarifies intent before analysis. Clear accompanying instructions guide the work without an unnecessary question.

- An upload is bound to its authenticated owner and authorized analysis before storage or processing. Later reads must enforce the same object access boundary.
- The upload boundary validates supported formats and configured file limits. Parsers treat document text, formulas, embedded content, and CSV cells as untrusted input.
- Extracted values retain their source, relevant date, and units. Unsupported sections and ambiguous values remain visible gaps; supplied statements are not live connected-account observations.
- Instructions embedded in uploads or retrieved material cannot grant tools, authorize an action, or override the user's request. Generated code and untrusted executable content must not run in shared workers.

Supported formats, parsing libraries, upload interfaces, size limits, retention, and handling of damaged or encrypted files remain open. These decisions must bound US-CHAT-04 without promising universal document support.

### 5.2 E2B execution and checked results

**Generated-code analysis is in Phase 1**, including significant calculations that use connected or researched data without a supplied file. The E2B execution tool binds each sandbox to one user's task or analysis session and supplies only the selected code and data. A live sandbox cannot be reused across users. Native SDKs or a native Mastra adapter may implement this boundary; the adapter choice remains open.

**Outbound internet is disabled by default for financial analysis.** Trusted backend tools supply needed financial and research data. Any network exception requires explicit backend policy. Credentials stay outside sandbox mounts, code, files, environment variables, and outputs.

The tool enforces configured execution limits and returns errors, outputs, and any generated files to the runtime. Before using results, the runtime checks that they address the selected inputs and method, with appropriate numerical and unit checks. A successful process exit alone is not a verified financial conclusion.

Required outputs and any generated files are persisted to durable storage under their account and originating channel before the adapter terminates the disposable sandbox. When artifacts are enabled, access rechecks account, channel, and permissions; an artifact reference alone grants no access. Failed persistence must not be reported as an available artifact. Optional visual and artifact formats do not change the text-first reply contract.

Session limits, deadlines, resource budgets, interruption cleanup, permitted pause/resume behavior, artifact formats, and provider retention and deletion remain open. Sandbox pause does not establish deletion.

## 6. Memory lifecycle and user control

### 6.1 Native facilities and durable writes

The runtime prefers **Mastra message history, working memory, and storage adapters** with explicit account and thread scopes. MyStacks owns the selection and write policy; it does not build a separate memory engine. Exact configuration and storage schemas remain open.

| Scope | Context and state |
| --- | --- |
| **Stable account** | Shared personal facts, goals, and preferences, plus financial connections and portfolio evidence. Personal memory is one logical resource shared by linked channels. Financial connections and evidence remain in their owning backend boundary. |
| **Channel conversation** | Separate history, current topic, compaction state, independent jobs, scheduled tasks, and results for each linked channel. Transcripts, task records, and results are not merged or mirrored between channels. |
| **Independent job** | Task-scoped instructions, selected inputs, progress, and outcome under the account and originating channel, separate from ordinary chat and other jobs. A job may use authorized shared personal context without copying task records or results into that memory. |

**Tentative native mapping:** account-resource working memory holds useful personal facts; thread-scoped history and compaction retain the current channel's conversation. [Mastra working memory](https://mastra.ai/docs/memory/working-memory) supports resource-wide personal context. Its [observational memory scopes](https://mastra.ai/docs/memory/observational-memory#scopes) favor per-thread observations and deprecate resource-scoped observations. Any enabled retrieval must preserve the current-channel history boundary; framework support for cross-thread recall does not authorize cross-channel lookup.

The assistant **automatically remembers useful personal context**, including facts, goals, preferences, and relevant circumstances learned in either linked channel; users can also explicitly ask it to remember a detail. A clear new user statement automatically updates the applicable older personal fact, goal, or preference without an explicit correction request. These updates apply across linked channels. If conflicting personal statements leave the user's meaning unclear, the assistant asks for clarification only when resolution materially changes the answer; otherwise it answers without treating the disputed fact as settled.

Shared memory must not become a copy of transcripts, task records, or results. Validated backend writes serve automatic and explicit memory. The assistant acknowledges only information that was saved, and a correction updates the applicable remembered item. Relevant context must remain available in a later authorized conversation after worker replacement. Detailed selection, storage representation, and write mechanics remain open within this accepted behavior.

The backend validates account, current channel, and thread bindings before loading history or writing memory. Shared personal context is available from either linked channel, while each conversation keeps its current topic and history. The agent may know which channels exist and explain website controls without loading another channel's transcripts or task logs. A model-supplied item, channel, or thread identifier cannot authorize access.

Retained user-stated or user-confirmed facts and assistant guesses or interpretations must remain distinguishable; the assistant must not present its interpretations as confirmed user facts. Financial observations belong to the financial data boundary. Even the newest user statement about holdings, balances, prices, or access remains user-supplied context and cannot overwrite provider financial evidence or create account permission.

### 6.2 Concurrent updates and correction

Linked chats and background jobs may update the same account's personal memory concurrently. The chosen write policy must preserve concurrent updates and prevent an older in-flight update from silently undoing an accepted correction or forgetting operation. Corrections and forgetting apply across the account, including other linked channels. Simultaneous-write ordering, same-field merging, schemas, and the effects on work already reading memory remain open implementation choices. The behavior in section 6.1 constrains these implementation choices.

**Candidate capability:** Mastra documents atomic merges for schema-based resource working memory with `@mastra/pg`; other adapters have different concurrency limits, and free-text working memory replaces the full value. This is evidence to evaluate, not a database or schema selection. See [working-memory merge and concurrency behavior](https://mastra.ai/docs/memory/working-memory#concurrent-updates).

Prefer selected storage and native framework capabilities where they meet the requirement. No custom lock, merge layer, event log, or coordination service is selected. Native field merging alone does not settle correction and forgetting precedence.

### 6.3 Inspection, forgetting, and derived layers

**Accepted chat controls:** authorized users can inspect and correct remembered personal context, forget a specific detail, or clear all remembered personal context. The product must distinguish an accepted removal request from completed removal or failure.

The implementation must identify every enabled memory layer. Forgetting must cover applicable source records and all enabled derived representations, including profiles, summaries, and vectors. An old channel summary or other retained derivative must not restore a forgotten personal fact into shared memory. Prompt trimming is not stored-data deletion.

Enabled native layers, semantic recall, source attribution, and detailed write and deletion rules remain open within the accepted automatic-memory experience and chat controls. The initial design must not assume that every conversation becomes a profile fact or vector record.

Retention for conversation history, memory, artifacts, backups, and providers needs an explicit policy. User-facing controls must describe the actual scope and completion limits instead of promising instant universal erasure.

## 7. Minimal operational evidence

Operations need enough evidence to relate an authorized request to its execution outcome, protected tool failures, queue delay where used, persistence of outputs and any generated files, and delivery outcome. Resource use must be visible enough to enforce the selected analysis budgets. Exact telemetry, retention, and operating thresholds remain open.

Logs and traces must follow the credential boundary and selected handling policy for private financial data. Monitoring should support diagnosing failures and interrupted work without copying full private inputs into routine diagnostics by default.

Verification must demonstrate account isolation across chat and background entry paths, current-channel history and task/result access, concise text-first results that preserve relevant reasoning and evidence, checked calculation outputs and any enabled artifacts, shared personal memory learned across channels, preserved concurrent updates and corrections, and truthful job outcomes while chat remains usable. Memory checks must cover clear new personal statements automatically updating older facts across channels, clarification only for ambiguity that materially affects the answer, and a visible distinction between user facts and assistant interpretations. A newer user financial statement must not replace provider financial evidence. Channel relinking must not silently resume paused scheduled tasks. Forgetting verification must cover every enabled derived memory layer and prevent old channel summaries from restoring removed facts.

## 8. Open implementation decisions

| Area | Decision still needed |
| --- | --- |
| Interfaces | Sender verification and account linking, channel conversation binding, model/provider configuration, Mastra package versions, and context fields. |
| Continued work | Durable records, task-context configuration, capacity, restart/resume/failure policy, progress presentation, exact cancellation and in-flight behavior, retry and replay behavior. Running-job steering remains deferred. |
| Execution and optional files | Quotas, E2B configuration, checked-result methods, low-priority upload formats and parsers, and artifact access and retention when enabled. |
| Memory | Enabled native layers, schemas and source distinctions, selection, compaction and context budgets, simultaneous-write ordering and merging, implementation of accepted updates and chat controls, retention, and deletion completion. |
| Operations | Hosting, datastore adapters, resource budgets, telemetry, recovery, and provider data terms. |

Accepted product behavior and standing framework choices constrain these decisions; the account, channel, and job mappings await the overall design round. The portfolio and task designs own their respective evidence and standing-work contracts.
