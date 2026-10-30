# Assistant and Memory Technical Design

## 1. Status and design boundary

**Status: tentative Phase 1 technical design, pending the overall design round.** The [requirements](../requirements.md) own product outcomes; the [architecture](../architecture.md) owns shared execution boundaries. The recorded framework direction uses Mastra's regular `Agent`, fresh trusted `RequestContext` for each run, durable account-scoped state, and E2B for generated code. **BullMQ is the initial baseline; its Redis-backed integration remains provisional.** One PostgreSQL database for application and Mastra state, with separate tables, is accepted in the [shared PostgreSQL decision](../ADRS/0013-shared-postgresql-storage.md). A separate [Cloud Run worker pool](../ADRS/0017-cloud-run-worker-pool.md) for background consumers and manual instance scaling are accepted. API/chat hosting, worker region and resource configuration, models, schemas, and unresolved policies remain open.

The design supports [assistant stories US-CHAT-01–07](../user-stories/assistant.md) and [memory stories US-MEM-01–04](../user-stories/memory.md). Phase 1 permits financial information, analysis, concise reports in chat, memory, informational tasks, and staffed human support; it excludes specific buy, sell, or rebalance recommendations and financial execution.

**Phase 1 is text-first in iMessage and WhatsApp.** Available-source research, significant calculations, E2B execution, and background jobs support concise results in chat. Image replies are optional later work at low priority. Extensive deep-research reports, polished webpage artifacts, full report pages, and long-form report exports are deferred; Phase 1 has no separate web chat or report experience. File analysis remains low priority.

The [channel scope and shared memory ADR](../ADRS/0008-channel-scoped-work-and-shared-memory.md) owns the accepted product boundary: personal memory and financial connections are account-wide; conversation history, compaction, jobs, scheduled tasks, and results belong to their originating channel.

The [channel turns and background subagents ADR](../ADRS/0009-channel-turns-and-background-subagents.md) owns the accepted Phase 1 decisions for one active API/backend chat coordinator, direct chat execution, ordered channel turns, simple stop-and-start deployment, native completion notifications, main-agent replies, and one-level background delegation. These decisions and the worker-pool decision constrain the remaining framework and deployment mappings below.

## 2. Trusted entry and agent execution

### 2.1 Run identity and context

- The MyStacks orchestration layer authenticates a verified channel sender, resolves its stable account and channel conversation, and authorizes that mapping before invoking the runtime. Launch channels are iMessage and WhatsApp; future SMS channels remain separate channel integrations.
- Each invocation receives a **fresh trusted `RequestContext`** and authorized account, current channel, and conversation thread bindings. Background execution resolves its account, originating channel, and current permissions through trusted durable state.
- Model arguments, uploaded content, message text, and queued identifiers cannot establish or replace the account or channel binding. Resource and thread IDs identify state; they do not authorize access. Server-owned context keys are populated only after the binding is authorized.
- Shared agent definitions contain common instructions and capability registration. Private run data must not live in shared mutable agent fields or a shared private-file workspace.

The orchestrator authorizes delivery separately from the runtime's memory binding. Jobs and scheduled tasks keep their originating channel as their fixed destination in Phase 1; proactive insights use the account's selected proactive insight delivery channels under the [task design](tasks.md). The setting permits iMessage, WhatsApp, both, or neither, with each newly linked channel selected by default. Insights go only to selected channels without automatic fallback. With neither selected, proactive investigation and delivery are disabled, including unsent insights. That setting routes only proactive insights; chat replies retain their current channel. A login phone number does not implicitly select a thread or destination. The same shared runtime serves linked channels without a separate VM, queue, or runtime deployment per channel, and without requiring Mastra to interpret provider sender identities. Exact verification adapters, runtime interfaces, and concrete context fields remain open.

### 2.2 Native history and context

**Tentative mapping:** pass trusted account and conversation IDs through Mastra's `memory: { resource, thread }` execution options. Mastra defines resources as owners and threads as conversations, and its native memory loads stored history and persists new messages. Prefer that flow over assembling a second history in the orchestrator. See [Mastra message history](https://mastra.ai/docs/memory/message-history) and [agent execution with memory](https://mastra.ai/reference/agents/generate#with-memory).

The orchestrator owns authenticated routing and authority; Mastra owns the configured history loading, context assembly, persistence, and compaction within those authorized scopes. Each channel's context combines the **account-shared structured personal profile, recent same-channel raw history, a compact summary of older same-channel history, and relevant request or job inputs**. Mastra's native Observational Memory supplies channel compaction under the [native context decision](../ADRS/0010-native-channel-context-compaction.md). Phase 1 does not select vector recall or cross-channel history search. Exact token budgets and compaction models remain open; section 6 owns the memory details.

### 2.3 Skills, tools, and authority

