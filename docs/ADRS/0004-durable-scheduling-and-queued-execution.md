# Durable scheduling and queued execution

## 1. Status and scope

**Status: ACCEPTED durable scheduling requirement and core Phase 1 task and proactive-message UX; TENTATIVE execution mapping; PROVISIONAL BullMQ and Redis choice.** MyStacks stores ongoing task instructions and schedules durably. The proposed execution mapping runs due work through shared workers, with BullMQ and Redis as the current recurrence and queueing candidate pending the overall architecture round and operational validation.

This decision supports daily digests, user-defined informational tasks, and proactive checks under the [requirements](../requirements.md). The [architecture](../architecture.md) owns detailed flows and state ownership; this record owns the scheduling trade-off.

## 2. Decision

### 2.1 Persistent definitions and new runs

Ongoing work must retain its **intent, current status, stable account, originating channel, and trigger** outside workers. These standing task records remain distinct from execution attempts and their outcomes. When a worker claims due work, it starts a new run with the relevant durable context and the instructions that apply when it starts. The schedule and queue wait between runs; an LLM need not keep running or remember to wake itself.

In the proposed mapping, shared workers wait for queued work, claim ready jobs, and execute MyStacks application code. Routine monitoring uses inexpensive predefined checks; research and flexible or deeper analysis invoke the common Mastra `Agent` with fresh trusted per-run account, resource, channel, and thread context when needed. Both paths must operate within resource budgets. Channel scope does not require separate channel runtimes, queues, or deployments.

Users can list, inspect, change, pause, resume, and cancel only the current channel's ongoing tasks. They can list independent jobs, check status, and request cancellation only in their originating channel; results stay there too. Backend handlers enforce account and channel ownership rather than trusting model-selected identifiers. Phase 1 chat cannot select another destination, transfer work, or retarget results. Account-wide personal memory and financial access do not expand task access; the [channel and memory decision](0008-channel-scoped-work-and-shared-memory.md) owns that boundary.

Task edits apply to future runs; active runs keep their original instructions unless explicitly cancelled. Before protected reads and delivery, the orchestration layer must still enforce current financial permissions, channel validity, applicable task pause/cancel state, and delivery authority. Pausing stops future runs and holds automatic results not yet sending. Resuming continues at the next scheduled time without a missed-update backlog. Cancelling ends recurrence and requests active-run cancellation; past results remain available in the owning channel. The instruction snapshot is a logical requirement, not a selected persistence schema.

Website onboarding detects and saves the device timezone **once** as the personal default. The app does not continuously detect timezone or track travel; redetection on later website visits is deferred. The user can explicitly change the personal default timezone in the web app or chat. A timezone named in a task request applies only to that task without changing the default. A changed default applies to new tasks; existing tasks keep their assigned timezone unless explicitly edited. Ask for an unknown timezone and for a morning time when not already known, then confirm the chosen time and timezone.

Channel disconnection pauses its scheduled tasks, future runs, and pending unsent automatic results without fallback. Tasks and history remain; relinking the same channel leaves tasks paused until an explicit resume from that channel. Already-started sends cannot be recalled, and active attempts and one-off jobs retain honest cancellation and outcome semantics.

When a financial source is explicitly disconnected, a task continues only if remaining authorized data still fulfills its intended request. Otherwise, pause the affected task and explain why once in its originating channel. Reconnecting the source leaves the task paused until the user explicitly resumes it from that channel, at the next scheduled time without a missed-check backlog. A temporary provider outage is distinct from explicit disconnection: an isolated provider failure remains eligible for automatic recovery and does not automatically cancel the task.

Agent-initiated messages are **on by default**, with one account-wide binary on/off setting in chat and a separate preferred linked channel controlled through website routing settings. The first linked channel is preferred, and linking another does not change it. If the preferred channel disconnects and another remains, proactive preference switches to the remaining channel and the website shows the change. With no channel linked, proactive delivery pauses until a channel is linked while retaining the on/off preference. This fallback applies only to proactive insights; it cannot move scheduled work or its results.

Initiative uses the user's connected portfolio, goals, and remembered interests to judge relevance flexibly. Send only a meaningfully new and useful finding supported by strong evidence and worth the user's attention, with a concise explanation of why it matters. **High precision takes priority over recall:** accept missed marginal events to avoid spam, suppress uncertain, minor, repetitive, or low-value findings, and stay quiet when none qualifies. Resurface a finding only after an important change or new useful evidence. Explicitly scheduled work follows the user's request and its own controls; the initiative attention filter must not suppress requested results, including daily summaries on quiet or no-change days.

