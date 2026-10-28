# Proactive task and delivery design

## 1. Scope and standing decisions

This design covers **Phase 1 digests, periodic risk checks, natural-language ongoing tasks, independent initiative, and notification controls**. The [user stories](../user-stories/tasks.md) own observable acceptance; the [requirements](../requirements.md) own product scope, and the [architecture](../architecture.md) owns shared execution boundaries.

**Status: accepted core Phase 1 task and proactive-message UX; technical design tentative pending the architecture round.** Accepted product behavior below constrains the implementation; logical records and execution mappings remain design proposals.

Chat is the interface for task creation, management, results, follow-up questions, and the proactive-message on/off control. The stable account owns task records, but conversations, current context, independent jobs, scheduled tasks, and results remain within their originating channel. Task tools expose only current-channel work; protected backend handlers enforce both account and channel authority. Personal memory, financial connections, and portfolio evidence remain account-wide under the [channel and memory decision](../ADRS/0008-channel-scoped-work-and-shared-memory.md).

Scheduled-task and independent-job results stay in their creating channel. Phase 1 chat has no destination selector, transfer, or retarget operation, including on an explicit user request. Website settings own channel connections and proactive routing; chat can explain and link to those settings.

**Accepted:** standing requests and required outcomes persist outside workers; tasks remain informational and financially read-only; current permissions, task state, and destination are checked before publication. Monitoring begins every couple of hours or daily, with exact cadence open, best-effort timing, and accepted missed events. High precision takes priority over recall for initiative, accepting missed marginal events to avoid spam.

**Provisional technology:** under the BullMQ with Redis candidate, BullMQ owns scheduled-job eligibility, claims, and job-level retries; shared workers execute predefined checks or invoke the common Mastra `Agent` when reasoning is needed. Channel scope does not require a separate runtime, queue, or deployment per channel. Exact persistence, schedule authority, recovery mechanics, delivery provider, budgets, and operating limits remain open. This design defines logical responsibilities rather than record schemas.

## 2. Durable concepts and ownership

### 2.1 Distinct records

| Concept | Responsibility |
| --- | --- |
| **Standing task** | Retain stable account, creating channel, intent, current status, covered resources, and trigger. The creating channel fixes result delivery. Keep settings independent of any one attempt. |
| **Schedule** | Define recurrence, timezone where relevant, and when a task becomes eligible. A task's trigger may refer to a schedule. |
| **Job** | Represent queued work for a due occurrence or other authorized request under its account and originating channel. An independent agent job has its own context and remains separate from ordinary new chat. |
| **Run attempt** | Retain the instructions used when the run starts and record its progress, evidence references, result, and completion, failure, or cancellation within the originating channel. Retrying a job does not create another standing request. The persistence mechanism and interruption handling remain design decisions. |
| **Delivery** | Record a proposed message, its eligibility decision, authorized channel binding, and dispatch outcome separately from successful analysis. Task results cannot be rebound to another channel. |
| **Notification settings** | Retain the account-level binary proactive-message on/off setting, on by default, and one preferred verified linked channel for agent-initiated messages. The first linked channel is preferred; linking another does not switch it. Website routing settings and proactive fallback remain separate from fixed task destinations. |

These boundaries do not require separate services or a separate database for every concept. Durable financial evidence stays in the [portfolio boundary](portfolio.md); conversation continuation and Mastra context follow the [runtime design](runtime.md).

### 2.2 One schedule authority

Choose **one authoritative schedule definition** before implementation. The following alternatives remain open:

- **Application database authority:** retain the canonical schedule with task state; BullMQ holds derived recurrence state. Define how a successful edit updates that state and how an incomplete update is detected and repaired.
- **BullMQ authority:** retain the canonical recurrence in BullMQ's durable state; application task records reference that definition rather than carry an independently editable recurrence copy. Define how task updates and schedule changes become consistent.

Both alternatives need a clear read/update contract, durable configuration, and observable failed updates. Neither permits two stores to make independent schedule decisions. Under this candidate, use BullMQ scheduling rather than building another timer or scheduler engine. Mastra must not independently schedule or retry the same queued operation.

## 3. Task creation and logical lifecycle

### 3.1 From language to a standing request

Mastra interprets an ongoing request and uses an authorized task tool to read or change structured state. After the orchestrator verifies the channel sender, trusted backend context binds the stable account and current channel/thread. Model-provided identifiers do not establish access or choose the channel. Protected handlers validate account and channel ownership, covered resources, and supported trigger values. The runtime receives authorized context without needing to interpret the channel's sender identity. The shared regular `Agent` receives fresh trusted per-run `RequestContext`; the [runtime design](runtime.md) owns history and memory integration.

