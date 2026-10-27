# MyStacks custom runtime architecture

## 1. Direction and scope

**Accepted direction:** MyStacks builds its custom runtime with **Mastra**, runs it on shared application workers, persists user state outside worker processes, and uses durable scheduled jobs to trigger background work. **E2B is the chosen target for isolated generated-code execution. BullMQ with Redis is the provisional scheduling and queue technology.** Hosting, package versions, model providers, interfaces, and detailed operating policies remain open. No runtime implementation exists in this repository.

Phase 1 provides financial information, analysis, and proactive monitoring through **read-only financial access**. It excludes specific buy, sell, or rebalance recommendations and financial execution. Reports, memory, informational tasks, and messages remain in scope. The runtime must support flexible work within wealth and assets, useful partial answers with explicit data gaps, user-defined ongoing tasks, daily morning digests, and useful independent initiative.

Phase 1 monitoring starts with checks **every couple of hours or daily**, with exact per-task cadence and timezone behavior open. Checks and delivery are best effort. Precision takes priority over recall; some events may be missed. Hosting and queue choices do not strengthen these limits.

Launch planning assumes **1,000 users**, with a **100,000-user growth target**. Whether these figures mean registered or active users remains undefined. They do not determine concurrent workload or worker count.

[Requirements](requirements.md) owns product behavior. Decision rationale belongs to the [runtime ADR](ADRS/0001-custom-runtime-and-orchestration.md), [credentials ADR](ADRS/0002-backend-owned-financial-credentials.md), [code execution ADR](ADRS/0003-sandboxed-code-execution.md), [scheduling ADR](ADRS/0004-durable-scheduling-and-queued-execution.md), [Mastra framework ADR](ADRS/0005-mastra-runtime-framework.md), and [agent capabilities ADR](ADRS/0006-composable-agent-capabilities.md). This document owns component responsibilities and execution flows.

The [user stories](user-stories/README.md) describe the complete Phase 1 experience. The [detailed technical designs](design/README.md) develop supporting contracts within this architecture, with proposed choices and unresolved policies kept explicit.

## 2. Components and responsibilities

### 2.1 Canonical terminology

| Term | Meaning |
| --- | --- |
| **MyStacks backend** | Trusted application code that provides orchestration, runtime execution, tools, authorization, and durable state access. These responsibilities need not be separate services. |
| **Existing agentic runtime** | The shared-machine approach represented by `mystacks-be` and `hs-llm-service`, where application orchestration handles conversations and trusted tools execute on shared compute. The approach can support the requirements; the reference implementations do not establish that all required features exist. |
| **Orchestration layer** | Binds incoming work to an authenticated user, routes chat and background jobs, and delivers progress and results to authorized product surfaces. |
| **Custom runtime** | MyStacks-owned application built with Mastra's regular `Agent` and native context, tool, skill, and memory facilities. A runtime run is an invocation of this software, not a permanent process assigned to a user. |
| **RequestContext** | Mastra's per-request context. MyStacks creates a fresh instance for each run and binds authorized user, resource, and thread identifiers from trusted backend context. It is distinct from durable memory. |
| **Worker** | A long-lived MyStacks application process that claims queued jobs and runs work. It can handle concurrent runs with separate user contexts; it is not a cloud resource created for each job. |
| **Task** | A durable standing request with intent, current status, user, trigger, and delivery destination. It remains distinct from the attempts that execute it. |
| **Schedule** | A durable definition of when an informational task becomes eligible to run. |
| **Job** | A queued unit of work that a worker claims for execution. A schedule can produce many jobs over time. |
| **Run attempt** | One execution of queued work, with its own progress and outcome. Retrying work does not create a new standing task. |
| **Skill** | Instructions that guide the runtime's work. A skill does not execute code by itself. |
| **Tool** | An executable capability exposed to the runtime, such as an authorized financial read or isolated code execution. |
| **Financial tools API** | The backend boundary that authorizes financial reads, uses connected-account credentials, and returns evidence to the runtime. |
| **Execution sandbox** | An isolated E2B environment for generated code and selected input belonging to one user's task or analysis session. It does not own the agent loop or schedules. |

### 2.2 Logical ownership

