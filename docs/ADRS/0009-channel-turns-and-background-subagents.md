# Channel turns and background subagents

## 1. Status and scope

**Status: ACCEPTED Phase 1 execution direction.** One active ordinary API/backend process coordinates chat across all users. Different channels execute concurrently, with one foreground main-agent turn at a time per channel. Normal chat runs directly in that process; subagent results trigger fresh main-agent turns, and the main agent owns every agent-authored user reply. API/backend deployments use simple stop-and-start replacement, accepting brief interruptions. Background consumers use the separate [Cloud Run worker pool](0017-cloud-run-worker-pool.md). Overall architecture, framework integration, API/chat hosting product, and configuration remain tentative.

The [runtime design](../design/runtime.md) owns detailed execution boundaries, examples, and verification. The [task design](../design/tasks.md) owns saved user tasks, recurring runs, and proactive policies. The [channel scope and shared memory decision](0008-channel-scoped-work-and-shared-memory.md) owns account-wide personal context and channel-scoped conversations and work. This record owns the runtime decisions and their rationale.

## 2. Decision

### 2.1 Direct normal chat with an explicit interruption limit

The backend verifies and binds the sender, deduplicates the inbound event, stores the message, and promptly acknowledges transport receipt. Normal chat then executes directly in the single active API/backend chat coordinator without a durable BullMQ chat queue. User messages and background completion events enter the same channel-turn handler, which remains callable independently of the transport. The coordinator is an ordinary backend process, not a separate agent service or a runtime assigned to each user.

Deployments stop the active API/backend process and start its replacement. Phase 1 accepts brief chat and traffic interruptions during that replacement. Process or deployment interruption can leave an acknowledged chat message without a reply; stored messages alone do not resume inference. Custom traffic switching, zero-downtime deployment, and distributed chat coordination are deferred until observed need or user impact justifies them.

Hosting must support work after the transport response. The API/chat hosting product, CPU allocation, process lifetime, and exact configuration remain open. Identity, authorization, deduplication, and channel ordering remain required.

### 2.2 One foreground turn per channel

Each linked channel has one logical event stream or inbox and one active foreground main-agent turn. Different channels may have active turns concurrently in the shared coordinator. Initial ordering may use in-process coordination. A turn consumes pending user messages, internal completion events, or both, with permitted channel context. It can include several model/tool rounds and end with a reply, delegation acknowledgement, or no unnecessary message. A model round can request several tools; their results feed a later round. A turn is neither one model invocation nor necessarily one user message.

Quick work runs inline. For substantial work, the main agent starts background subagents, receives accepted job IDs, acknowledges as appropriate, and ends the turn. The main agent must not occupy the foreground waiting for background results. Messages and completion events arriving during an active turn remain pending for a later turn; Phase 1 does not require mid-turn injection or steering.

Steering an active background run is deferred. A new chat message does not automatically redirect or cancel it; supported status and cancellation tools remain available.

This is logical ordering, not a separate physical queue, process, or VM for each channel. Other channels retain their separate context and work under the account/channel boundary.

### 2.3 Native completion events and main-owned replies

Subagents return internal findings, data, evidence, or artifact references rather than directly sending user messages. The worker saves the completed job state and result in PostgreSQL before completing its BullMQ job. **The chat coordinator subscribes to native BullMQ `QueueEvents` completion notifications from all workers.** On notification, it resolves trusted stored work bindings. For user-requested work, these include account, originating channel, original-request, and job bindings; the coordinator queues a logical completion event for that channel through the same channel-turn handler used by inbound chat. Notification supplies neither authorization nor channel ordering. This completion direction is selected within the initial BullMQ baseline; the overall Redis-backed integration remains provisional.