When a request is clear and supported, create the task immediately and confirm its purpose, chosen time, and timezone in the creating channel. Website onboarding detects and saves the device timezone **once** as the personal default. The app does not continuously detect timezone or track travel; redetection on later website visits is deferred. The user can explicitly change the personal default in the web app or chat. A timezone named in a task request applies to that task without changing the personal default. A changed default applies to new tasks; existing tasks keep their assigned timezone unless explicitly edited.

Ask for the timezone when unknown; for “every morning,” ask for a time if no morning time is known. Resolve other material ambiguity in intent, timing, or source coverage before making the change. Memory can help interpret personal preferences, but it does not hold copies of task records, results, transcripts, or financial evidence and does not establish delivery authority. Unsupported work remains visibly unsupported.

Daily digests, risk checks, and initiative use these common execution and delivery boundaries. **Agent-initiated messages are on by default**, with one account-level binary on/off control in chat, and go to **one preferred verified linked channel** without mirroring. The first linked channel becomes preferred; linking another does not switch it. The user changes proactive routing settings on the website. If the preferred channel disconnects and another remains, proactive preference switches to the remaining channel and the website shows the change. With no linked channel, proactive delivery pauses until a channel is linked while preserving the on/off preference. This fallback does not apply to scheduled tasks. Exact proactive context assembly and pending-dispatch mechanics remain open and must preserve channel history and task boundaries. An independent finding is not authority to expand financial access or notification permissions.

Users list and inspect only current-channel tasks in chat, including purpose, schedule, and active or paused status. Clear requests to change, pause, resume, or cancel a task apply immediately and receive a concise confirmation; an ambiguous task reference requires clarification.

### 3.2 Independent jobs and chat controls

Longer analysis can run as an independent agent job while the main chat remains usable. Each job receives its own context, authorized account resources, and originating-channel binding. Multiple jobs may run within capacity limits that remain open; ordinary new messages do not silently steer an active job.

From the originating channel, the user can list its jobs, ask for status, and request cancellation of a selected job. Chat distinguishes a cancellation request being accepted from execution having stopped, and reports completion, failure, or cancellation as terminal outcomes. Cancellation mechanics remain open and do not promise rollback of completed work. **Steering a running job is low priority and deferred.** Changing standing-task settings is distinct from steering an active attempt.

A job and its results retain their originating-channel binding. Channel disconnection does not authorize transfer or an invented cancellation outcome for a one-off job or active task attempt.

### 3.3 Logical state transitions

**Proposed lifecycle vocabulary:** active, paused, and cancelled standing tasks; eligible and claimed jobs; running, completed, failed, cancelled, interrupted, or skipped attempts; pending, held, suppressed, dispatching, sent, failed, or uncertain deliveries. Exact persisted states remain a schema decision. Completion, failure, and cancellation are the user-visible terminal job outcomes; interruption handling determines how interrupted work reaches one of them.

- Creating a task allows future runs. Pausing retains its standing intent, stops future runs, and holds automatic results whose sending has not begun. Resuming continues at the next scheduled time without a missed-update backlog.
- Editing a task changes future runs. An active run continues its original instructions unless explicitly cancelled, while current financial permissions, channel validity, pause/cancel state, and delivery authority remain enforced. A future-only edit does not itself invalidate the active attempt; the instruction snapshot does not select a schema or versioning mechanism.
- Cancelling ends recurring work and requests cancellation of active execution. Past results remain available within their channel; retention duration remains open.
- Disconnecting a channel pauses its scheduled tasks, future runs, and pending unsent automatic results without fallback. Relinking the same channel keeps tasks paused until an explicit resume from that channel. Already-started sends cannot be recalled; active attempts retain honest cancellation and outcome semantics.
- Explicitly disconnecting a financial source allows a task to continue only if remaining authorized data still fulfills its intended request. Otherwise, pause the affected task and explain why once in its originating channel. Reconnecting the source leaves the task paused until the user explicitly resumes it from that channel, at the next scheduled time without a missed-check backlog.
- A temporary provider outage is distinct from explicit disconnection. An isolated provider failure remains eligible for automatic recovery and does not automatically cancel the task.
- Attempt success makes a result available; it does not prove delivery. An unavailable provider response or interrupted worker must not become a successful result or a zero balance.

Task pause, the proactive-message setting, source disconnection, and worker shutdown affect different responsibilities. Chat must show their actual effects rather than collapse them into a single success state.

## 4. Execution and publication

### 4.1 One execution path

