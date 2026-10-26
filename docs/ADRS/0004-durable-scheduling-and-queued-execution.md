# Durable scheduling and queued execution

## 1. Status and scope

**Status: ACCEPTED scheduling architecture; PROVISIONAL BullMQ and Redis choice.** MyStacks stores ongoing task instructions and schedules durably and runs due work through shared workers. BullMQ with Redis is the current candidate for recurrence and queueing, subject to implementation and operational validation.

This decision supports daily digests, user-defined informational tasks, and proactive checks under the [requirements](../requirements.md). The [architecture](../architecture.md) owns detailed flows and state ownership; this record owns the scheduling trade-off.

## 2. Decision

### 2.1 Persistent definitions and new runs

Ongoing work must retain its **intent, current status, user, trigger, and delivery destination** outside workers. These standing task records remain distinct from execution attempts and their outcomes. When a worker claims due work, it starts a new run with the relevant durable context. The schedule and queue wait between runs; an LLM need not keep running or remember to wake itself.

Shared workers wait for queued work, claim ready jobs, and execute MyStacks application code. Routine monitoring uses inexpensive predefined checks; research and flexible or deeper analysis invoke the common Mastra `Agent` with server-bound user, resource, and thread context when needed. Both paths must operate within resource budgets. Users must be able to **change or pause** ongoing tasks and notifications.

Before task results are delivered, the orchestration layer must recheck current permissions, task status, and destination. Task edits, pauses, retries, and repeated delivery need explicit policies; their exact effect on in-flight work remains open.

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
- **Timing:** Phase 1 checks start every couple of hours or daily, with exact per-task cadence and timezone behavior open. Queueing does not promise strict start times or exactly-once execution or delivery. Preserve best-effort checks and delivery, accepted missed events, and precision ahead of recall.
- **Storage:** decide the authoritative task/schedule schema, its mapping to BullMQ state, and Redis persistence, backup, and recovery configuration.
- **Run behavior:** define timezone and recurrence rules, overdue work, retries, overlapping runs, edits during execution, pause/cancellation, worker interruption, and restart behavior.
- **Advanced continuity:** adopting Mastra workflow checkpoints or durable-agent facilities requires a concrete design for run persistence, replay, and queue ownership. Selecting Mastra does not settle interrupted-run recovery.
- **Delivery:** decide how repeated execution and delivery attempts affect notifications, including duplicate handling.
- **Operational fit:** select worker hosting, concurrency, warm capacity, queue visibility, resource-budget limits, and provider/model quota handling before sizing the service. BullMQ and Redis remain replaceable until that validation settles the technology choice.