| Owner | Responsibility |
| --- | --- |
| Orchestration layer | Authenticate channel and website requests; establish trusted user context; route work; recheck current permissions, task status, and destination before delivering task results and notifications. |
| Custom runtime | Use Mastra to execute the agent loop, load relevant context and memory, and compose skills and tools; apply MyStacks financial logic and output limits; check results; maintain informational tasks and required outputs through durable state interfaces. |
| Task boundary | Persist standing task intent, status, user, trigger, and destination separately from execution attempts; apply task-management policy. |
| Scheduling and queue layer | Persist scheduling and queue state, produce eligible jobs, and coordinate worker claims. It triggers runs rather than reasoning about a user's portfolio. |
| Worker | Execute claimed work through the runtime or a predefined calculation, with the bound user context and configured concurrency. |
| Financial tools API | Verify user, account, and object access; use backend-held credentials; return the shared financial evidence contract to authorized product consumers. |
| E2B execution tool | Accept generated code and selected input; enforce sandbox network and resource policy; return outputs, errors, and artifacts; persist required artifacts and terminate the disposable sandbox when analysis ends. |
| Hosting providers | Supply the selected compute, isolation, storage, and network capabilities. MyStacks retains responsibility for application behavior and authorization. |

The orchestration layer and custom runtime remain logically distinct even when they share a deployment. Routing work to the correct user does not require a separate LLM. Shared compute may be a fleet of processes or machines; it does not imply one large server.

The service deploys common runtime code, curated tools, and skills. User preferences, task instructions, memory, and conversation context vary through durable user-scoped state. The runtime composes these capabilities for financial work without requiring a new hard-coded intent for each analysis. Data coverage and method correctness still limit which analyses it can complete. The [agent capabilities ADR](ADRS/0006-composable-agent-capabilities.md) defines this composition and keeps a credential-injecting API proxy as a future option for demonstrated tool gaps.

### 2.3 Mastra framework boundary

The runtime uses Mastra's **regular `Agent`**, native tool registration, skills, context management, and memory facilities instead of building equivalent engines. Mastra provides agent execution and integrates AI SDK provider interfaces and adapters for model access. MyStacks owns user authentication, user/account/object authorization, financial domain logic, task behavior, notification and delivery controls, data accuracy, and retention. [Mastra agents](https://mastra.ai/docs/agents/overview), [Model providers](https://mastra.ai/models)