1. BullMQ makes scheduled work eligible and a worker claims the job. Eligibility is not an exact execution-time guarantee.
2. The worker resolves the task's run instructions and trusted account/channel context, checks applicable live task state and channel validity, and authorizes protected reads through backend tools.
3. A predefined check reads evidence and performs routine calculations. Flexible interpretation, research, or deeper analysis invokes Mastra only when needed.
4. The worker records required progress and the attempt outcome outside the process, preserving evidence freshness, coverage gaps, and native values and units.
5. The delivery boundary evaluates whether there is an eligible message, then rechecks current task state, financial permissions, channel validity, applicable notification settings, and delivery authority before publication. Task results stay bound to their creating channel.
6. The delivery outcome is saved separately. Failure or uncertainty remains visible; retry behavior follows the selected policy.

Continued chat analysis uses the same job, attempt, progress, and delivery concepts described in [runtime.md](runtime.md), with task-scoped context isolated from the main conversation. It does not need a second scheduler or retry owner. Whether all immediate chat calls enter the queue remains open; durable continuation must survive the originating conversation and worker.

### 4.2 Cheap checks and evidence reuse

Routine checks use predefined provider reads and calculations rather than a model call for each user or interval. Public market observations may be collected once and reused when their freshness and coverage satisfy each claim. Reuse must retain source and as-of evidence; it must not turn an old observation into a current one.

Private account evidence remains user-authorized. A shared public price does not establish account access, portfolio membership, or permission to share private results. The [portfolio design](portfolio.md) owns evidence boundaries and claim-specific reuse. Credentials remain in trusted backend adapters and must stay out of model context, job inputs, and generated-code environments.

### 4.3 Low-noise notification eligibility

An eligible message must be in scope, supported by sufficient evidence for its claim, useful under the task's intent or initiative policy, and allowed by current notification settings. Unknown data cannot support an “all clear” claim. Evidence retains unavailable sources and uncertainty; useful partial answers describe their actual scope without routine missing-data warnings and explain unavailable information when explicitly requested.

**Accepted initiative policy:** judge relevance flexibly using the user's connected portfolio, goals, and remembered interests. Send only a meaningfully new and useful finding supported by strong evidence and worth the user's attention, with a concise explanation of why it matters. Prioritize high precision over recall, accepting missed marginal events to avoid spam. Suppress uncertain, minor, repetitive, or low-value findings; stay quiet when none qualifies. Resurface a finding only after an important change or new useful evidence.

**Explicitly scheduled work follows the user's request and its own controls.** The initiative attention filter must not suppress requested task results; send an explicitly requested daily summary or digest even on quiet or no-change days. Internal eligibility policies do not add user-facing fewer/more settings.

The qualitative initiative policy is settled. Architecture and evidence must establish exact attention and material-change thresholds, claim-specific and provider freshness rules, precision measurement and any numeric target, and repeat-suppression mechanisms. No numeric precision target is guaranteed, and no mechanism is selected here.

Monitoring, data access, model work, generated-code analysis, and delivery need resource budgets. Limit values and exhaustion behavior remain open: defer eligible work, produce a useful partial result, or record a visible failure are candidate outcomes. This design does not select priority classes among risk alerts, digests, user tasks, and initiative.

### 4.4 Text-first results

All replies and reports, including task updates, are **text-first, concise, precise, and readable in chat**. Give the main finding, key numbers, and reasoning needed to understand the result; follow-up questions can deepen the analysis. This presentation keeps substantial calculations, research using available sources, and background jobs in scope. Image replies are low priority; deep research reports and polished web artifacts are deferred.

## 5. Lifecycle boundaries and open operating policies

### 5.1 Changes while work is pending

| Policy | Accepted behavior and unresolved boundary |
| --- | --- |
| Pause and cancellation | Pause stops future runs and holds automatic results not yet sending. Cancellation ends recurrence and requests active-run cancellation. Define the dispatch-start boundary and cancellation mechanics; sends already started cannot be recalled. |
| Edit during execution | Changes apply to future runs; active execution keeps its original instructions. Current permissions, channel validity, pause/cancel state, and delivery authority still govern the attempt and publication. |
| Channel disconnection | Pause that channel's scheduled tasks, future runs, and pending unsent automatic results. Retain history and tasks without fallback; relinking keeps tasks paused until the user resumes from the same channel. |
| Financial access | Stop protected reads that no longer have authority. After explicit source disconnection, continue only if remaining authorized data fulfills the task's intended request; otherwise pause it and explain why once in the originating channel. Reconnection leaves it paused until explicit resume from that channel. Temporary provider outages retain automatic recovery without automatic cancellation. |
| Resume | Continue at the next scheduled time without a missed-update backlog. |
| Proactive routing changes | Website settings control preferred-channel changes and display fallback on disconnection. Exact pending-dispatch mechanics remain open within channel history and task boundaries. |

### 5.2 Timing, recovery, and repeated work

