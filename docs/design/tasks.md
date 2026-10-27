# Proactive task and delivery design

## 1. Scope and standing decisions

This design covers **Phase 1 digests, periodic risk checks, natural-language ongoing tasks, independent initiative, and notification controls**. The [user stories](../user-stories/tasks.md) own observable acceptance; the [requirements](../requirements.md) own product scope, and the [architecture](../architecture.md) owns shared execution boundaries.

**Accepted:** standing requests and required outcomes persist outside workers; tasks remain informational and financially read-only; current permissions, task state, and destination are checked before publication. Monitoring begins every couple of hours or daily, with exact cadence open, best-effort timing, accepted missed events, and precision ahead of recall.

**Provisional technology:** BullMQ with Redis owns scheduled-job eligibility, claims, and job-level retries; workers execute predefined checks or invoke the common Mastra `Agent` when reasoning is needed. Exact persistence, schedule authority, lifecycle policies, delivery provider, budgets, and defaults remain open. This design defines logical responsibilities rather than record schemas.

## 2. Durable concepts and ownership

### 2.1 Distinct records

| Concept | Responsibility |
| --- | --- |
| **Standing task** | Retain user, intent, current status, covered resources, trigger, and delivery destination. Keep settings independent of any one attempt. |
| **Schedule** | Define recurrence, timezone where relevant, and when a task becomes eligible. A task's trigger may refer to a schedule. |
| **Job** | Represent queued work for a due occurrence or other authorized request. Continued chat work uses the same queued-work semantics. |
| **Run attempt** | Record one execution's progress, evidence references, result, and success, failure, or interruption. Retrying a job does not create another standing request. |
| **Delivery** | Record a proposed message, its eligibility decision, destination binding, and dispatch outcome separately from successful analysis. |
| **Notification settings** | Retain applicable user controls for destinations, paused notifications, and selected noise policies. |

These boundaries do not require separate services or a separate database for every concept. Durable financial evidence stays in the [portfolio boundary](portfolio.md); conversation continuation and Mastra context follow the [runtime design](runtime.md).

### 2.2 One schedule authority

Choose **one authoritative schedule definition** before implementation. The following alternatives remain open:

- **Application database authority:** retain the canonical schedule with task state; BullMQ holds derived recurrence state. Define how a successful edit updates that state and how an incomplete update is detected and repaired.
- **BullMQ authority:** retain the canonical recurrence in BullMQ's durable state; application task records reference that definition rather than carry an independently editable recurrence copy. Define how task updates and schedule changes become consistent.

Both alternatives need a clear read/update contract, durable configuration, and observable failed updates. Neither permits two stores to make independent schedule decisions. Use BullMQ scheduling rather than building another timer or scheduler engine. Mastra must not independently schedule or retry the same queued operation.

## 3. Task creation and logical lifecycle

### 3.1 From language to a standing request

Mastra interprets an ongoing request and uses an authorized task tool to read or change structured state. Trusted backend context binds the user; model-provided identifiers do not establish access. The tool validates covered resources, supported trigger values, and destination authority.

Before enabling delivery, resolve material ambiguity in intent, timing, timezone, source coverage, and destination. Confirm the resulting request in readable language. Memory can help interpret preferences, but it does not own task schedules, financial evidence, or delivery authority. Unsupported work remains visibly unsupported.

Daily digests, risk checks, and initiative use these common task and delivery boundaries. Their activation defaults remain open; an independent finding is not authority to expand financial access or notification permissions.

### 3.2 Logical state transitions

**Proposed lifecycle vocabulary:** active, paused, and removed standing tasks; eligible and claimed jobs; running, succeeded, failed, interrupted, or skipped attempts; pending, suppressed, dispatching, sent, failed, or uncertain deliveries. Exact persisted states remain a schema decision.

- Creating or resuming an enabled task allows future eligibility; pausing retains its standing intent while changing eligibility under the selected policy.
- Editing a task changes its current definition. The in-flight policy determines whether an older job may continue computation or must use a new definition before producing a result.
- Removing a task ends future delegated work. Retention of its definition, execution history, evidence, and delivery records remains a separate open policy.
- Attempt success makes a result available; it does not prove delivery. An unavailable provider response or interrupted worker must not become a successful result or a zero balance.

Task pause, notification pause, source disconnection, and worker shutdown affect different responsibilities. The UI must show their actual effects rather than collapse them into a single success state.

## 4. Execution and publication

### 4.1 One execution path

1. BullMQ makes scheduled work eligible and a worker claims the job. Eligibility is not an exact execution-time guarantee.
2. The worker resolves the current task and trusted user context, checks applicable task state, and authorizes protected reads through backend tools.
3. A predefined check reads evidence and performs routine calculations. Flexible interpretation, research, or deeper analysis invokes Mastra only when needed.
4. The worker records required progress and the attempt outcome outside the process, preserving evidence freshness, coverage gaps, and native values and units.
5. The delivery boundary evaluates whether there is an eligible message, then rechecks current task state, permissions, notification settings, and authorized destination before publication.
6. The delivery outcome is saved separately. Failure or uncertainty remains visible; retry behavior follows the selected policy.