### 2.2 Provisional library and storage

The candidate uses BullMQ Job Schedulers for recurring jobs and Redis for the schedule and queue state used by BullMQ. The library supplies timing and job claiming; MyStacks must define product behavior and configure the required durability. See [BullMQ Job Schedulers](https://docs.bullmq.io/guide/job-schedulers/).

The design uses current scheduling APIs, without a custom scheduler engine or a legacy `QueueScheduler` service. BullMQ documents [`QueueScheduler` as deprecated](https://docs.bullmq.io/guide/queuescheduler).

The storage design must assign **one authoritative definition** for each schedule and task. If product records and BullMQ state occupy different stores, their mapping and update contract must be explicit; they must not become independent authorities that can disagree. The schema and authority mapping remain open.

Under this provisional choice, BullMQ owns scheduling, job claims, and job-level retries. Mastra executes the claimed run. A Mastra scheduler or workflow retry mechanism must not independently schedule or retry that same queued operation. Any model or API retries within a run must have a defined scope that does not overlap job-level recovery.

### 2.3 Shared warm capacity

Workers are warm application processes that can run multiple jobs and can be distributed across hosts. They are not newly created infrastructure jobs for each task. BullMQ supports worker concurrency and [multiple workers across machines](https://docs.bullmq.io/guide/workers/concurrency).

Available warm capacity avoids provisioning a worker for each run. Busy queues, capacity changes, replacement-worker startup, sandbox startup, and provider or model latency can still delay work. BullMQ's recurring job production can also slow when the previous job has not begun processing. [Job Scheduler behavior](https://docs.bullmq.io/guide/job-schedulers/)

## 3. Rationale and alternatives

Durable scheduling separates a user's standing instructions from the lifetime of any process. Shared workers allocate execution capacity to active work while users' schedules and context remain stored between runs.

An always-on runtime for every user with local timers is a viable alternative. It keeps timers and local state together, but carries idle compute, fleet health, upgrades, and state-recovery costs. A suspended or stopped process cannot rely on a local timer to execute due work.

A managed scheduler and queue is another viable alternative if its recurrence, delivery, and operational contract fits the product. BullMQ and Redis are provisional because their familiar queue and concurrency model may meet the need without a custom scheduling engine; the detailed fit and operating configuration still require validation.

## 4. Consequences and open decisions

- **Capacity planning:** stored users or tasks do not equal concurrent runs. Size workers from task frequency, run duration, due-time bursts, and model/provider quotas; user totals alone cannot establish capacity.
- **Timing:** Phase 1 checks start every couple of hours or daily. Exact cadence, recurrence mechanics, daylight-saving behavior, and overdue work outside pause/resume remain open. Queueing does not promise strict start times or exactly-once execution or delivery. Preserve best-effort checks and delivery, accepted missed events, and precision ahead of recall.
- **Storage:** decide the authoritative task/schedule schema, its mapping to BullMQ state, and Redis persistence, backup, and recovery configuration.
- **Run behavior:** recover failed scheduled runs automatically where supported and retain recurrence after an isolated failure. If the update cannot be produced, give a concise explanation, identify required user action, and avoid repeated identical failure notices. Define retryable failures, attempt limits and delays, overlapping runs, cancellation mechanics, the dispatch-start boundary, worker interruption, and restart behavior within the accepted lifecycle rules.
- **Advanced continuity:** adopting Mastra workflow checkpoints or durable-agent facilities requires a concrete design for run persistence, replay, and queue ownership. Selecting Mastra does not settle interrupted-run recovery.
- **Delivery:** all replies and reports, including task updates, are text-first, concise, precise, and readable in chat, with the main finding, key numbers, and needed reasoning. Follow-up questions can deepen substantial calculations and research using available sources. Decide how repeated execution and delivery attempts affect notifications, including duplicate handling and uncertainty. Proactive context assembly and pending-dispatch mechanics must preserve channel history and task boundaries.
- **Initiative methods:** the qualitative relevance and attention policy is accepted. Architecture and evidence must establish exact attention and material-change thresholds, claim-specific and provider freshness rules, precision measurement and any numeric target, and repeat-suppression mechanisms. No numeric precision target is guaranteed, and these methods must preserve requested scheduled results and the accepted best-effort monitoring limits.
- **Operational fit:** select worker hosting, concurrency, warm capacity, queue visibility, resource-budget limits, and provider/model quota handling before sizing the service. BullMQ and Redis remain replaceable until that validation settles the technology choice.
