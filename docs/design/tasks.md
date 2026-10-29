# Proactive task and delivery design

## 1. Scope and standing decisions

This design covers **Phase 1 digests, periodic risk checks, natural-language ongoing tasks, independent initiative, and notification controls**. The [user stories](../user-stories/tasks.md) own observable acceptance; the [requirements](../requirements.md) own product scope, and the [architecture](../architecture.md) owns shared execution boundaries.

**Status: accepted core Phase 1 task and proactive-message UX; technical design tentative pending the architecture round.** Accepted product behavior below constrains the implementation; logical records and execution mappings remain design proposals.

Chat is the interface for task creation, management, results, follow-up questions, and selecting proactive insight delivery channels. The stable account owns task records, but conversations, current context, independent jobs, scheduled tasks, and results remain within their originating channel. Task tools expose only current-channel work; protected backend handlers enforce both account and channel authority. Personal memory, financial connections, and portfolio evidence remain account-wide under the [channel and memory decision](../ADRS/0008-channel-scoped-work-and-shared-memory.md).

Scheduled-task and independent-job results stay in their creating channel. Phase 1 chat cannot select another destination, transfer, or retarget requested work, including on an explicit user request. Website settings own channel connections. Website and chat expose the same account-wide selection of **proactive insight delivery channels**, which may include one, both, or none of the linked messaging channels. Every newly linked channel is selected by default. This setting routes only proactive insights; chat replies and requested work retain their originating channel.

**Accepted:** standing requests and background run records persist outside workers; tasks remain informational and financially read-only; current permissions, task state, and destination are checked before publication. Requested tasks keep their agreed schedules. Proactive investigations target approximately five randomized starts per eligible account per day within 09:00–21:00 in the saved user timezone. Timing remains best effort, and missed events are accepted. High precision takes priority over recall for initiative, accepting missed marginal events to avoid spam.

**Agreed ownership, provisional queue technology:** the shared [PostgreSQL database](../ADRS/0013-shared-postgresql-storage.md) owns saved task definitions, background run records, statuses, and results in application-owned tables. Under the BullMQ with Redis candidate, BullMQ owns timing, queue dispatch, claims, and configured job retries; Mastra executes agent work. Each eligible user-created scheduled occurrence starts one background agent run, and every eligible proactive check invokes a bounded agent investigation. Agents can use predefined reads and calculations. Channel scope does not require a separate runtime, queue, or deployment per channel. Record schemas, framework integration, recovery mechanics, hosting, delivery provider, and numeric budgets remain open.

## 2. Durable concepts and ownership

### 2.1 Distinct records

| Concept | Responsibility |
| --- | --- |
| **Standing task** | The backend database retains stable account, creating channel, intent, current status, covered resources, and trigger. The creating channel fixes result delivery. Keep settings independent of any one run. |
| **Schedule** | The saved task defines requested recurrence and assigned timezone. The backend registers and updates the corresponding BullMQ timing state; account-level proactive timing follows section 4.5. |
| **Queue job** | BullMQ dispatches and claims work for a due occurrence or other authorized background request. The job refers to trusted backend run context rather than owning a second task definition. |
| **Background run** | The backend database retains original-request correlation, the instructions used when the run starts, account/channel binding, progress, evidence references, internal result, and actual status. Retrying a job does not create another standing request. Attempt details and interruption handling remain design decisions. |
| **Delivery** | Record a proposed message, its eligibility decision, authorized channel binding, and dispatch outcome separately from successful analysis. Task results cannot be rebound to another channel. Proactive insights retain per-channel outcomes for intended copies to selected eligible channels. |
| **Notification settings** | Retain the account-wide selection of proactive insight delivery channels shared by website and chat. Each newly linked channel is selected by default; selecting none stops proactive investigations and unsent delivery. Fixed task destinations remain separate. |
| **Proactive finding and notification history** | Retain account-level findings, supporting evidence, actual sent messages and times, and per-channel delivery outcomes separately from personal memory. Distinguish candidates and completed investigations from successful notifications, and intended copies across channels from accidental retries. |

These boundaries do not require separate services or a separate database for every concept. Durable financial evidence stays in the [portfolio boundary](portfolio.md); conversation continuation and Mastra context follow the [runtime design](runtime.md).

### 2.2 Backend definitions and queue execution