Proactive completion uses the same subscriber and coordinator to handle one saved account-level investigation under the [task design's delivery policy](../design/tasks.md). Its qualifying result serves all selected, currently eligible verified channels without repeating research per channel or falling back to an unselected channel. Exact pending-completion and dispatch mechanics remain open; the main agent owns every agent-authored reply.

If the channel is idle, the event starts a new main-agent turn. Otherwise the current foreground turn continues and the event remains pending for a later turn. Fresh input includes the original request where applicable, a compact result summary, result references, and current permitted channel context; this is not a resumed model call. Completion does not create a user instruction or expand permission.

Within the original authorized purpose, the main agent can read result details when needed, check financial tools, run E2B calculations, combine available children, start further top-level work, reply, or end quietly while another child continues. Event notification and selective reading of saved results work together; no model polling, busy-waiting, or foreground waiting for completion is required. The main agent's actual reply enters normal channel history for follow-ups. Scheduled and proactive agent output follows the same reply boundary, subject to its separate eligibility and silence policies.

**PostgreSQL is authoritative for job state and results; the event only wakes the coordinator.** Within the Redis baseline, [BullMQ `QueueEvents`](https://docs.bullmq.io/guide/events/) uses Redis Streams with bounded, automatically trimmed retention. This does not establish unlimited event retention, exactly-once main-agent turns, or exactly-once replies. A small recovery rule must find persisted unhandled results after missed events or coordinator restart. Cursor/replay behavior, pending or handled records, duplicate handling, and uncertain-send handling remain open. Notification or delivery failure must reuse the saved result rather than rerun successful analysis.

### 2.4 One-level delegation and bounded outstanding work

The configurable initial maximum is five outstanding main-agent-spawned subagent runs per chat, counting queued and running runs. Terminal runs do not count. At capacity, the main agent reports the limit rather than accepting another delegation, whether the user requested delegation or the main agent chose it. A new subagent spawned by a main-agent continuation uses the same quota.

Scheduler-started recurring and proactive runs are excluded from this delegation quota. Each user-created scheduled occurrence starts one independent background agent run; distinct occurrences of the same saved task can run in parallel without checking whether the previous occurrence is queued or running. The [task design](../design/tasks.md) owns saved-schedule limits, due-occurrence admission, scheduled retries, and the separate proactive policy. The [worker-pool decision](0017-cloud-run-worker-pool.md) owns configurable execution limits and basic capacity evidence; exact limit values remain provisional.

Only main-agent turns can delegate. The subagent tool subset and backend authorization prevent nested subagents. A later main-agent turn may start another top-level run without creating another delegation level.

Background research, subagent, and proactive runs receive useful authorized read, research, and code-execution tools and shared personal memory read access. They cannot change settings, connections, personal memory, or saved user tasks, or directly send messages. Backend checks enforce these capability limits without arbitrarily reducing investigation ability.

### 2.5 Job records without a parent-request lifecycle

Application-owned tables in the [shared PostgreSQL database](0013-shared-postgresql-storage.md) record real job states, results, and stable original-request correlation needed for routing, status, cancellation, and admission. Mastra owns separate tables for its messages and memory; backend authorization governs both. BullMQ is the initial baseline for timing, dispatch, claims, and configured job retries, with provisional Redis integration; Mastra executes the claimed run. Saved recurring tasks retain their own lifecycle, distinct from execution runs.

The main agent reasons from context and actual child statuses to decide whether the user's request is answered. Phase 1 defines no overall-request finished flag, mandatory dependency graph, workflow checkpoint, or parent cancellation hierarchy. A status claim must use actual job-status tools. Cancellation requested does not mean execution has stopped; current permission, channel, cancellation, and delivery checks still apply.

The [scheduling decision](0004-durable-scheduling-and-queued-execution.md) owns background recovery. Requested background work has at most two total whole-job attempts. An interrupted unfinished run restarts from the beginning only while still active and authorized and with an attempt remaining; the scheduled known-temporary-failure retry uses this same allowance. Reuse a saved completed result rather than rerun completed analysis. Proactive failures and interruptions wait for the next eligible check, and cancelled or revoked work does not restart. Phase 1 does not resume in-agent, model, or tool checkpoints. Ordinary non-interruption one-off error retry classification remains open within the two-attempt ceiling.

## 3. Rationale and alternatives

**Direct chat keeps the initial execution path small.** A durable chat queue, replay engine, outbox, or checkpoint system would strengthen interruption recovery but adds mechanisms beyond the accepted Phase 1 guarantee. The accepted reply-loss limit keeps that trade-off explicit. Demonstrated reliability, capacity, rate-limit, or other concrete requirements can justify revisiting dispatch while preserving the agent logic and required correctness checks.

**One coordinator keeps initial ordering and deployment simple.** Concurrent channels share one backend process without distributed coordination or custom traffic switching. The trade-off is that process capacity bounds foreground work and stop-and-start deployments briefly interrupt chat and traffic. Observed load or user impact, rather than a hypothetical scaling requirement, justifies revisiting that topology and deployment policy.

**Ordered turns keep one conversation coherent.** Serializing foreground turns avoids concurrent inference using incompatible channel context. Background subagents free that foreground for new questions, while pending events preserve turn boundaries without requiring mid-turn steering.

**Main-owned replies preserve the full request.** Child findings may need fresh evidence, calculations, or another child's result before they answer the user. Posting every child report directly would expose incomplete work and split response authority. A fresh main-agent turn can assess current context and permissions and produce one useful chat reply when appropriate.

**Native queue events reuse the background transport.** `QueueEvents` brings completions from all workers to the coordinator without an application HTTP callback endpoint, authentication scheme, and retry protocol. Periodic PostgreSQL polling as the primary notification path would add repeated discovery queries and discovery delay. Native events give prompt notice while PostgreSQL keeps the durable outcome; the trade-off is bounded stream retention and the need to design recovery for persisted unhandled results. Selective result reads after notification keep detailed evidence available without model polling.

**Actual jobs provide enough execution state.** Context and job-status tools support agent-led completion decisions without a second parent workflow lifecycle. The five-run limit bounds main-agent delegation while scheduler-started occurrences follow their own admission policy. One-level delegation keeps admission and tool authority enforceable at the main-agent boundary.

## 4. Consequences and open implementation choices

- **Shared infrastructure:** retain the shared Mastra regular `Agent` direction, fresh trusted per-run context, E2B isolation, and backend-held credentials. API/chat and background workers use the same backend codebase with distinct entrypoints and deployments; logical channel ordering remains independent of worker-pool instance count.
- **Continuation:** the single chat coordinator subscribes to native `QueueEvents` and routes completion through trusted stored bindings to its channel handler. Subscriber lifecycle integration, pending-event representation, and ordering remain open within the accepted one-process topology; this record does not promise durable chat replay or exactly-once external delivery.
- **Durability:** background results and required files persist outside disposable workers and sandboxes. The recovery rule for persisted unhandled results after missed events or coordinator restart remains to be designed, including cursor/replay behavior, pending or handled records, duplicate handling, and uncertain-send handling. PostgreSQL hosting, detailed table schemas, file storage, retention, interrupted-run detection, and enforcement of the accepted restart and attempt policy remain open. Ordinary non-interruption one-off error retry classification remains open within that policy's two-attempt ceiling.
- **Authority:** subagent output is untrusted evidence within its assigned purpose. Backend capability checks, current permissions, channel validity, cancellation checks, and existing delivery controls remain required.
- **Capacity:** five outstanding main-agent-spawned queued or running subagents is the initial configurable per-chat limit. Scheduler-started runs are excluded. Configurable execution limits and per-run duration, model usage, and outcome evidence follow the worker-pool decision; exact values remain provisional, and per-user dollar budgets are deferred. Exact cancellation mechanics remain open.
- **Hosting:** background consumers use the selected Cloud Run worker pool with manual instance scaling and the scheduling decision's recovery policy. Its shutdown warning cannot guarantee completion of an active long-running job. The single API/backend chat coordinator uses stop-and-start deployment; its hosting product, suitable post-acknowledgement CPU, service lifetime, and configuration remain open. [Cloud Run's background-activity guidance](https://docs.cloud.google.com/run/docs/tips/general#background_activity) illustrates that separate constraint.