Continued chat analysis uses the same job, attempt, progress, and delivery concepts described in [runtime.md](runtime.md). It does not need a second scheduler. Whether all immediate chat calls enter the queue remains open; durable continuation must survive the originating conversation and worker.

### 4.2 Cheap checks and evidence reuse

Routine checks use predefined provider reads and calculations rather than a model call for each user or interval. Public market observations may be collected once and reused when their freshness and coverage satisfy each claim. Reuse must retain source and as-of evidence; it must not turn an old observation into a current one.

Private account evidence remains user-authorized. A shared public price does not establish account access, portfolio membership, or permission to share private results. The [portfolio design](portfolio.md) owns evidence boundaries and claim-specific reuse. Credentials remain in trusted backend adapters and must stay out of model context, job inputs, and generated-code environments.

### 4.3 Low-noise notification eligibility

An eligible message must be in scope, supported by sufficient evidence for its claim, useful under the task's intent or initiative policy, and allowed by current notification settings. Unknown data cannot support an “all clear” claim. Useful partial answers identify unavailable sources and uncertainty.

**Proposed defaults:** suppress repeated or no-change watch findings unless they add useful information; send an explicitly requested daily balance or digest even when the supported result is unchanged. Material-change thresholds, repeat suppression periods, initiative relevance rules, and partial-result delivery remain open.

Monitoring, data access, model work, generated-code analysis, and delivery need resource budgets. Limit values and exhaustion behavior remain open: defer eligible work, produce a useful partial result, or record a visible failure are candidate outcomes. This design does not select priority classes among risk alerts, digests, user tasks, and initiative.

## 5. Open operating policies

### 5.1 Changes while work is pending

| Policy | Concrete proposed choice and unresolved boundary |
| --- | --- |
| Pause or removal | **Proposed:** stop future eligibility and suppress results still pending publication; permit a dispatch already underway to finish. Define the boundary where dispatch begins and what the user sees. |
| Edit during execution | Choose whether to discard an old result and rerun, or reuse compatible computation after validating it against the current task. Never publish solely from stale queued intent. |
| Destination change | Choose whether to suppress pending output or re-evaluate it for the newly authorized destination; do not use an obsolete destination binding. |
| Disconnection or permission loss | Stop protected reads that no longer have authority. Choose whether available authorized partial results can still be sent or the task reports missing access. |
| Resume | Choose whether to wait for the next due occurrence or request one fresh check; do not imply that missed checks already ran. |

### 5.2 Timing, recovery, and repeated work

| Policy | Choices that remain open |
| --- | --- |
| Recurrence | Select cadence, morning time, timezone source, daylight-saving and travel behavior, and late-work handling: skip, coalesce into one current check, or run selected missed occurrences. |
| Overlap | Choose whether a due occurrence waits, is skipped, or replaces obsolete pending work when an earlier attempt is still running. |
| Worker interruption | Restart the attempt, record failure, or resume from explicitly persisted checkpoints if a requirement justifies them. Durable task state alone does not establish checkpoint recovery. |
| Job retries | Select retryable failures, attempt limits, and delay. BullMQ owns job-level retry; any tool or provider retry inside a run must have a distinct scope. |
| Duplicate delivery | Consider a delivery identity tied to task occurrence and destination, plus provider idempotency where supported. Decide whether uncertain dispatch is retried with possible duplicates or left uncertain with possible omission. |
| Restart | Decide how unfinished work and overdue schedules are inspected and handled after recovery; retain visible outcomes rather than infer completion from a queue claim. |

Execution and delivery do not promise exactly once. These policies must describe the chosen trade-offs without strengthening the accepted best-effort monitoring and recall limits.

## 6. Acceptance and remaining decisions

- Prove recurrence with one bounded test in which a saved schedule becomes due and BullMQ produces claimed work; manual enqueue alone is insufficient. Verify configured daily recurrence and timezone behavior without a day-long test.
- Demonstrate digest, flexible task, supported risk check, initiative, management controls, and low-noise behavior against [US-TASK-01 through US-TASK-08](../user-stories/tasks.md).
- Close chat, replace a worker, and inspect retained task state and outcomes. Exercise the selected interruption policy rather than claiming recovery from persistence alone.
- Verify current publication authority when a task is paused, edited, removed, disconnected, or redirected while work is pending; include dispatch uncertainty and honest delivery failure.
- Before implementation, settle schedule authority, recurrence and in-flight policies, resource limits, notification defaults, risk and freshness rules, delivery-provider behavior, and history retention. Targeted local checks and a few bounded end-to-end proofs provide acceptance evidence.