The **backend database owns saved task definitions and background run states and results**. The backend registers recurring schedules and updates BullMQ timing state from those definitions. BullMQ owns due-time production, queue dispatch, claims, and the retries configured for each job class. Mastra executes a claimed agent run; it does not independently schedule or retry the same queued operation.

The task-to-queue update contract must make failed updates observable without allowing independently editable task definitions in two stores. Detailed consistency and recovery mechanics remain open. Redis stores queue and schedule data; warm worker processes perform the work. Redis does not start a stopped service, so hosting must provide the required worker lifetime.

Use existing BullMQ scheduling infrastructure under this candidate. Its [Job Schedulers](https://docs.bullmq.io/guide/job-schedulers/) produce the next job when the preceding job begins processing; that behavior does not establish the application's per-account proactive overlap policy. A [custom repeat strategy](https://docs.bullmq.io/guide/job-schedulers/repeat-strategies) or next-due timing may support randomized starts, but the exact integration requires verification. No separate custom scheduler service or legacy `QueueScheduler` is selected.

## 3. Task creation and logical lifecycle

### 3.1 From language to a standing request

Mastra interprets an ongoing request and uses an authorized task tool to read or change structured state. After the orchestrator verifies the channel sender, trusted backend context binds the stable account and current channel/thread. Model-provided identifiers do not establish access or choose the channel. Protected handlers validate account and channel ownership, covered resources, and supported trigger values. The runtime receives authorized context without needing to interpret the channel's sender identity. The shared regular `Agent` receives fresh trusted per-run `RequestContext`; the [runtime design](runtime.md) owns history and memory integration.

When a request is clear and supported, create the task immediately and confirm its purpose, chosen time, and timezone in the creating channel. Website onboarding detects and saves the device timezone **once** as the personal default. The app does not continuously detect timezone or track travel; redetection on later website visits is deferred. The user can explicitly change the personal default in the web app or chat. A timezone named in a task request applies to that task without changing the personal default. A changed default applies to new tasks; existing tasks keep their assigned timezone unless explicitly edited.

Backend scheduling tools enforce a configurable **one-hour minimum interval** for every user-created recurring schedule in Phase 1. If a user requests a shorter interval, explain the limit and offer hourly without silently replacing the requested schedule. Normal chat and explicitly requested one-off work are unaffected. This minimum does not assert that every provider refreshes its data hourly.

Each chat may have **at most five enabled user-created recurring tasks**. Paused tasks do not consume this saved-schedule quota. Backend scheduling tools enforce it when creating, enabling, or resuming a task; when it would be exceeded, explain the capacity limit instead of enabling the task. This quota is separate from background execution admission.

Ask for the timezone when unknown; for “every morning,” ask for a time if no morning time is known. Resolve other material ambiguity in intent, timing, or source coverage before making the change. Memory can help interpret personal preferences, but it does not hold copies of task records, results, transcripts, or financial evidence and does not establish delivery authority. Unsupported work remains visibly unsupported.

Daily digests, risk checks, and initiative use shared execution and delivery boundaries while keeping their distinct admission, timing, and failure policies. Each qualifying proactive insight goes to **all selected, currently eligible verified channels** after one account-level investigation, without repeating research for each destination. A clear website or chat change updates the same proactive insight delivery channels immediately. A request to stop all proactive messages clears the selection; when an activation request leaves the destination materially ambiguous, clarify which linked channels to select. Removing a channel prevents pending sends there. Disconnecting a channel removes it from the selection and never enables an unselected one. An independent finding is not authority to expand financial access or notification permissions.

Users list and inspect only current-channel tasks in chat, including purpose, schedule, and active or paused status. Clear requests to change, pause, resume, or cancel a task apply immediately and receive a concise confirmation; an ambiguous task reference requires clarification.

### 3.2 Independent jobs and chat controls

For substantial work, the main agent explicitly starts background subagents, receives accepted job IDs, and ends its foreground turn after any useful acknowledgement. It does not occupy the channel while waiting for completion. New questions and job-status requests can proceed in later turns while background work continues. Each job receives its own context, authorized account resources, and originating-channel binding; ordinary new messages do not silently steer it.

The configurable initial admission limit is **five outstanding subagent runs spawned by the main agent per chat**, counting queued and running runs. Terminal jobs do not count. If five main-agent-delegated runs are outstanding, the assistant reports capacity instead of accepting a sixth. Scheduler-started requested occurrences and proactive investigations are excluded. A later new subagent spawned by a main-agent continuation counts as main-agent delegation, including when that continuation follows scheduled work. Saved recurring task definitions follow the separate enabled-task quota in section 3.1.

Only main-agent turns can delegate additional subagents; the scheduler can start the runs defined by configured schedules. Backend capability checks and the subagent tool subset enforce one level of delegation. Background subagents retain useful authorized read, research, and code-execution tools plus shared personal-memory read access. They cannot change settings, connections, personal memory, or saved user tasks, start nested subagents, or send user messages directly.

From the originating channel, the user can list its jobs, ask for status, and request cancellation of a selected job. Chat distinguishes a cancellation request being accepted from execution having stopped, and reports completion, failure, or cancellation as terminal outcomes. Cancellation mechanics remain open and do not promise rollback of completed work. **Steering a running job is low priority and deferred.** Changing standing-task settings is distinct from steering an active attempt.

A job and its results retain their originating-channel binding. Channel disconnection does not authorize transfer or an invented cancellation outcome for a one-off job or active task attempt.

Original-request correlation supports routing, status, cancellation, and admission. The main agent uses channel context and actual job-status tools to decide whether the user's request is answered. A separate overall-request lifecycle, parent completion flag, or mandatory dependency graph is not part of this design; saved recurring tasks and their individual runs retain their own lifecycle.

### 3.3 Logical state transitions

**Proposed lifecycle vocabulary:** active, paused, and cancelled standing tasks; eligible and claimed jobs; running, completed, failed, cancelled, interrupted, or skipped attempts; pending, held, suppressed, dispatching, sent, failed, or uncertain deliveries. Exact persisted states remain a schema decision. Completion, failure, and cancellation are the user-visible terminal job outcomes; interruption handling determines how interrupted work reaches one of them.

- Creating a task allows future runs. Pausing retains its standing intent, stops future runs, and holds automatic results whose sending has not begun. Resuming continues at the next scheduled time without a missed-update backlog.
- Editing a task changes future runs. An active run continues its original instructions unless explicitly cancelled, while current financial permissions, channel validity, pause/cancel state, and delivery authority remain enforced. A future-only edit does not itself invalidate the active attempt; the instruction snapshot does not select a schema or versioning mechanism.
- Cancelling ends recurring work and requests cancellation of all queued and running occurrences of that task. Past results remain available within their channel; retention duration remains open.
- Disconnecting a channel pauses its scheduled tasks, future runs, and pending unsent automatic results without fallback. Relinking the same channel keeps tasks paused until an explicit resume from that channel. Already-started sends cannot be recalled; active attempts retain honest cancellation and outcome semantics.
- Explicitly disconnecting a financial source allows a task to continue only if remaining authorized data still fulfills its intended request. Otherwise, pause the affected task and explain why once in its originating channel. Reconnecting the source leaves the task paused until the user explicitly resumes it from that channel, at the next scheduled time without a missed-check backlog.
- A temporary provider outage is distinct from explicit disconnection. An isolated provider failure remains eligible for automatic recovery and does not automatically cancel the task.
- Attempt success makes a result available; it does not prove delivery. An unavailable provider response or interrupted worker must not become a successful result or a zero balance.

Task pause, proactive insight delivery channels, source disconnection, and worker shutdown affect different responsibilities. Chat must show their actual effects rather than collapse them into a single success state.

### 3.4 Independent requested occurrences

Each eligible occurrence of a user-created schedule starts **one background agent run**, admitted independently of the main-agent delegation quota. Do not check whether the same task's previous run is queued or running. Distinct occurrences can run in parallel: overlap does not skip, replace, defer behind, or cancel either run. Do not add previous-run queries, overlap locks, or leases to prevent distinct occurrences from running together. Duplicate handling for the same occurrence remains a separate responsibility.

Accepting an eligible due occurrence means admitting it to the execution system; actual worker start depends on available capacity. Current pause/cancel state, verified channel, financial authority, and normal lifecycle checks still apply. This does not establish exact-time execution, exactly-once behavior, outage catch-up, or unlimited workers. Native schedule-production behavior requires integration verification without a bespoke scheduler or replay engine.

Expected execution of around **5–10 minutes**, compared with the one-hour minimum recurrence, is an operating assumption rather than a timeout or guarantee. An unusually long run may overlap the next occurrence, and both remain valid. Proactive investigations retain their separate one-active-per-account and skipped-overlap policy.

## 4. Execution and publication

### 4.1 Queued work and main-agent completion

1. The backend registers recurring work or accepts an authorized background request. BullMQ makes due work available and a warm worker claims its queue job. Queue eligibility does not guarantee an exact start time.
2. The worker resolves trusted account, channel, original-request, job, and run references, checks current authority and applicable task state, and authorizes protected reads through backend tools. Proactive work must pass the actual-start checks in section 4.5 before investigation.
3. Each eligible user-created scheduled occurrence executes one background Mastra agent run. It can use predefined reads and calculations or deeper research as needed. Requested one-off work retains its ordinary execution path. Every eligible proactive check runs a bounded agent investigation.
4. The worker saves progress, evidence, the internal result or references, and the actual run outcome in the backend database. A result can be findings or data rather than a finished report. The worker emits a completion event; BullMQ [QueueEvents](https://docs.bullmq.io/guide/workers) is the provisional notification mechanism.
5. The backend completion listener resolves trusted stored references and invokes the same channel handler used by inbound chat. Requested work uses its originating channel; proactive findings support delivery to all selected eligible channels without repeating the investigation. An idle channel starts a **new main-agent turn**; a busy channel retains the completion for a later turn instead of injecting it into current inference. Fresh input includes the original request, result or references, and current permitted channel context.
6. The main agent owns every agent-authored user reply. It can use financial tools or E2B, combine completed children, delegate further top-level work, reply, or end quietly while awaiting another completion. Completion supplies internal work, not a new user instruction or added permission. It does not resume a suspended model call or require a polling model loop.
7. Before each send, the delivery boundary rechecks current permissions, task state, channel validity, applicable channel selection, and delivery authority. Task results remain bound to their creating channel. Each actual main-agent reply enters only its destination channel's normal history for follow-up questions.
8. Save delivery outcomes separately from investigation success. A proactive history entry records each channel's notification as sent only when that outcome is known; failure and uncertainty remain distinct. Intended copies across selected channels are distinct from accidental retries to the same channel.

The [runtime design](runtime.md) owns channel-turn ordering and continuation details. Normal chat initially runs directly in the backend after inbound verification, persistence, and prompt transport acknowledgement; it does not use a durable BullMQ chat queue. Process or deployment interruption may therefore leave an acknowledged turn without a reply. Saved messages alone do not resume inference. Background run persistence does not extend that guarantee to ordinary chat.

### 4.2 Requested checks and evidence reuse

Scheduled agent runs may use predefined provider reads and calculations; their use does not replace the occurrence's agent run. Proactive checks always invoke an agent after eligibility; Phase 1 has no cheaper data-change prefilter or rule-trigger prerequisite for that invocation. Public market observations may still be collected once and reused when their freshness and coverage satisfy each claim. Reuse must retain source and as-of evidence; it must not turn an old observation into a current one.

Private account evidence remains user-authorized. A shared public price does not establish account access, portfolio membership, or permission to share private results. The [portfolio design](portfolio.md) owns evidence boundaries and claim-specific reuse. Credentials remain in trusted backend adapters and must stay out of model context, job inputs, and generated-code environments.

### 4.3 Low-noise notification eligibility

An eligible message must be in scope, supported by sufficient evidence for its claim, useful under the task's intent or initiative policy, and allowed by current notification settings. Unknown data cannot support an “all clear” claim. Evidence retains unavailable sources and uncertainty; useful partial answers describe their actual scope without routine missing-data warnings and explain unavailable information when explicitly requested.

**Accepted initiative policy:** judge relevance flexibly using the user's connected portfolio, goals, and remembered interests. Send only a meaningfully new and useful finding supported by strong evidence and worth the user's attention, with a concise explanation of why it matters. Prioritize high precision over recall, accepting missed marginal events to avoid spam. Suppress uncertain, minor, repetitive, or low-value findings; stay quiet when none qualifies. Resurface a finding only after an important change or new useful evidence.

**Explicitly scheduled work follows the user's request and its own controls.** The initiative attention filter must not suppress requested task results; send an explicitly requested daily summary or digest even on quiet or no-change days. Internal eligibility policies do not add user-facing fewer/more settings.

The main agent judges semantic usefulness and meaningful change from evidence. The backend enforces eligibility, authorization, recognized duplicate-delivery handling, and delivery policy. Architecture and evidence must establish exact attention and material-change thresholds, claim-specific and provider freshness rules, precision measurement and any numeric target, and detailed repeat handling. No numeric precision target, perfect semantic deduplication, or exactly-once external delivery is guaranteed.

Monitoring, data access, model work, generated-code analysis, and delivery need resource budgets. Limit values and exhaustion behavior remain open: defer eligible work, produce a useful partial result, or record a visible failure are candidate outcomes. This design does not select priority classes among risk alerts, digests, user tasks, and initiative.

### 4.4 Text-first results

All replies and reports, including task updates, are **text-first, concise, precise, and readable in chat**. Give the main finding, key numbers, and reasoning needed to understand the result; follow-up questions can deepen the analysis. This presentation keeps substantial calculations, research using available sources, and background jobs in scope. Image replies are low priority; deep research reports and polished web artifacts are deferred.

### 4.5 Proactive eligibility and randomized starts

Each proactive investigation has a defined financial scope. The exact scope catalogue, metrics, provider calculations, and attention thresholds need research; these scopes do not limit the finance-related jobs a user can request. Every eligible check runs an agent investigation with time and cost bounds whose numeric values remain open.

Before scheduling an investigation, the backend requires at least one selected, verified linked destination that is currently eligible. When queued work actually starts, the backend rechecks those conditions and current account authority. **Selecting no proactive insight delivery channels suppresses future investigations and unsent proactive messages**, including results from an investigation already running. Removing one channel from the selection prevents pending sends to that channel. Requested schedules retain their own controls.

Target **approximately five investigations per eligible account per day**, randomly spaced within **09:00–21:00 in the saved user timezone**. Times vary by user and day or occurrence rather than using fixed daily cron times, spreading load across accounts. This is a configurable product default, not an exact daily quota or a user intensity setting. Exact randomized timing and daylight-saving mechanics require integration verification; no jitter range or algorithm is selected. If the timezone is unknown, obtain it before using a local start window.

The window governs **actual investigation starts only**. A queued occurrence cannot begin an investigation outside the window. Work starting at 20:58 may finish and send at 21:03, subject to the usual settings and authority checks; finishing after 21:00 does not itself hold or suppress its message.

Only **one proactive investigation per account** may be active. Skip an overlapping occurrence, and do not build a missed-occurrence catch-up backlog after downtime. Scheduler-started proactive runs are excluded from the per-chat main-agent delegation quota; the proactive per-account rule still applies. The backend's exact cross-worker enforcement and randomized next-due integration remain implementation decisions.

### 4.6 Proactive evidence, history, and completion

The investigation receives its defined scope, authorized account evidence, permitted context, shared personal-memory read access, and account-level proactive finding and notification history. Its tool subset must preserve useful investigation ability while preventing settings, connection, memory, and saved-task mutation, nested delegation, and direct user messages. Financial credentials remain in backend adapters, including when E2B is used.

Store proactive history **separately from personal memory**. Record what was actually sent to each channel, when, and the supporting finding and evidence, while retaining candidates, internal results, and failed or uncertain deliveries as distinct outcomes. Distinguish intended copies across selected channels from accidental retries to the same channel. Later investigations can assess meaningful change and repetition even after the proactive insight delivery channels change. This account-level history does not copy channel transcripts or user tasks into shared memory.

If no finding qualifies, remain quiet. A candidate returns internal evidence through the completion path in section 4.1; main-agent continuation decides whether and how to respond within the defined financial scope and original read-only proactive purpose. One account-level investigation supplies the finding for all selected, currently eligible verified channels. Completion grants no new user authority. Before each eventual send, the backend rechecks that destination's current selection, eligibility, channel validity, and delivery authority. Exact pending-completion and dispatch mechanics remain open within these checks and channel context boundaries.

### 4.7 Execution failures and delivery boundaries

A user-requested **scheduled execution** receives **one automatic retry for a known temporary failure**, for a maximum of **two execution attempts per occurrence**. BullMQ owns this whole-job retry; inner tool or SDK retries must have a distinct scope. Exact temporary-failure classification and retry delay remain open. If the retry fails, return the failure to the main agent for a concise explanation, avoid repeated identical notices, and keep the recurring schedule enabled.

This numeric retry policy applies to requested scheduled executions. Retry details for unscheduled one-off background jobs, foreground chat, and message transport remain open. A message delivery failure must not rerun successful research or calculation; delivery retry and uncertain-send policies remain separate.

If a proactive investigation fails, **record the failure internally and wait for the next scheduled check**. Do not automatically retry the whole investigation or send a routine failure message to the user. A delivery failure must not rerun the investigation. Transport retry and uncertain-delivery policy remain separate operating decisions.

Requested scheduled work follows its two-attempt limit, while one-off jobs retain their separate open retry policy. Neither adopts the proactive investigation failure policy.

### 4.8 Concrete scheduling examples

| Situation | Result |
| --- | --- |
| An eligible account reaches a randomized 14:26 check. | The backend rechecks eligibility and starts a bounded agent investigation. No useful finding means silence; a supported candidate wakes a new main-agent turn that can inspect further evidence and compose the final reply. |
| A proactive investigation starts at 20:58 and its main-agent continuation is ready at 21:03. | Sending to each selected eligible channel is allowed after current selection and authority checks. The start window does not hold the result until morning. |
| A user clears the proactive insight delivery channels before a queued check starts, or while an investigation runs. | The first case starts no investigation. The second suppresses all unsent proactive messages. The user's requested daily digest continues under its own controls. |
| Both linked channels are selected and eligible when an investigation finds a qualifying insight. | Investigate once for the account and deliver to both channels. Record each channel's outcome separately, distinguishing intended copies from accidental retries. |
| A user removes a channel from the selection while its proactive message is pending, then disconnects it. | Do not send the pending copy there or enable an unselected channel. Its scheduled tasks follow their separate pause and explicit-resume rules. |
| A check becomes due while another proactive investigation for that account is active, or several occurrences are missed during downtime. | Skip the overlap and retain no missed-occurrence catch-up backlog. The next normal eligible check can run. |
| A proactive provider read fails; separately, a user-requested daily digest has a known temporary execution failure. | Record the proactive investigation failure internally and wait for its next check. Retry the requested digest once; if it fails again, the main agent gives a concise failure explanation and the schedule stays enabled. Delivery failure does not rerun successful research or calculation. |
| Nothing meaningfully changes after a prior proactive notification, but an explicitly requested daily summary is due. | Account-level proactive history supports silence on the repeated finding. The requested summary still arrives and may plainly report no change. |
| A user asks for an update every 15 minutes. | Explain the one-hour minimum and offer hourly. Create the hourly schedule only after the user accepts it; normal chat and one-off work remain available. |
| A chat has five enabled schedules and one paused schedule. | A sixth enabled schedule is refused. The paused task consumes no quota; resuming it requires an enabled slot, which can be freed by pausing an enabled task. |
| Five main-agent-spawned jobs are queued or running when a saved schedule becomes due. | Admit the scheduled occurrence independently and start its one agent run when worker capacity is available. A new child later delegated by the main-agent continuation must pass the main-agent quota. |
| An hourly task's 09:00 run is still active when its 10:00 occurrence becomes due. | Admit the 10:00 run without checking the 09:00 run's status; both may continue in parallel. Such duration exceeds the expected 5–10 minutes but is permitted. |
| A requested scheduled occurrence has a temporary failure, then succeeds on its retry. | Use at most two execution attempts for that occurrence and pass the successful result through normal main-agent continuation. The next scheduled occurrence remains enabled. |

## 5. Lifecycle boundaries and open operating policies

### 5.1 Changes while work is pending

| Policy | Accepted behavior and unresolved boundary |
| --- | --- |
| Pause and cancellation | Pause stops future runs and holds automatic results not yet sending. Cancellation ends recurrence and requests cancellation of all queued and running occurrences of that task. Define the dispatch-start boundary and cancellation mechanics; sends already started cannot be recalled. |
| Edit during execution | Changes apply to future runs; active execution keeps its original instructions. Current permissions, channel validity, pause/cancel state, and delivery authority still govern the attempt and publication. |
| Channel disconnection | Pause that channel's scheduled tasks, future runs, and pending unsent automatic results. Retain history and tasks without fallback; relinking keeps tasks paused until the user resumes from the same channel. |
| Financial access | Stop protected reads that no longer have authority. After explicit source disconnection, continue only if remaining authorized data fulfills the task's intended request; otherwise pause it and explain why once in the originating channel. Reconnection leaves it paused until explicit resume from that channel. Temporary provider outages retain automatic recovery without automatic cancellation. |
| Resume | Continue at the next scheduled time without a missed-update backlog. |
| Proactive settings changes | Website and chat update the same proactive insight delivery channels. Require at least one selected eligible verified destination before scheduling and actual investigation start; recheck each destination's selection and authority before sending. Removing or disconnecting a channel prevents pending sends there without enabling an unselected channel. Exact pending-completion and dispatch mechanics remain open within channel history and task boundaries. |

### 5.2 Timing, recovery, and repeated work

| Policy | Accepted behavior and choices that remain open |
| --- | --- |
| Requested recurrence | Enforce the configurable one-hour minimum and five enabled schedules per chat, excluding paused tasks. Exact supported recurrence forms, daylight-saving behavior, and late-work handling outside pause/resume remain open. One-time onboarding detection sets the default; existing task zones follow section 3.1. |
| Proactive timing integration | Preserve approximately five randomized daytime starts, actual-start window checks, one active investigation per account, skipped overlap, and no catch-up. Verify the queue integration and exact daylight-saving behavior. |
| Requested-work overlap | Admit every eligible occurrence independently without checking previous-run status or suppressing distinct overlapping occurrences. Actual worker start follows capacity; the expected 5–10-minute runtime is not a timeout. |
| Requested-run interruption | Select restart or failure behavior where required. Durable run state alone does not establish checkpoint recovery; no speculative checkpoint or replay engine is selected. |
| Requested-job retries | Requested scheduled execution gets one retry for a known temporary failure, at most two attempts per occurrence. Exact temporary classification and delay remain open. After retry failure, main reports concisely and recurrence stays enabled. One-off background retry details remain open. |
| Proactive investigation failure | Record internally, send no routine failure notice, and wait for the next scheduled check without a whole-investigation automatic retry. Requested schedules use their two-attempt rule; one-off and transport retry details remain open. |
| Duplicate delivery | Distinguish intended proactive copies across selected channels from accidental retries to the same channel. Consider a delivery identity tied to task occurrence or proactive finding and destination, plus provider idempotency where supported. Decide whether uncertain dispatch is retried with possible duplicates or left uncertain with possible omission. |
| Restart | Decide how unfinished requested work and overdue requested schedules are inspected after recovery. Proactive occurrences have no catch-up backlog. Retain actual outcomes rather than infer completion from a queue claim. |
| Admission and capacity | Enforce five queued or running main-agent-spawned subagents per chat initially; terminal jobs do not count. Scheduler-started requested and proactive runs are excluded. Global worker capacity, hosting, and provider/model quotas remain open. |

Execution and delivery do not promise exactly once. These policies must describe the chosen trade-offs without strengthening the accepted best-effort monitoring and recall limits.

## 6. Acceptance and remaining decisions

- Prove recurrence with one bounded test in which a saved schedule becomes due and BullMQ produces claimed work; manual enqueue alone is insufficient. Verify configured daily recurrence and timezone behavior without a day-long test.
- Reject a shorter-than-hour recurrence with an hourly offer and no silent schedule change. Enforce five enabled user schedules per chat on create, enable, and resume; paused tasks do not count.
- With five outstanding main-agent-spawned jobs, admit an eligible scheduled occurrence independently as one agent run. Admit successive occurrences of the same task without previous-run status checks and allow both to continue in parallel, preserving same-occurrence duplicate handling and live authority checks.
- Verify backend ownership of saved definitions and run statuses/results, derived queue timing, and one configured retry owner. Replace a worker and inspect retained run state without treating Redis as a service launcher.
- Demonstrate digest, flexible task, supported risk check, initiative, management controls, and low-noise behavior against [US-TASK-01 through US-TASK-08](../user-stories/tasks.md).
- Close chat, replace a worker, and inspect retained task state and outcomes. Exercise the selected interruption policy rather than claiming recovery from persistence alone.
- Run multiple independent jobs while the main chat remains usable; verify context separation and account-plus-channel enforcement for list, status, details, results, and cancellation. Another linked channel cannot inspect or change that work, and chat cannot select or retarget its destination.
- Admit five main-agent-spawned queued or running subagents and report capacity for a sixth; terminal runs do not count, and scheduler-started requested and proactive runs are excluded. A new subagent from a main-agent continuation does count. Verify only main-agent turns delegate additional subagents and background tools cannot mutate settings, connections, memory, or saved tasks or send user messages.
- Return internal results through completion events, start a new main-agent turn when idle, and retain completion for a later turn when busy. Verify the main agent can gather more evidence or combine children before replying and that the actual reply joins normal channel history without a separate overall-request lifecycle.
- Select one, both, and none of the linked messaging channels in the website and chat; verify both surfaces update the same proactive insight delivery channels and every newly linked channel is selected by default. A clear chat request changes that selection immediately; a materially ambiguous activation request receives clarification.
- With both channels selected and eligible, investigate once per account and deliver each qualifying finding to both. Record per-channel outcomes, distinguishing intended copies from accidental retries. Remove or disconnect one channel before sending and prevent its pending copy without enabling an unselected channel. Chat replies and requested tasks retain their originating channel and controls.
- Verify initiative relevance uses the connected portfolio, goals, and remembered interests; only meaningfully new and useful findings supported by strong evidence and worth attention are sent, with a concise explanation. Verify suppression of uncertain, minor, repetitive, and low-value findings, silence when none qualifies, and resurfacing only after an important change or new useful evidence. Verify requested scheduled results, including quiet-day summaries, bypass the initiative attention filter.
- Verify every eligible proactive check invokes a bounded agent investigation after scheduling and actual-start eligibility checks. Exercise randomized starts across users and occurrences, the approximately five-per-day default, the saved timezone window, skipped overlap, and no missed-occurrence catch-up. A 20:58 start may send at 21:03.
- Clear the proactive insight delivery channels before queued work starts and during an investigation; verify no investigation in the first case and no unsent proactive message in either case. Verify investigation requires at least one selected eligible verified destination; recheck each destination's selection and authority before delivery without changing requested-task controls.
- Record proactive investigation failure internally with no whole-investigation retry or routine user failure notice. Verify delivery failure does not rerun the investigation and requested work retains its own recovery policy.
- Keep account-level proactive history separate from memory, distinguish per-channel sent notifications from candidates and uncertain deliveries, and use that history after the proactive insight delivery channels change without copying channel transcripts or tasks.
- Verify future-only edits preserve active instructions while live permissions and delivery authority still apply. Verify pause holds unsent results, resume waits for the next scheduled time without backlog, cancellation requests that all queued and running occurrences of that task stop, and sends already started are reported honestly.
- Disconnect a channel, retain its history and tasks, and verify paused future runs and unsent results without rerouting. Relink it and require explicit resume from that channel.
- Explicitly disconnect a financial source and verify continued work only when remaining authorized data fulfills the intended request; otherwise verify a paused task and one explanation in its originating channel. Reconnect the source and require explicit resume from that channel at the next scheduled time without missed checks. Verify that a temporary provider outage retains automatic recovery without automatic cancellation.
- Verify one-time onboarding timezone detection, explicit personal-default changes in the web app and chat, task-specific timezone requests without default changes, and unchanged assigned zones on existing tasks unless explicitly edited. Clarify unknown timezone or morning time and confirm time and timezone.
- Verify text-first task updates and follow-up replies with the main finding, key numbers, and needed reasoning while preserving substantial calculations, research using available sources, and independent jobs.
- Exercise one known temporary scheduled failure followed by retry success and by retry failure; verify at most two execution attempts, a concise main-agent failure explanation after exhaustion, and an enabled recurrence. Delivery failure must not rerun successful research or calculation. Preserve distinct proactive and one-off retry policies, dispatch uncertainty, and honest delivery failure.
- Before implementation, settle definition-to-queue consistency, native schedule-production and randomized timing integration, exact recurrence and daylight-saving mechanics, cancellation and dispatch boundaries, temporary-failure classification and retry delay, one-off retry details, interruption handling, global capacity, numeric budgets, financial investigation scopes and calculations, exact attention and material-change thresholds, precision measurement, detailed repeat handling, risk and freshness rules, pending-completion routing, delivery-provider behavior, hosting, and retention. These choices must preserve the accepted policies. Targeted local checks and a few bounded end-to-end proofs provide acceptance evidence.
- Apple-channel controls remain **TBD** in the [central TODO](../TODO.md), limited to the minimum needed for applicable compliance. Apple-specific requirements must not guide general product UX.