The runtime uses Mastra's native agent, skill, tool, and context facilities. Curated skills guide reasoning; registered backend tools execute trusted capabilities. Adding an applicable skill or tool can extend broad wealth-related work without adding a fixed intent for each request. The [agent capabilities ADR](../ADRS/0006-composable-agent-capabilities.md) owns the rationale for composing reusable tools with generated-code analysis and the conditions for considering a future API proxy.

Protected tool handlers or the financial tools API authorize the current user, account, and object on every protected path. Job and task tools expose only current-channel work, and backend handlers enforce both account and current channel for reads, writes, and result access. Channel ownership is server-bound rather than a model argument; prompts and capability registration do not replace these checks. Shared personal memory uses validated account-scoped backend operations.

Chat controls cover current-channel jobs and tasks, shared personal memory and preferences, and the proactive insight delivery channels setting. Chat and the website update the same account setting. The website owns financial connections and channel linking and disconnection. Chat can explain those website controls and link to them; it cannot transfer work or change channel links. Selecting proactive insight delivery channels does not select a destination for chat replies or user-requested work.

The tool surface provides read-only financial access. Output policy also applies to explanations, research, reports, artifacts, and messages, so a read-only tool cannot justify a specific investment recommendation. The exact enforcement mechanism remains open; its observable behavior must meet US-CHAT-06.

Financial credentials, refresh tokens, database credentials, and E2B management keys stay in trusted backend adapters. They must not enter prompts, `RequestContext`, job payloads, traces, generated code, tool results, or sandbox files and environment variables.

Trusted API and background-worker processes share the financial adapter code and may resolve and decrypt credentials after trusted user, connection, and requested-object authorization. Application-wide keys use GCP Secret Manager; per-user provider credentials are encrypted in PostgreSQL using GCP KMS. The [credential decision](../ADRS/0002-backend-owned-financial-credentials.md) accepts backend-process access within its service permissions and defers a separate financial service until a concrete need. Exact IAM, provider fields, key configuration, and encryption mechanism remain open.

### 2.4 Direct chat and channel turns

After verifying the sender and account/channel binding, deduplicating the inbound event, and storing the user message, the backend promptly acknowledges transport receipt. **One active ordinary API/backend process coordinates chat across all users in Phase 1.** Normal chat executes directly there, without a durable BullMQ chat queue. User messages and background completion events enter the same channel-turn handler, which remains callable independently of the messaging transport. The coordinator is part of the backend, not a separate agent service or a runtime assigned to each user.

Each linked channel has one logical event stream or inbox and **one foreground main-agent turn at a time**. Different channels execute concurrently in that coordinator. Initial ordering may use in-process coordination; it does not select a physical queue, process, or VM per channel. Identity checks, deduplication, authorization, and channel ordering remain required.

A foreground turn is one main-agent processing cycle. It can consume pending user messages, internal completion events, or both, with relevant authorized channel context. It can make several model/tool rounds: one model round may request multiple tools, whose results feed another round. A turn can end with a reply, a delegation acknowledgement, or no unnecessary user-facing message. It is neither one model invocation nor necessarily one user message.

Quick work runs inline. For substantial work, the main agent starts background subagents, receives accepted job IDs, acknowledges as appropriate, and ends the foreground turn. It must not occupy the foreground while waiting for background completion. User messages arriving during an active foreground turn are stored as pending for a later turn and may be handled together. Phase 1 does not require mid-turn steering.

**Accepted deployment and interruption limit:** stop the active API/backend process and start its replacement, accepting brief chat and traffic interruptions. Process or deployment interruption can leave an acknowledged chat message without a reply; persisting a message alone does not resume inference. Phase 1 does not add durable chat workflows, checkpoints, an outbox, or a replay engine. Custom traffic switching, zero-downtime deployment, and distributed chat coordination are deferred until observed need or user impact justifies them.