A common `Agent` definition can serve many users. Each run receives a **fresh trusted `RequestContext`** and authorized resource and thread bindings; the model cannot choose or replace the user binding. MyStacks must configure and validate those bindings on every entry path. Identifiers and framework storage scopes alone do not confer user permissions. Private run context must not be stored in shared mutable fields on agent definitions. [Request context](https://mastra.ai/docs/server/request-context)

Mastra loads curated skill folders containing `SKILL.md` and any references or scripts. Backend tool modules are explicitly registered trusted code; their availability may vary by authorized user context. Loading a skill does not grant tool rights or execute its scripts or backend code. MyStacks may use native tool hooks and processors for policy and observability, while protected-action authorization remains inside tool handlers or the financial tools API on every path. [Skills](https://mastra.ai/docs/skills), [Filesystem skills](https://mastra.ai/docs/sandbox/skills)

Existing SDKs and native adapters should be used directly when they meet the contract. The E2B execution tool is a necessary application boundary for authorized user data, outbound access, sandbox lifecycle, and artifact persistence. It may use `@mastra/e2b` or the direct E2B SDK; that adapter choice remains an implementation detail. A static shared workspace or live sandbox must not expose private files or execution state across users. [Mastra E2B integration](https://mastra.ai/integrations/sandboxes/e2b)

## 3. Execution flows

### 3.1 Conversation and continued work

The [architecture diagram](architecture.html) visualizes this flow and the trusted backend boundary. Open the HTML file in a browser to view it.

```mermaid
flowchart LR
    U["User message"] --> O["Orchestration layer"]
    O --> R["Shared custom runtime built with Mastra"]
    R <--> D["Durable user-scoped state"]
    R <--> F["Financial tools API"]
    F <--> P["Financial providers"]
    R <--> E["E2B execution tool"]
    E <--> S["Task-scoped execution sandbox"]
    R --> O
    O --> U
```

The orchestration layer establishes trusted user context before routing work. For each run, it supplies fresh `RequestContext` and authorized resource and thread bindings. Mastra loads the configured history and memory and runs the agent with the available skills and tools. Exact interfaces and whether chat runs enter through the queue remain open.

For deeper work, the runtime can produce a useful initial response and continue analysis, with progress and final results delivered through the product's messaging path. Required conversation state, task progress, and outputs must survive the worker process that handled them.

### 3.2 Scheduled and proactive work

```mermaid
flowchart LR
    T["Durable task intent, status, user, trigger, and destination"] --> Q["BullMQ job scheduling and queue<br/>Redis: provisional backing store"]
    Q --> W["Shared workers claim eligible jobs"]
    W --> R["Predefined monitoring or budgeted Mastra analysis"]
    R <--> D["Durable user-scoped state"]
    R --> O["Orchestration and authorized delivery"]
```

Task intent, current status, user, trigger, and delivery destination persist between runs. Run attempts retain their own progress and outcomes without replacing the standing task. **No LLM needs to keep thinking between runs.** Under the provisional technology choice, BullMQ Job Schedulers produce jobs from repeat settings, and workers claim eligible work. MyStacks uses that scheduling capability rather than building a separate scheduler engine. Current BullMQ does not require a separate legacy `QueueScheduler`. [Job Schedulers](https://docs.bullmq.io/guide/job-schedulers/), [QueueScheduler](https://docs.bullmq.io/guide/queuescheduler)

The queue owns scheduled-job eligibility and job retries; Mastra performs agent execution inside a claimed job. Mastra scheduling or background retry must not independently manage the same work. Advanced facilities such as `AgentController`, durable agents, workflows, or signals may be adopted when a concrete requirement needs them; they are not required by the framework selection.

A schedule establishes eligibility, not an exact execution instant. BullMQ can produce recurring jobs less frequently when preceding work has not begun processing because workers or concurrency are insufficient. Recovery, retry, overlap, pause, cancellation, and duplicate-notification semantics need explicit policies; the architecture does not promise exactly-once execution or delivery. [Job production behavior](https://docs.bullmq.io/guide/job-schedulers/)

Risk alerts, morning digests, flexible user-defined tasks, and independent useful initiative use the same financial authority and notification controls. **Routine monitoring uses inexpensive predefined reads and calculations** without a full agent run. Research and flexible or deeper analysis invoke Mastra when needed. Monitoring, agent runs, and sandbox execution must have resource budgets; their limits and behavior on exhaustion remain open. Data collection, risk calculations, agent analysis, and message delivery remain distinct responsibilities whose exact placement is open.

Before delivering task results, the orchestration layer rechecks current permissions, task status, and destination. Queued task data and permissions captured at run start do not establish delivery authority. Policies must define how edits, pauses, retries, and repeated delivery affect in-flight work; exact cancellation, recovery, and duplicate-handling rules remain open.

Users must be able to change or pause ongoing tasks and notifications. Task pause, account disconnection, and worker shutdown are separate actions. Pausing a task does not delete its durable state. Notification frequency controls must preserve low-noise behavior and the accepted precision and monitoring limits.

### 3.3 Generated-code analysis

When an analysis needs generated code, the runtime calls the **E2B execution tool**, a trusted backend adapter:

1. The runtime prepares code and selects the input needed for one user's task.
2. The adapter creates or reuses an isolated sandbox bound to that user's task or analysis session and supplies the selected input.
3. E2B executes the code and returns outputs, errors, and artifacts through the adapter.
4. The runtime checks the result, may revise and rerun the code, and then uses supported findings in its answer.
5. MyStacks persists required reports, files, and results outside the disposable sandbox.
6. The adapter terminates the disposable sandbox when the analysis ends, after required artifacts have been persisted.

A live sandbox must not be reused across users. Reuse within one user's analysis session is permitted. **Outbound internet is disabled by default for financial analysis**; trusted backend tools supply required financial and research data. Any task-specific network exception must be explicit in backend policy. Credentials must not enter the sandbox through mounts, environment variables, files, code, or results.

Sandbox pause is not a deletion action. Session limits, interruption cleanup, permitted pause/resume use, and provider retention and deletion behavior remain open within the persist-then-terminate default. E2B supplies isolated code execution and environment management; the Mastra agent loop stays in the shared backend, which also retains scheduling responsibilities. [E2B documentation](https://docs.e2b.dev/), [Sandbox lifecycle](https://docs.e2b.dev/sandbox)

## 4. Durable state and continuity

### 4.1 State ownership

| State | Logical owner |
| --- | --- |
| Identity, connected-account bindings, and financial credentials | MyStacks backend account and authorization boundary. |
| Portfolio observations and evidence used by the portfolio website, chat, reports, and digests | MyStacks backend financial data boundary, separate from personalization memory. |
| Conversation history, context summaries, memory, and user preferences | Runtime state boundary using Mastra memory and storage facilities, stored durably and scoped to the user. MyStacks owns memory policy. |
| Standing task intent, current status, user, trigger, and delivery destination | Task boundary, with one authority for each record. |
| Schedule eligibility, queue claims, and run-attempt progress and outcomes | Scheduling and execution boundaries, distinct from the standing task, under the provisional BullMQ + Redis choice. |
| Required working files, reports, and generated artifacts | Durable user-scoped storage, accessible through authorized product interfaces. |
| Notification preferences and delivery records | MyStacks backend delivery boundary. |

These are logical responsibilities, not a settled database schema. Concrete records, storage engines, and synchronization interfaces remain open. An application database and Redis must not become independent authorities for the same schedule; the implementation must define ownership and any derived scheduling state before introducing copies.

The financial tools API returns a consistent evidence contract for portfolio surfaces and analysis: **source, as-of time or unknown freshness, coverage gaps, and native values and units**. Conversions and aggregation must retain the evidence needed to interpret the result. Missing data remains explicit; it must not become a zero balance or absence of risk. Exact schemas, collection ownership, reuse, and claim-specific freshness policies remain open.

### 4.2 Memory policy and user control

MyStacks reuses **Mastra message history, working memory, and storage adapters** with explicit durability and user/thread scopes. Structured preferences and goals must use a backend-owned write policy and validated tools for model-initiated changes. The schema and native configuration for controlling those writes remain open. Live holdings and account permissions come from fresh backend evidence; remembered information cannot override them. [Working memory](https://mastra.ai/docs/memory/working-memory)

Automatic observations and semantic recall are optional capabilities, not selected memory policies. Their storage adapters, enabled layers, and update rules remain implementation decisions. Prompt trimming changes what enters a model request; it does not delete stored information. Forgetting must cover every enabled derived layer, including profiles, summaries, and vectors, as well as source records where required. Inspection, correction, deletion controls, and retention rules remain open.

### 4.3 Process and sandbox lifecycle

Authoritative conversation, memory, task, and file state lives outside worker processes. A worker may keep temporary context during a run, and an execution sandbox may keep temporary analysis files, but neither replaces durable user-scoped state.

Workers can restart or be replaced without assigning a permanent machine to each user. Application health, interrupted-run recovery, state compatibility, backup/restore, export, and deletion still need policies. Durable state does not by itself settle whether an interrupted run resumes, restarts, or reports failure.

When chat and background runs update the same user's memory or tasks, their updates must preserve consistent user state. The concurrency and ordering policy remains open; a worker or sandbox boundary alone does not settle it.

## 5. Authorization and isolation

### 5.1 Trusted financial access

`check_binance_balance` calling `GET /agentic/binance/balance` is an **illustrative interface**, not an implemented or fixed API contract:

1. The runtime invokes the tool with trusted execution context bound to the authenticated user.
2. The backend authorizes the user, account, and requested object for that protected action. Model-supplied identifiers do not establish authority.
3. The backend adapter retrieves the exchange credential and calls the provider.
4. The tool returns authorized data through the shared financial evidence contract.
5. The runtime answers from that evidence and identifies partial or uncertain conclusions.

The same checks apply to chat, scheduled jobs, and independent analysis. Runtime authentication, token lifetime, revocation, and interfaces remain open.

**Exchange keys, refresh tokens, organization database credentials, and E2B management keys remain in trusted backend code and tool adapters.** They must stay out of model prompts, `RequestContext`, durable job or workflow inputs, traces, generated code, tool results, sandbox mounts, sandbox environment variables, sandbox files, and sandbox outputs. Trusted backend runtime code may use the SDK credentials needed to operate its tools; its model and generated code do not inherit that authority.

The model accesses private backend data through narrow authorized tools, so it has no default ability to read database credentials. To exclude even worker-process access, a separate financial service would hold credentials and permissions would deny the worker access to the credential store. That deployment topology remains open.

### 5.2 Generated-code boundary

Shared workers execute trusted application code and predefined tools. They must not directly execute generated shell, Python, `eval`, or untrusted plugins. Trusted predefined calculation tools can run in the normal backend process; generated code uses the E2B execution boundary.

The architecture does not require an always-on VM or separate kernel for each user. E2B's isolated Linux VM for an execution session is compatible with shared runtime compute. Isolation must be assessed against the selected provider configuration; separate directories in a shared process are not an isolation boundary for generated code. [E2B sandbox model](https://docs.e2b.dev/sandbox)

The adapter must limit selected data and execution resources to the task's needs and enforce the outbound-internet-off default for financial analysis. Exact enforcement, network-exception policy, resource limits, and deadlines remain open. Selected financial data remains sensitive after credentials are removed. Sandbox isolation does not replace backend authorization or prevent allowed code from reading data supplied to it.

### 5.3 Provider trust

Model providers receive the context MyStacks sends. E2B receives selected code and analysis data. Shared hosting and storage providers process the application state they host. Provider security evidence, data terms, processing regions, operator access, network controls, retention, deletion, and export must be evaluated for the chosen configuration before admitting customer financial data.

Choosing E2B as the execution target does not settle those checks. Encryption at rest or a marketing security claim does not establish that a provider cannot access plaintext during processing.

## 6. Operations and capacity

### 6.1 Shared workers and hosting

BullMQ supports concurrency within a worker and across multiple worker processes. Worker count and concurrency must reflect resource use, job duration, and external service limits. [Worker concurrency](https://docs.bullmq.io/guide/workers/concurrency)

**10,000 schedules do not require 10,000 processes.** Capacity planning depends on schedule frequency, average and peak run duration, simultaneous eligibility, and model, financial provider, and sandbox limits. Shared public market data may be reused across runs while private financial reads retain per-user authorization; data reuse and freshness rules remain open.

Warm workers avoid creating a new application container for every job. Jobs can still wait for available capacity, and additional workers still take time to start. Neither shared workers nor a hosting platform provides unlimited scaling or exact-time execution.

Mastra supports self-hosting in compatible application environments, including a deployment on GCP. Cloud Run worker pools are one possible hosting option, not a selected deployment. **Bun and DeepSeek are compatible candidates**, not selected production runtime or model contracts. Provider, regions, process topology, capacity management, fairness, quotas, and cost targets remain open. [Mastra deployment](https://mastra.ai/docs/deployment/overview), [DeepSeek provider](https://mastra.ai/models/providers/deepseek)

### 6.2 Deployment and future boundaries

Common runtime code, tools, and skills deploy to the shared fleet; user configuration remains external to those deployments. MyStacks still needs policies for in-flight work on old code, worker restarts, and compatibility with durable state.

The selection covers **open-source Mastra core**. Mastra cloud and enterprise features are optional and imply no purchase. Package versions and feature license compatibility must be checked when the implementation is pinned.

A persistent isolated agent may be reconsidered if installed user code or process continuity becomes a requirement, or if adopting a personal runtime saves enough engineering to justify its operating model. That would require new lifecycle, security, and integration decisions. A single-user runtime such as OpenClaw must not be assumed to provide the trust boundaries of this shared multi-user backend.

## 7. Open decisions

| Area | Decision still needed |
| --- | --- |
| Framework implementation and interfaces | Mastra package versions, model/provider configuration, chat routing, continued work, native adapters, and any requirement for advanced execution facilities. |
| Scheduling technology | Confirm or replace provisional BullMQ + Redis; settle durable configuration and the authoritative task/schedule record contract. |
| Run semantics | Policies for retries and recovery, overlapping runs, task edits and pauses during execution, cancellation, and duplicate-notification handling. |
| Hosting and capacity | Provider, regions, worker topology, concurrency, scaling, resource fairness, quotas, resource-budget limits, and operating cost. |
| E2B configuration | Templates, data transfer, enforcement of default network isolation and any permitted exceptions, resource limits, session lifetime, interruption cleanup, permitted pause/resume use, and required provider evidence and terms. |
| Persistence and portability | Mastra storage adapters and user/thread scopes, other storage engines and formats, retention, backup/restore, export, deletion, and state compatibility. |
| Financial evidence and proactivity | Evidence schemas, collection ownership, public data reuse, valuation and risk methods, claim-specific freshness, per-task cadence and timezone behavior, digest timing, independent triggers, and notification frequency controls. |
| Personalization | Memory schema, validated writes, automatic observations and recall, enabled derived layers, user controls, and task and preference interfaces. |
| Security and product enforcement | Runtime authentication, credential storage, permission boundaries, domain enforcement, and informational output controls. |
| Operations | Observability for runs, tool calls, queue delay, costs, and deliveries; deployment and interrupted-run policies. |
| Business assumptions | Registered versus active user targets, workload distribution, geographic scope, and per-user cost limits. |

These decisions refine the accepted direction within Phase 1 authority and monitoring limits. They do not constitute an implementation plan.
