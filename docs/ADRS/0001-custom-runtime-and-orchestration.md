# Shared custom runtime and orchestration

## 1. Status and scope

**Status: ACCEPTED architecture decision.** MyStacks uses a common Mastra-based custom runtime and curated tools in shared application workers, with direct normal-chat execution, queued background work, and durable user-scoped state outside those workers. This records the design, not an implemented service or a selected worker-hosting provider.

The [requirements](../requirements.md) own product behavior, and the [architecture](../architecture.md) owns responsibilities and flows. This decision preserves Phase 1 informational work, read-only financial access, and the exclusion of specific investment recommendations.

## 2. Decision

The **orchestration layer** binds incoming work to an authenticated user, routes that work, and delivers progress and results. The **custom runtime** uses Mastra's regular `Agent` and core facilities to execute the agent loop, load context, apply skills, and select and compose tools. These are logical application responsibilities and may share a deployment. The [framework decision](0005-mastra-runtime-framework.md) owns the selection rationale and adoption scope.

Shared workers run MyStacks application code and can serve different users across separate runs. The pool may span multiple hosts. A run does not require a permanent machine for its user or a new infrastructure job for every task.

Normal chat initially runs directly in the backend after inbound verification, storage, and transport acknowledgement. Each linked channel has one logical ordered event stream and one foreground main-agent turn at a time. A turn can contain several model/tool rounds. Substantial work uses explicitly delegated background subagents so the foreground can finish and handle new questions.

Background completion returns internal findings to a **new main-agent turn** through the same channel handler. The main agent can investigate further, combine results, or delegate more top-level work and owns every agent-authored user reply. Actual background jobs have durable status and result records; the main agent judges the overall answer from channel context and those records. The [channel-turn decision](0009-channel-turns-and-background-subagents.md) owns these boundaries and the five-outstanding limit for main-agent delegation. Scheduler-started runs are outside that quota; the [scheduling decision](0004-durable-scheduling-and-queued-execution.md) owns saved-schedule limits, independent occurrences, and scheduled-execution retry policy.

Conversation history, context, memory, task definitions, progress, and required files must remain user-scoped in durable storage outside worker processes. Workers bind Mastra resource and thread identifiers from trusted backend context, load authorized state, and save required outcomes. Account-shared personal memory uses native Mastra structured working memory under the [shared-memory decision](0008-channel-scoped-work-and-shared-memory.md); native [Observational Memory compacts each channel's context](0010-native-channel-context-compaction.md). Main-agent turns control profile writes, including [profile-only forgetting](0011-profile-only-forgetting.md), under the accepted [last-successful-save rule](0012-last-save-wins-profile-updates.md). One [PostgreSQL database](0013-shared-postgresql-storage.md) holds separate application-owned and Mastra-owned tables, with backend authorization governing access. MyStacks still owns exact schemas, retention, task persistence, and recovery behavior.

The initial runtime and deployed capabilities are common across users; preferences and remembered context can vary by user. A **skill** supplies instructions, while a **tool** supplies executable capability. Relevant capabilities should compose through the common loop without a separate hard-coded intent for every workflow.

Trusted, predefined tools may execute in the shared backend. Generated code uses the [sandboxed code-execution boundary](0003-sandboxed-code-execution.md), and financial reads use the [backend-owned credential boundary](0002-backend-owned-financial-credentials.md). Ongoing work uses [durable scheduling and queued execution](0004-durable-scheduling-and-queued-execution.md).

## 3. Rationale and alternatives

### 3.1 Shared workers with durable user state

The product needs continuity and user-specific work, rather than one always-running process per user. Shared capacity lets idle users retain their work without retaining an idle runtime. External state also lets another worker continue a later run, while MyStacks remains responsible for storage, authorization, and recovery behavior.

The **existing agentic runtime** approach represented by `mystacks-be` and `hs-llm-service` is the simplicity reference for direct backend chat. MyStacks remains responsible for the required memory, tasks, monitoring, and recovery behavior.

### 3.2 A persistent runtime for every user

A dedicated environment can keep a user's files, local processes, and timers together. It is a viable choice when persistent environment behavior justifies its idle resources, fleet lifecycle, upgrades, and state operations. Current requirements do not require that ownership model or a separate Linux kernel per user.

A future persistent environment remains possible, but integrating its state, lifecycle, and authority would require design work. It is not supplied by the shared runtime automatically.

### 3.3 Adopting a complete agent system

A complete existing agent system may save work on memory, ongoing tasks, and recovery. Building only a custom loop, even inside an isolated environment, leaves those features to MyStacks. Reuse must be evaluated against the required product behavior and trust boundary.

For example, OpenClaw's [security trust model](https://docs.openclaw.ai/gateway/security/trust-model) treats one Gateway as one operator trust domain; shared Gateway authentication does not provide isolation between unrelated customer accounts. Adopting its features would still require a compatible deployment and authorization design.

## 4. Consequences and open decisions

- **Application ownership:** MyStacks integrates Mastra's context, memory, skills, and tool facilities while retaining responsibility for task records, recovery policy, financial behavior, and delivery.
- **User isolation:** every protected state or account operation must use authenticated server context and enforce user/object permissions. Shared execution requires that application boundary even when generated code runs elsewhere.
- **State consistency:** each channel serializes foreground turns. Native partial profile merges preserve distinct fields; the last successful save wins for the same field, including an older turn overwriting a correction or deletion. Background subagents read the profile without changing it.
- **Direct-chat limit:** process or deployment interruption may leave an acknowledged chat turn without a reply. Saved messages do not resume inference; hosting must support execution after transport acknowledgement.
- **Capacity:** warm capacity serves ready work without provisioning a worker per run. Queue backlog, worker replacement, and tool or model latency still affect response time.
- **Open details:** pinned Mastra packages and adapter APIs, reuse of existing code, worker hosting, cross-replica channel coordination, PostgreSQL hosting and schemas, background recovery, profile budgets, compaction thresholds and models, retention, and fleet capacity remain undecided.
- **Product limits:** shared execution does not strengthen monitoring guarantees or expand financial authority.