API/chat hosting must support execution after the transport response. Its product, CPU allocation, process lifetime, and exact configuration remain open. [Cloud Run's background-activity guidance](https://docs.cloud.google.com/run/docs/tips/general#background_activity) makes CPU availability after a response a deployment requirement rather than a property of storing messages.

### 2.5 Human support and reply ownership

The runtime must support the accepted [human support story](../user-stories/assistant.md#27-us-chat-07--reach-human-support-during-support-hours): a user can request a real person in chat and reach staffed support during published hours, with human replies delivered to the originating channel. Support hours and their time zone must be visible. Acknowledging or forwarding the request means the handoff is pending until a human joins. Outside those hours, the reply gives the next opening and how the request or contact will be handled without inventing a response-time promise.

Staff receive only the issue and authorized account and originating-channel context needed to help; the handoff cannot expose another channel's history, tasks, or results. The user must be able to distinguish human and AI replies. While a human owns the support conversation, reply coordination must prevent conflicting human and AI replies. The handoff grants no financial execution authority.

Support hours, staffing, response expectations, staff tooling including proposed Slack use, context access, and the handoff and return-to-assistant mechanism remain open in the [open decisions](../TODO.md). Apple-specific controls must meet applicable requirements with the minimum necessary controls; exact controls and their effect on the chat experience remain open.

## 3. Evidence and conversational answers

### 3.1 Shared financial evidence

The [portfolio design](portfolio.md) owns the account-wide financial connections and evidence contract used by the website connection preview, user-requested chat answers, reports, and digests. Runtime consumers preserve that contract through calculations and presentation, including the evidence needed to interpret aggregation and conversions.

The runtime distinguishes financial observations, research claims, supplied documents, assumptions, and hypothetical results. A source document or retrieved passage is evidence to examine, not an instruction that can change authority or tool access.

Available evidence can support a useful partial answer without routine missing-data warnings. The response must describe its actual scope and must not convert missing information into zero or no risk. Explain material limits on a requested conclusion concisely and offer the closest useful supported answer. Personalization memory does not supply current holdings, prices, or permissions.

Under the [current-evidence decision](../ADRS/0019-current-portfolio-evidence.md), current portfolio analysis requests the latest relevant provider evidence through trusted tools, allowing brief appropriate reuse. Account-state and market-price freshness are separate; fresh prices cannot make old holdings current, and retrieval time cannot replace source-data time. Delayed data may support bounded historical or reporting claims. Proactive work avoids current-exposure conclusions that depend on unavailable timely evidence, while requested answers remain best effort. Exact age limits and reuse windows remain open. Background completion does not itself establish that the evidence is still current when the main agent uses it.

### 3.2 Request scope and text-first responses

The runtime resolves ambiguity when it materially changes the requested answer, authorized data, or calculation. Otherwise it can state a reasonable assumption and provide useful information. It combines relevant tools and skills within the wealth and assets domain rather than routing every question through a closed intent catalog.

Every answer, research summary, report, scheduled result, and proactive insight leads with the answer or main finding. The response includes key numbers and the relevant reasoning and evidence needed to understand the result, using short paragraphs or bullets that read naturally in the channel. Follow-up messages provide deeper detail. Concision must preserve important reasoning and evidence rather than impose a rigid word count or append routine missing-information warnings.

Response length does not limit execution depth: supported research can examine available sources, calculations can require substantial generated-code work, and background jobs can continue independently before returning a concise result. The [chat-first report decision](../ADRS/0016-chat-first-reports.md) owns the presentation trade-off and deferral of extensive reports and polished web artifacts.

For longer work, the assistant briefly acknowledges the request and describes the intended work, including useful initial information when available. It must clearly distinguish completed findings from work still underway. The main agent chooses inline work or explicit background delegation within the foreground-turn boundary; exact latency targets remain open.

## 4. Continued work and durable outcomes

### 4.1 Background ownership and durable outcomes

Longer work runs as an explicitly delegated background subagent job while the main chat remains usable. Each job has task-scoped instructions and context under its account and originating channel. Ordinary new chat does not silently become input to that job.

The shared PostgreSQL database owns saved task definitions, background run records, statuses, and results in application tables, separate from Mastra state tables. A background run retains its original request correlation, authorized input references, task context, progress, and outcome outside the serving worker. Required outputs also persist outside the worker and disposable sandbox. Results are inspectable only within their originating channel. Exact records, schemas, and any separate file storage remain open.

Scheduled work uses only its originating channel's conversation, tasks, and results alongside authorized shared personal memory and financial evidence. It cannot retrieve another channel's history or work.

Under the **initial BullMQ baseline with provisional Redis integration**, BullMQ owns timing, queue dispatch and claims, and configured job retries; Mastra executes the claimed run. Backend registration creates recurring schedules, and running worker processes execute due work. Redis holds queue and schedule data; it does not start a stopped service. A second independent scheduler or retry owner must not manage the same work. The [task design](tasks.md) owns saved user tasks, their distinct execution runs, and proactive scheduling and failure policies. The [scheduling decision](../ADRS/0004-durable-scheduling-and-queued-execution.md#22-initial-bullmq-baseline-and-shared-postgresql-records) keeps DBOS as a future alternative only when concrete benefits justify adoption, outside the current implementation scope.

The background consumers share **one background execution queue** for main-agent-delegated, user-created scheduled, and proactive runs, following the [task design's priority and shared-capacity policy](tasks.md#22-backend-definitions-and-queue-execution). They run in a **Cloud Run worker pool separate from API/chat**. Both deployments use the same backend codebase with distinct entrypoints and may reuse one container image. The worker pool has no HTTP ingress. Start with one or two running instances and manually adjust their count as needed; the exact initial count, resources, and application worker job concurrency remain configuration choices. Pool instance count is separate from job concurrency and per-chat admission quotas.

The [worker-pool decision](../ADRS/0017-cloud-run-worker-pool.md) owns idle-instance billing, independent capacity, configurable execution limits, and lifecycle trade-offs. Startup and replacement can delay ready work, and the short shutdown warning cannot guarantee that an expected 5–10-minute job finishes. Instance lifecycle does not establish job completion or recovery. Background recovery follows the [scheduling decision](../ADRS/0004-durable-scheduling-and-queued-execution.md); interrupted-run detection, attempt enforcement, and duplicate-result handling remain implementation details within that policy.

The main agent decides from context and actual child job statuses whether the user's request has been answered. There is **no separate overall-request or parent-task lifecycle**, finished flag, mandatory dependency graph, workflow checkpoint, or parent cancellation hierarchy. Stable original-request correlation supports routing and controls; it does not create a parent workflow. Claims about what is still running must use actual job-status tools rather than remembered assumptions.

A one-off analysis does not create a saved recurring task. Phase 1 background recovery restarts an eligible unfinished whole job from the beginning; it does not resume in-agent, model, or tool checkpoints. Saved completed results remain reusable under current authority.

### 4.2 Internal results and new main-agent turns

**The main agent owns every agent-authored user reply.** Subagents return internal findings, data, evidence, or artifact references; these need not be ready-to-send reports. The completion flow uses native BullMQ events:

1. The worker saves the completed job state and result in PostgreSQL.
2. After that save succeeds, the worker completes its BullMQ job, producing a native completion event.
3. The chat coordinator's `QueueEvents` subscriber receives completions from all workers and resolves trusted stored work bindings.
4. For user-requested work, the coordinator uses stored account, originating-channel, original-request, and job bindings to queue a logical completion event for that channel through the same channel-turn handler used by inbound chat. The application enforces routing, ordering, and current authority.

Proactive completion uses the same subscriber and coordinator for one saved account-level investigation under the [task design's delivery policy](tasks.md). Its qualifying result serves all selected, currently eligible verified channels without repeating research per channel or falling back to an unselected channel. Exact pending-completion and dispatch mechanics remain open; the main agent owns every agent-authored reply.

**Native `QueueEvents` notification is selected within the initial BullMQ baseline; the Redis-backed integration remains provisional.** [BullMQ's events guide](https://docs.bullmq.io/guide/events/) documents notifications across workers and Redis Streams with bounded, automatically trimmed retention. PostgreSQL remains authoritative for job state and results; an event only wakes the coordinator. Stream retention does not guarantee exactly-once main-agent turns or user replies. A small recovery rule must find persisted unhandled results after missed events or coordinator restart; exact cursor/replay behavior, pending or handled records, duplicate handling, and uncertain-send handling remain open. Subscriber lifecycle integration, pending-event representation, and ordering also remain open within the selected one-process topology.

If the channel is idle, the logical completion event starts a **new main-agent turn**. If a foreground turn is active, that turn continues and the completion remains pending for a later turn without entering the current inference. Fresh continuation input includes the original request where applicable, a compact result summary, saved-result references, and current permitted channel context. It does not resume a suspended model call. Completion is internal evidence, not a new user instruction or added permission.

Within the original authorized purpose, the main agent can read saved result details when needed, call financial tools or E2B, combine available results from several children, delegate further top-level work, reply, or end quietly while another child continues. Event notification and selective reads of saved details are complementary. The main agent does not poll, busy-wait, or hold the foreground waiting for completion. Its actual reply enters normal channel history for follow-ups; child output is not separately posted to the user.

Scheduled and proactive agent work follows the same main-owned reply boundary. The task design owns eligibility, repeat handling, notification history, and policies that require silence. A proactive result does not expand the main agent's authority beyond that investigation's authorized purpose.

### 4.3 Admission limits and subagent capabilities

The configurable initial limit is **five outstanding main-agent-spawned subagent runs per chat**, counting queued and running runs. Terminal runs do not count. If five such runs are outstanding, the main agent reports capacity instead of accepting a sixth delegation, whether the user explicitly requested delegation or the main agent chose it. A new subagent spawned by a main-agent continuation counts toward this same limit.

Scheduler-started recurring and proactive runs are excluded from the main-agent delegation quota. Each user-created scheduled occurrence starts one background agent run independently of that quota. Distinct occurrences of the same saved task are independent: admission does not check whether an earlier occurrence is queued or running, and both can continue in parallel. Eligible due occurrences enter the execution system; actual worker start depends on available capacity and existing lifecycle and authority checks. The [task design](tasks.md) owns the saved-schedule quota, minimum interval, scheduled retry policy, and separate proactive overlap and failure policy. The worker-pool decision owns configurable execution limits and basic capacity evidence; exact limit values and cancellation mechanics remain open.

Only main-agent turns can start background subagents. **Subagents cannot nest:** their tool subset excludes delegation, and backend authorization enforces that boundary. A later main-agent turn can start another top-level run; delegation remains one level deep.

Research, subagent, and proactive runs receive useful authorized read, research, and code-execution tools and shared personal memory read access. Their capability subset must preserve investigation ability. They cannot change settings, connections, personal memory, or saved user tasks, and they cannot directly send user messages. Backend handlers enforce these limits independently of prompts and tool registration.

### 4.4 Progress, failure, cancellation, and delivery

The user can leave chat while longer work continues and receive its result in the originating channel later. In that channel, the user can list jobs, ask for status, inspect results, and cancel a selected job. Another linked channel cannot list or control that work or retrieve its result. Progress messages contain meaningful updates. Jobs reach completion, failure, or cancellation; the user must distinguish these terminal outcomes from work in progress and useful partial output. A tool error or exhausted execution limit must not become an unsupported success claim. Exact status names, progress presentation, and limit values remain open.

The [scheduling decision](../ADRS/0004-durable-scheduling-and-queued-execution.md) limits requested background work to **two total whole-job attempts**. If an unfinished run is interrupted, restart it from the beginning only while the work is still active and authorized and an attempt remains. A scheduled known-temporary-failure retry consumes this same allowance, rather than adding another attempt. Reuse a saved completed result instead of rerunning analysis; completion notification or message delivery failure does not restart completed work. Proactive investigation failure or interruption waits for the next eligible check. Cancelled or revoked work does not restart. Ordinary non-interruption one-off error retry classification remains open within the two-attempt ceiling.

**Accepted chat control:** a user can ask the assistant to stop longer work. The implementation must distinguish accepting cancellation from confirming that execution has stopped. Exact stopping behavior and effects on in-flight tool calls, retained partial artifacts, charges, and later delivery remain open; cancellation does not promise rollback of work already performed. **Steering a running job is low priority and deferred.** A new chat message remains ordinary conversation unless it explicitly invokes a supported job control. Changing a standing task's settings is separate from steering its active attempt.

Before delivering an outcome, the orchestration layer rechecks current permissions, originating-channel validity, and delivery authority; task results also use current pause and cancellation state. A future-only task edit does not itself invalidate an active attempt using its original instructions. The [task design](tasks.md) owns pauses, edits, retries, and repeated delivery. Disconnecting a channel pauses its scheduled tasks, future runs, and pending deliveries without rerouting them; relinking retains history and work but requires the user to resume tasks from that channel. Cancellation or delivery checks cannot recall an already-started send, and one-off jobs retain the outcome and cancellation guarantees above.

### 4.5 Turn and round examples

These examples use illustrative request text and placeholder market values, not current prices or provider data. They describe logical turns and rounds without selecting framework methods or a storage schema.

**Quick question with several rounds:** the user asks, “What are my connected accounts worth now?”

| Foreground turn | Model/tool round | Work |
| --- | --- | --- |
| Turn 1 | Round 1 | The main agent requests balances and positions from relevant financial tools; several tool calls can share this round. |
| Turn 1 | Round 2 | After reading those results, it requests the supported prices or conversions needed for valuation. |
| Turn 1 | Round 3 | It checks scope and units, then replies with the supported total and key evidence. The turn ends. |

**Background gathering with an intervening question:** the user asks for a portfolio concentration analysis that needs substantial gathering.

| Event | Channel behavior |
| --- | --- |
| Turn 1 | The main agent delegates portfolio gathering, receives accepted job ID A, acknowledges the work, and ends the turn. |
| User asks, “What is ETH's price, and is my analysis still running?” | Turn 2 calls the price and job-status tools, answers with the returned price placeholder and A's actual status, then ends. A continues independently. |
| A completes | The worker saves A's result in PostgreSQL, then completes the BullMQ job. The coordinator receives `QueueEvents` completion, resolves trusted bindings, and queues a logical completion event; the idle channel starts Turn 3 with the original request, a compact summary, a result reference, and current permitted context. |
| Turn 3 | The main agent reads A's details as needed, checks financial evidence with tools if needed, calls E2B to calculate concentration, reads and checks the calculation result in a later round, and sends the concise analysis. Required outputs persist before the sandbox terminates. |

**Two children with separate completion turns:** the main agent needs portfolio evidence and relevant research for one user question.

| Event | Channel behavior |
| --- | --- |
| Turn 1 | The main agent delegates A for portfolio evidence and B for research, receives both accepted job IDs, acknowledges, and ends. |
| A completes | After A's result is saved and its BullMQ job completes, `QueueEvents` wakes the coordinator to queue the channel event. Turn 2 receives A's summary and result reference, reads details as needed, and checks B's actual status. Because B is still running and no update is useful, the turn ends quietly. The foreground remains free. |
| B completes | The same save, BullMQ completion, notification, and channel-event flow starts Turn 3. It receives B's summary and result reference, reads the children's authorized details as needed, combines the evidence, uses tools or E2B if needed, and replies. |

Each child has its own job state and original-request correlation. Context and actual job statuses let the main agent judge completion without a parent workflow record. Neither child creates another child.

**Messages and completions arriving during a foreground turn:** while Turn 1 is reading financial tool results, the user sends a correction and a worker saves its result in PostgreSQL before completing the BullMQ job. The coordinator receives `QueueEvents` completion, resolves the stored bindings, and queues the originating channel's logical completion event. The backend stores the user message and keeps both inputs pending while Turn 1 continues. After Turn 1 ends, Turn 2 can consume both with current permitted context, address the correction, and assess the compact summary and referenced result. No second foreground turn overlaps Turn 1, and background work never holds the foreground waiting for completion.

**Concurrent channels in one process:** two linked channels have active foreground turns concurrently in the single API/backend coordinator. Each turn uses its own trusted account/channel context and pending events. Another message or completion for either channel waits for that channel's active turn, without blocking the other channel.

**Replacement and interrupted background work:** stopping and starting the API/backend coordinator briefly interrupts chat and traffic; an acknowledged foreground message may require a user retry. If a requested background job's first attempt is interrupted before a completed result is saved, an eligible restart begins the whole job from the beginning as its second and final attempt. If a completed result was saved, reuse it through the normal completion path. A cancelled or revoked job does not restart, and an interrupted proactive investigation waits for the next eligible check.

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

Account-shared personal memory uses **Mastra native schema-based working memory**: a structured profile with a few stable categories and flexible free-text content. Personal facts, goals, and preferences are example categories, with room for useful context that does not fit fixed fields. Exact keys, schema/types, and size and selection budgets remain open. The accepted PostgreSQL database stores application and Mastra state in separate tables under the [shared storage decision](../ADRS/0013-shared-postgresql-storage.md).

The runtime uses native message history and Observational Memory within explicit account and channel-thread scopes. MyStacks owns personal-profile selection and write authority; Mastra's native Observer and Reflector compact channel history. These internal framework routines do not gain authority to update the shared personal profile or alter the one-level research-subagent boundary. Main-agent turns retain native profile updates. Phase 1 does not select vector recall or cross-channel history search.

This small profile is **illustrative, not the final schema**:

```json
{
  "preferences": { "responseStyle": "Concise" },
  "goals": "Build a retirement portfolio over 20 years",
  "notes": "Free-form personal context, including **Markdown**"
}
```

Text fields can contain prose or Markdown. Named-field updates can target a category, but changing one fact inside a text field still requires editing that text. The profile holds personal context; authoritative account configuration, current financial observations, and permissions stay in their backend boundaries.

| Scope | Context and state |
| --- | --- |
| **Stable account** | Shared personal facts, goals, and preferences, plus financial connections and portfolio evidence. Personal memory is one logical resource shared by linked channels. Financial connections and evidence remain in their owning backend boundary. |
| **Channel conversation** | Separate history, current topic, compaction state, independent jobs, scheduled tasks, and results for each linked channel. Transcripts, task records, and results are not merged or mirrored between channels. |
| **Independent job** | Task-scoped instructions, selected inputs, progress, and outcome under the account and originating channel, separate from ordinary chat and other jobs. A job may use authorized shared personal context without copying task records or results into that memory. |

**Native scope direction:** account-resource structured working memory holds useful personal facts; each channel's thread holds its raw history and observational summary. [Mastra working memory](https://mastra.ai/docs/memory/working-memory) supports resource-wide personal context and schema-based profiles; [Observational Memory](https://mastra.ai/docs/memory/observational-memory) supplies per-thread compaction. Exact binding and configuration remain open within these scopes.

For each turn, the runtime assembles the account-shared profile, recent raw messages from that channel, its compact older observations, and relevant authorized request or job inputs. Native history and summaries remain channel-scoped even though the personal profile is shared. The raw stored conversation is retained when it leaves active context; compaction is not transcript deletion.

Mastra checks **token thresholds during agent execution**, rather than keeping a fixed number of messages. The Observer appends observations and the Reflector periodically condenses them. Native buffering can prepare observations in the background as history grows; this work is part of the memory runtime, not a scheduled finance job or a separate application scheduler. The [Observational Memory reference](https://mastra.ai/reference/memory/observational-memory) documents token thresholds and buffering. Its illustrative defaults use an approximately 30,000-token raw-history activation threshold and retain roughly 6,000 raw tokens with `bufferActivation: 0.8`; these are vendor defaults, not selected MyStacks caps. Raw-history, summary, and total model-context budgets, plus Observer and Reflector model choices, remain open.

The assistant **automatically remembers useful personal context**, including facts, goals, preferences, and relevant circumstances learned in either linked channel; users can also explicitly ask it to remember a detail. A clear new user statement automatically updates the applicable older personal fact, goal, or preference without an explicit correction request. These updates apply across linked channels. If conflicting personal statements leave the user's meaning unclear, the assistant asks for clarification only when resolution materially changes the answer; otherwise it answers without treating the disputed fact as settled.

Shared memory must not become a copy of transcripts, task records, or results. Main-agent turns write useful personal context automatically or through explicit user instructions, using native memory facilities under backend-controlled authority. Research and background agents have read access only. The assistant acknowledges only information that was saved, and a correction updates the applicable profile content under the save-order policy in section 6.2. Saved context remains available in a later authorized conversation after worker replacement. Detailed selection, exact schema, and tool configuration remain open within this accepted behavior.

The backend validates account, current channel, and thread bindings before loading history or writing memory. Shared personal context is available from either linked channel, while each conversation keeps its current topic and history. The agent may know which channels exist and explain website controls without loading another channel's transcripts or task logs. A model-supplied item, channel, or thread identifier cannot authorize access.

Retained user-stated or user-confirmed facts and assistant guesses or interpretations must remain distinguishable; the assistant must not present its interpretations as confirmed user facts. Financial observations belong to the financial data boundary. Even the newest user statement about holdings, balances, prices, or access remains user-supplied context and cannot overwrite provider financial evidence or create account permission.

### 6.2 Concurrent updates and correction

Main-agent turns in linked channels may update the same account's personal profile concurrently; background subagents have read access only. Native partial-field updates preserve saved fields outside the supplied update. For the **same field, the last successful save wins**, regardless of user-message order. A slower turn based on an older message can therefore overwrite a newer correction or restore a deleted field. This accepted limit applies across linked channels, as recorded in the [profile save-order decision](../ADRS/0012-last-save-wins-profile-updates.md).

Mastra's [schema-based merge semantics](https://mastra.ai/docs/memory/working-memory#merge-semantics-for-schema-based-memory) deep-merge object fields, replace supplied arrays, and delete fields set to `null`. Supplied text fields are also replaced as whole fields. Facts inside one text or array field do not receive separate merges or conflict ordering; updating one requires supplying that field's new content.

Mastra documents atomic schema-based resource working-memory merges in `@mastra/pg`, using short database row locks; see [working-memory concurrency behavior](https://mastra.ai/docs/memory/working-memory#concurrent-updates). This supports independent-field updates in the selected PostgreSQL store without application-level serialization across channels.

The application does not add a profile lock across channels, per-field timestamps, deletion tombstones, or a custom conflict resolver. Database atomic merging preserves partial-field updates; it does not promise precedence for a newer user message or protection from a later same-field save.

### 6.3 Inspection and profile-only forgetting

**Accepted chat controls:** authorized users can inspect and correct the account-shared personal profile, forget a specific detail, or clear the profile. The same native profile-update tool handles remembering, correction, and forgetting. The main agent infers the affected field or text edit from the user's request and clarifies ambiguity before removing the wrong content. A specific removal preserves unrelated saved facts; “forget everything” clears the saved personal profile. The assistant distinguishes a requested change from a successful save or failure.

The [profile-only forgetting decision](../ADRS/0011-profile-only-forgetting.md) limits this control to the saved personal profile across the account. Channel transcripts and observational summaries remain unchanged. This is not account deletion, financial-data deletion, or erasure of artifacts, backups, or provider records.

**Accepted limit:** a removed fact can remain in current context or retained channel history and summaries, influence an answer, and be learned into the profile again. The agent is instructed not to recreate removed profile content solely from older history, but this is best effort rather than an enforced guarantee. The last-successful-save policy also permits an older in-flight update to restore deleted profile content. The user-facing acknowledgement must explain this scope without promising that the fact can no longer influence answers.

Retention periods for conversation history, profiles, observational summaries, artifacts, backups, and providers remain open. Those policies are separate from the accepted profile-only chat control.

## 7. Minimal operational evidence

Operations need enough evidence to relate an authorized request to its execution outcome, protected tool failures, queue delay where used, persistence of outputs and any generated files, and delivery outcome. Under the [worker-pool decision](../ADRS/0017-cloud-run-worker-pool.md), use configurable execution limits and record each run's duration, model usage, and outcome. Adjust worker capacity from queue and resource usage. Exact limit values, telemetry details, retention, and operating thresholds remain provisional; per-user dollar budgets are deferred.

Runtime checks must demonstrate one active chat-coordinator process, concurrent foreground work in different channels, one active foreground turn per channel, pending message and completion ordering through the same handler, several model/tool rounds within a turn, and background completion starting a fresh turn that can use tools before replying. Exercise simple stop-and-start replacement within the accepted brief interruption and foreground reply-loss limits rather than imply automatic inference recovery or zero-downtime deployment. Verification must also cover the five-run main-agent delegation limit, exclusion of terminal jobs and scheduler-started runs from that count, inclusion of new main-agent continuation delegations, backend rejection of nested delegation or background mutation/send tools, and truthful status from job records.

Completion checks must demonstrate PostgreSQL result persistence before BullMQ completion, `QueueEvents` receipt across workers, trusted stored account/channel/request/job routing for requested work, proactive routing under the selected eligible channel policy without repeating an investigation per channel, and pending completion while a foreground turn continues. New turns receive a compact summary and saved-result references and read details as needed. Once the recovery rule is designed, checks must cover persisted unhandled results after missed events and coordinator restart without assuming unlimited stream retention or exactly-once turns or replies.

Recovery checks must demonstrate restart from the beginning for an interrupted eligible requested run, the shared two-attempt whole-job ceiling, reuse of a saved completed result, no restart after cancellation or revocation, and proactive interruption waiting for the next eligible check. Completed analysis must not rerun because notification or delivery failed; no model or tool checkpoint resumption is implied.

Logs and traces must follow the credential boundary and selected handling policy for private financial data. Monitoring should support diagnosing failures and interrupted work without copying full private inputs into routine diagnostics by default.

**LangSmith tracing is low priority and additive**, under the [framework decision](../ADRS/0005-mastra-runtime-framework.md#23-low-priority-additive-tracing). It supplies observability without owning runtime execution, scheduling, authentication, or authorization. LangSmith Deployment is not selected. Integration packages and versions, payloads, configuration, sampling, access, and retention remain open; the existing credential exclusion applies to every exported trace.

Verification must demonstrate account isolation across chat and background entry paths, current-channel history and task/result access, concise text-first results that preserve relevant reasoning and evidence, checked calculation outputs and any enabled artifacts, shared personal memory learned across channels, native partial-field merging, and truthful job outcomes while chat remains usable. Memory checks must cover clear new personal statements updating the profile across channels, last-successful-save ordering for the same field, clarification only for ambiguity that materially affects the answer, and a visible distinction between user facts and assistant interpretations. Context checks must cover the shared profile plus same-channel recent history and older observations, token-driven native compaction, and retained raw transcripts. Forgetting checks must confirm specific and full-profile removal, preservation of unrelated profile content, unchanged transcripts and summaries, and truthful explanation of possible continued influence and relearning. A newer user financial statement must not replace provider financial evidence. Channel relinking must not silently resume paused scheduled tasks.

Human support verification must demonstrate a staffed same-channel handoff during published hours, truthful pending status, visible hours and time zone, clear out-of-hours handling, limited staff context, identifiable human and AI replies, and coordination that prevents conflicting replies while a human owns support.

## 8. Open implementation decisions

| Area | Decision still needed |
| --- | --- |
| Interfaces | Sender verification and account linking, channel conversation binding, model/provider configuration, Mastra package versions, and context fields. |
| Channel turns | API/chat hosting product and configuration, CPU/lifetime support after transport receipt, concrete in-process pending-event representation and ordering, and subscriber lifecycle integration. The coordinator's native `QueueEvents` subscription and trusted routing of saved-result completions are selected within the provisional Redis-backed BullMQ integration. One active API/backend coordinator, concurrent channels, one foreground turn per channel, and stop-and-start deployment are accepted. Distributed coordination and custom traffic switching are deferred until observed need or user impact justifies them. |
| Human support | Published hours and time zone, staffing, response expectations, out-of-hours handling, staff tooling and access, handoff and reply ownership, and any Apple-specific controls. The [open decisions](../TODO.md) track these choices. |
| Continued work | A small recovery rule for persisted unhandled results after missed completion events or coordinator restart, including cursor/replay behavior, pending or handled records, duplicate handling, and uncertain-send handling. Record schemas, task-context configuration, interrupted-run detection and enforcement of the accepted restart-from-beginning and two-attempt policy, progress presentation, and exact cancellation and in-flight behavior. Ordinary non-interruption one-off error retry classification remains open within that ceiling. Proactive failures and interruptions wait for the next eligible check. Running-job steering remains deferred. |
| Execution and optional files | Quotas, E2B configuration, checked-result methods, low-priority upload formats and parsers, and artifact access and retention when enabled. |
| Memory | Exact structured-profile schema, source distinctions, selection and size budgets, raw-history, summary and total context budgets, Observer and Reflector models, native tool configuration, retention, and user-facing save outcomes. Native per-channel Observational Memory, profile-only forgetting, and last-successful-save ordering are accepted. |
| Operations | Worker-pool region, exact initial instance count, CPU, memory, job concurrency, configurable execution-limit values, permissions and network connectivity; PostgreSQL and Redis hosting, schema and table configuration, per-run duration/model-usage/outcome telemetry details, low-priority LangSmith tracing integration and payload configuration, and provider data terms. Worker-pool hosting and manual scaling from queue/resource usage are accepted; per-user dollar budgets are deferred. |

Accepted product behavior, the single chat coordinator, channel-turn and delegation decisions, background recovery policy, worker-pool hosting, and standing framework choices constrain these decisions. Framework integration, in-process ordering details, and remaining deployment configuration await the overall design round. The portfolio and task designs own their respective evidence and standing-work contracts.
