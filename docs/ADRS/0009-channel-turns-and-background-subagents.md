# Channel turns and background subagents

## 1. Status and scope

**Status: ACCEPTED Phase 1 execution direction.** Normal chat runs directly in the backend; each linked channel has one foreground main-agent turn at a time. Subagent results trigger fresh main-agent turns, and the main agent owns every agent-authored user reply. Overall architecture, framework integration, physical coordination, and hosting remain tentative.

The [runtime design](../design/runtime.md) owns detailed execution boundaries, examples, and verification. The [task design](../design/tasks.md) owns saved user tasks, recurring runs, and proactive policies. The [channel scope and shared memory decision](0008-channel-scoped-work-and-shared-memory.md) owns account-wide personal context and channel-scoped conversations and work. This record owns the runtime decisions and their rationale.

## 2. Decision

### 2.1 Direct normal chat with an explicit interruption limit

The backend verifies and binds the sender, deduplicates the inbound event, stores the message, and promptly acknowledges transport receipt. Normal chat then executes directly in the backend without a durable BullMQ chat queue. The channel-turn handler remains callable independently of the transport.

Process or deployment interruption can leave an acknowledged chat message without a reply; stored messages alone do not resume inference. Hosting must support work after the transport response. CPU allocation, lifetime, and coordination across service replicas remain open. Identity, authorization, deduplication, and channel ordering are required regardless of the dispatch mechanism.

### 2.2 One foreground turn per channel

Each linked channel has one logical event stream or inbox and one active foreground main-agent turn. A turn consumes pending user messages, internal completion events, or both, with permitted channel context. It can include several model/tool rounds and end with a reply, delegation acknowledgement, or no unnecessary message. A model round can request several tools; their results feed a later round. A turn is neither one model invocation nor necessarily one user message.

Quick work runs inline. For substantial work, the main agent starts background subagents, receives accepted job IDs, acknowledges as appropriate, and ends the turn. The main agent must not occupy the foreground waiting for background results. Messages and completion events arriving during an active turn remain pending for a later turn; Phase 1 does not require mid-turn injection or steering.

Steering an active background run is deferred. A new chat message does not automatically redirect or cancel it; supported status and cancellation tools remain available.

This is logical ordering, not a separate physical queue, process, or VM for each channel. Other channels retain their separate context and work under the account/channel boundary.

### 2.3 Internal child results and main-owned replies

