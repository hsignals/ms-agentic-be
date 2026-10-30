# Cloud Run worker pool for background execution

## 1. Status and scope

**Status: ACCEPTED initial worker hosting, deployment separation, manual scaling, and measurement-first capacity policy.** MyStacks runs background queue consumers in a Google Cloud Run worker pool, separately from the API/chat deployment. The overall architecture remains tentative, and this decision does not claim an implemented or provisioned service.

The [architecture](../architecture.md) owns execution responsibilities. The [channel-turn decision](0009-channel-turns-and-background-subagents.md) owns direct chat and main-agent continuations; the [scheduling decision](0004-durable-scheduling-and-queued-execution.md) owns task admission and retry policies. BullMQ is the **initial queue baseline**, with provisional Redis integration. One PostgreSQL database for separate application and Mastra records and E2B for generated-code execution remain accepted.

## 2. Decision

### 2.1 Separate background deployment in one backend codebase

Use a **Cloud Run worker pool** for main-agent-delegated subagents, requested scheduled occurrences, and proactive investigations. The worker pool runs continuous background consumers without an HTTP ingress endpoint; it does not host incoming API/chat traffic. Google documents worker pools as [continuous background resources without a load-balanced endpoint](https://docs.cloud.google.com/run/docs/deploy-worker-pools).

Keep the same backend codebase with distinct **API/chat and worker entrypoints**. The deployments may reuse one container image with different entrypoints; this decision does not require separate repositories or a microservices rewrite. Both paths use the same protected application operations and trusted account/channel bindings.

Normal chat continues directly in the backend after verification, persistence, and transport acknowledgement, without a durable chat queue. Initially, **one active ordinary API/backend process** handles all users and channels concurrently, with one foreground main-agent turn per channel. User messages and background completions enter the same channel handler under the [channel-turn decision](0009-channel-turns-and-background-subagents.md).

The chat coordinator uses simple stop/start deployment and accepts brief traffic interruptions. Cross-replica chat coordination and custom switching or zero-downtime mechanisms are deferred until an observed need justifies them. The API/chat hosting product, CPU availability after acknowledgement, and service lifetime remain open. This initial coordinator policy does not constrain the separate background worker pool to one instance.

### 2.2 Small running capacity with manual scaling

Start with **one or two running container instances**, with the exact initial count chosen during capacity configuration. Adjust that count manually as demand requires. Cloud Run supports [changing the instance count without redeployment and bills requested instances even when idle](https://docs.cloud.google.com/run/docs/configuring/workerpools/manual-scaling). Worker instances receive CPU throughout their running lifetime under the [container contract](https://docs.cloud.google.com/run/docs/container-contract).

The **pool instance count** controls running containers. The **worker job concurrency** controls how many queued jobs an application worker processes concurrently; BullMQ documents [local concurrency and multiple workers](https://docs.bullmq.io/guide/workers/concurrency) as separate controls. Neither value is the five-outstanding-subagents-per-chat admission limit. Select job concurrency, CPU, and memory from observed run demand and model/provider quotas; this decision establishes no user-capacity claim.

Manual scaling is the initial operating choice. Google also documents [external-metric autoscaling through a separately deployed autoscaler](https://docs.cloud.google.com/run/docs/configuring/workerpools/crema-autoscaling); adopting that mechanism requires a concrete capacity need and its own configuration.

Use **configurable execution limits** to bound run length and resource use, reusing native SDK controls where they meet the requirement. The backend records each run's duration, model usage, and actual outcome. Operators observe queue delay and resource use alongside those records to adjust worker instance count and job concurrency manually. Exact limits remain provisional until representative jobs provide evidence. A per-user spending budget system is deferred until actual usage justifies it.

### 2.3 Durable results and main-agent continuation

Workers claim background jobs, execute Mastra runs, and save actual status and internal results in application-owned PostgreSQL records. The coordinator resolves completion through trusted stored bindings. User-requested work returns to its originating channel; proactive completion serves the selected eligible destinations from one saved investigation under the task delivery policy. An idle destination channel starts a new main-agent turn; a busy channel retains the completion for a later turn. The main agent owns every agent-authored user reply.

Workers persist their results before completing BullMQ jobs. The single active API/backend coordinator subscribes to **native BullMQ `QueueEvents` completion notifications** and resolves the saved result through trusted bindings. PostgreSQL remains authoritative for job state and results. The [channel-turn decision](0009-channel-turns-and-background-subagents.md) owns notification and selective result retrieval. Exact listener integration, pending-event representation, recovery of saved unhandled results, event retention, and duplicate-delivery handling remain open; event receipt does not establish exactly-once delivery.

### 2.4 Instance lifecycle and interrupted jobs

A running instance avoids provisioning a container for every job, but startup, replacement, queue backlog, sandbox startup, and provider latency can still delay execution. A Cloud Run instance lifecycle is distinct from a BullMQ job lifecycle.

Cloud Run can interrupt a processing worker and sends `SIGTERM` **10 seconds before `SIGKILL`**, as specified in its [worker-pool container contract](https://docs.cloud.google.com/run/docs/container-contract). That interval cannot guarantee completion of an expected 5–10-minute run during deployment or replacement.

The [scheduling decision](0004-durable-scheduling-and-queued-execution.md) owns interruption recovery. Reuse a completed result without rerunning successful work. Otherwise, when interrupted requested background work remains active and authorized, restart the whole job from the beginning within **at most two whole-job attempts in total**. That shared attempt budget includes any retry for a known temporary scheduled-execution failure. Cancelled work and work whose authority has been revoked do not restart. An interrupted proactive investigation waits for the next scheduled check.

The design does not use in-agent checkpoints, replay, or resumption. Exact BullMQ attempt accounting, recovery mechanics, stopping behavior, and duplicate-result handling remain open within the accepted policy.

## 3. Rationale and trade-offs

Independent background capacity from the beginning keeps long-running queued work separate from API/chat capacity. Continuous consumers fit the queue-driven execution model while retaining the shared backend runtime and application boundaries. Manual scaling keeps the initial operating model small until observed load justifies more machinery.

**Measure representative work before fixing capacity limits.** Configurable bounds and run-level measurements make resource use visible while the workload is still being established. The policy accepts provisional limits and manual tuning in exchange for avoiding a per-user spending budget system before actual usage establishes its need. Native execution controls provide the initial bounds; measurement does not depend on a paid tracing service or select extra optimization machinery.

A combined API/chat and worker deployment would have fewer deployment settings, but would tie their instance capacity and process lifecycle together. The selected split accepts an extra entrypoint and deployment plus permissions, network connectivity, and shutdown operations. Running worker instances incur idle cost, and replacement still has startup delay. Worker code and configuration deployments create [new Cloud Run revisions](https://docs.cloud.google.com/run/docs/deploy-worker-pools); they do not guarantee that active application jobs finish uninterrupted.

## 4. Remaining decisions and acceptance evidence

- **Configuration:** select the worker region, exact initial instance count, CPU, memory, job concurrency, deployment identity and permissions, and connectivity to Redis, PostgreSQL, and required backend operations. Measure representative jobs before fixing exact execution limits. Redis and PostgreSQL hosting remain open.
- **API/chat:** select its hosting product and configuration, execution support after transport acknowledgement, and integration of the coordinator's selected `QueueEvents` listener and pending-completion handling. Cross-replica chat coordination is deferred under the initial single-active-process policy.
- **Recovery:** settle exact BullMQ attempt accounting, recovery mechanics, stopping behavior, duplicate-result handling, and remaining one-off failure retry details within the accepted whole-job restart, result-reuse, and proactive policies.
- **Capacity evidence:** exercise both entrypoints, queue claiming, independent instance-count and job-concurrency settings, retained results, and a completion returning to a new ordered main-agent turn. Record run duration, model usage, and outcome; use queue-delay and resource-use observations to tune capacity manually. Observe deployment/replacement interruption under the selected policy before claiming recovery or capacity guarantees.