| Policy | Choices that remain open |
| --- | --- |
| Recurrence | Select supported cadence, exact recurrence mechanics, daylight-saving behavior, and late-work handling outside pause/resume. One-time website onboarding detection sets the personal default; explicit web app or chat changes affect new tasks. Task-specific zones and existing assigned zones follow section 3.1. Clarify an unknown timezone or morning time and confirm time and timezone. Redetection on later website visits is deferred. |
| Overlap | Choose whether a due occurrence waits, is skipped, or replaces obsolete pending work when an earlier attempt is still running. |
| Worker interruption | Restart the attempt, record failure, or resume from explicitly persisted checkpoints if a requirement justifies them. Durable task state alone does not establish checkpoint recovery. |
| Job retries | Recover failed scheduled runs automatically where supported; an isolated failure retains the schedule. Select retryable failures, attempt limits, and delay. BullMQ is the provisional job-level retry owner; any tool or provider retry inside a run must have a distinct scope. If the requested update cannot be produced, send a concise explanation with required user action and avoid repeated identical failure notices. |
| Duplicate delivery | Consider a delivery identity tied to task occurrence and destination, plus provider idempotency where supported. Decide whether uncertain dispatch is retried with possible duplicates or left uncertain with possible omission. |
| Restart | Decide how unfinished work and overdue schedules are inspected and handled after recovery; retain visible outcomes rather than infer completion from a queue claim. |

Execution and delivery do not promise exactly once. These policies must describe the chosen trade-offs without strengthening the accepted best-effort monitoring and recall limits.

## 6. Acceptance and remaining decisions

- Prove recurrence with one bounded test in which a saved schedule becomes due and BullMQ produces claimed work; manual enqueue alone is insufficient. Verify configured daily recurrence and timezone behavior without a day-long test.
- Demonstrate digest, flexible task, supported risk check, initiative, management controls, and low-noise behavior against [US-TASK-01 through US-TASK-08](../user-stories/tasks.md).
- Close chat, replace a worker, and inspect retained task state and outcomes. Exercise the selected interruption policy rather than claiming recovery from persistence alone.
- Run multiple independent jobs while the main chat remains usable; verify context separation and account-plus-channel enforcement for list, status, details, results, and cancellation. Another linked channel cannot inspect or change that work, and chat cannot select or retarget its destination.
- Verify that agent-initiated messages obey the account-level on/off setting, default to the first linked channel, keep that preference when another channel is linked, and honor website routing settings. Verify fallback to the remaining channel, paused proactive delivery with no linked channel, and the preserved on/off preference. Scheduled tasks retain their fixed channel and controls.
- Verify initiative relevance uses the connected portfolio, goals, and remembered interests; only meaningfully new and useful findings supported by strong evidence and worth attention are sent, with a concise explanation. Verify suppression of uncertain, minor, repetitive, and low-value findings, silence when none qualifies, and resurfacing only after an important change or new useful evidence. Verify requested scheduled results, including quiet-day summaries, bypass the initiative attention filter.
- Verify future-only edits preserve active instructions while live permissions and delivery authority still apply. Verify pause holds unsent results, resume waits for the next scheduled time without backlog, cancellation requests active-run cancellation, and sends already started are reported honestly.
- Disconnect a channel, retain its history and tasks, and verify paused future runs and unsent results without rerouting. Relink it and require explicit resume from that channel.
- Explicitly disconnect a financial source and verify continued work only when remaining authorized data fulfills the intended request; otherwise verify a paused task and one explanation in its originating channel. Reconnect the source and require explicit resume from that channel at the next scheduled time without missed checks. Verify that a temporary provider outage retains automatic recovery without automatic cancellation.
- Verify one-time onboarding timezone detection, explicit personal-default changes in the web app and chat, task-specific timezone requests without default changes, and unchanged assigned zones on existing tasks unless explicitly edited. Clarify unknown timezone or morning time and confirm time and timezone.
- Verify text-first task updates and follow-up replies with the main finding, key numbers, and needed reasoning while preserving substantial calculations, research using available sources, and independent jobs.
- Verify supported automatic recovery, retained recurrence after an isolated failure, concise nonrepeated failure notices, dispatch uncertainty, and honest delivery failure.
- Before implementation, settle schedule authority, recurrence mechanics and daylight-saving behavior, cancellation and dispatch boundaries, retry and interruption mechanics, job capacity, resource limits, exact attention and material-change thresholds, precision measurement and any numeric target, repeat-suppression mechanisms, risk and freshness rules, proactive context and pending-dispatch mechanics, delivery-provider behavior, and retention duration. These choices must preserve the accepted qualitative initiative policy. Targeted local checks and a few bounded end-to-end proofs provide acceptance evidence.