Subagents return internal findings, data, evidence, or artifact references rather than directly sending user messages. The worker persists the result and emits completion. The backend listener resolves trusted stored account, channel, original-request, and job references, then invokes the same channel-turn handler used by inbound chat. BullMQ `QueueEvents` is the provisional completion notification mechanism; its [documented worker events](https://docs.bullmq.io/guide/workers) do not supply application authorization or channel ordering.

If the channel is idle, completion starts a new main-agent turn. Otherwise the event remains pending. Fresh input includes the original request, result references, and current authorized context; this is not a resumed model call. Completion does not create a user instruction or expand permission.

Within the original authorized purpose, the main agent can check financial tools, run E2B calculations, combine children, start further top-level work, reply, or end quietly while another child continues. A polling model loop is unnecessary. The main agent's actual reply enters normal channel history for follow-ups. Scheduled and proactive agent output follows the same reply boundary, subject to its separate eligibility and silence policies.

### 2.4 One-level delegation and bounded outstanding work

The configurable initial maximum is five outstanding main-agent-spawned subagent runs per chat, counting queued and running runs. Terminal runs do not count. At capacity, the main agent reports the limit rather than accepting another delegation, whether the user requested delegation or the main agent chose it. A new subagent spawned by a main-agent continuation uses the same quota.

Scheduler-started recurring and proactive runs are excluded from this delegation quota. Each user-created scheduled occurrence starts one independent background agent run; distinct occurrences of the same saved task can run in parallel without checking whether the previous occurrence is queued or running. The [task design](../design/tasks.md) owns saved-schedule limits, due-occurrence admission, scheduled retries, and the separate proactive policy. Global capacity remains open.

Only main-agent turns can delegate. The subagent tool subset and backend authorization prevent nested subagents. A later main-agent turn may start another top-level run without creating another delegation level.

Background research, subagent, and proactive runs receive useful authorized read, research, and code-execution tools and shared personal memory read access. They cannot change settings, connections, personal memory, or saved user tasks, or directly send messages. Backend checks enforce these capability limits without arbitrarily reducing investigation ability.

### 2.5 Job records without a parent-request lifecycle

Application-owned tables in the [shared PostgreSQL database](0013-shared-postgresql-storage.md) record real job states, results, and stable original-request correlation needed for routing, status, cancellation, and admission. Mastra owns separate tables for its messages and memory; backend authorization governs both. BullMQ with Redis provisionally owns timing, dispatch, claims, and configured job retries; Mastra executes the claimed run. Saved recurring tasks retain their own lifecycle, distinct from execution runs.

The main agent reasons from context and actual child statuses to decide whether the user's request is answered. Phase 1 defines no overall-request finished flag, mandatory dependency graph, workflow checkpoint, or parent cancellation hierarchy. A status claim must use actual job-status tools. Cancellation requested does not mean execution has stopped; current permission, channel, cancellation, and delivery checks still apply.

## 3. Rationale and alternatives

**Direct chat keeps the initial execution path small.** A durable chat queue, replay engine, outbox, or checkpoint system would strengthen interruption recovery but adds mechanisms beyond the accepted Phase 1 guarantee. The accepted reply-loss limit keeps that trade-off explicit. Demonstrated reliability, capacity, rate-limit, or other concrete requirements can justify revisiting dispatch while preserving the agent logic and required correctness checks.

**Ordered turns keep one conversation coherent.** Serializing foreground turns avoids concurrent inference using incompatible channel context. Background subagents free that foreground for new questions, while pending events preserve turn boundaries without requiring mid-turn steering.

**Main-owned replies preserve the full request.** Child findings may need fresh evidence, calculations, or another child's result before they answer the user. Posting every child report directly would expose incomplete work and split response authority. A fresh main-agent turn can assess current context and permissions and produce one useful chat reply when appropriate.

**Actual jobs provide enough execution state.** Context and job-status tools support agent-led completion decisions without a second parent workflow lifecycle. The five-run limit bounds main-agent delegation while scheduler-started occurrences follow their own admission policy. One-level delegation keeps admission and tool authority enforceable at the main-agent boundary.

## 4. Consequences and open implementation choices

- **Shared infrastructure:** retain the shared Mastra regular `Agent` direction, fresh trusted per-run context, E2B isolation, and backend-held credentials. Logical channel ordering does not select a deployment topology.
- **Continuation:** completion must reach the channel handler using trusted stored bindings. Pending-event representation, replica coordination, listener integration, and interruption handling remain open; this record does not promise durable chat replay or exactly-once external delivery.
- **Durability:** background results and required files persist outside disposable workers and sandboxes. PostgreSQL hosting, detailed table schemas, file storage, retention, and unresolved recovery mechanics remain open. The task design owns accepted scheduled retry and proactive failure policies; unscheduled one-off retry details remain open.
- **Authority:** subagent output is untrusted evidence within its assigned purpose. Backend capability checks, current permissions, channel validity, cancellation checks, and existing delivery controls remain required.
- **Capacity:** five outstanding main-agent-spawned queued or running subagents is the initial configurable per-chat limit. Scheduler-started runs are excluded. Global capacity and cancellation mechanics remain open.
- **Hosting:** direct execution after transport receipt needs suitable CPU and service lifetime. [Cloud Run's background-activity guidance](https://docs.cloud.google.com/run/docs/tips/general#background_activity) illustrates this constraint; no hosting choice is selected.
