# Mastra runtime framework

## 1. Status and scope

**Status: ACCEPTED framework selection and low-priority additive LangSmith tracing.** MyStacks builds its shared custom runtime with Mastra's regular `Agent` and core facilities, and uses E2B for isolated generated-code execution. BullMQ uses [dedicated GCP Memorystore for Valkey](0020-managed-valkey-queue-storage.md) for queue storage; exact package/client integration remains open.

This decision selects reusable runtime components, not a completed service or implementation plan. It preserves Phase 1 informational work, read-only financial access, the exclusion of specific investment recommendations, and the accepted best-effort monitoring limits. The [requirements](../requirements.md) own those product boundaries, and the [architecture](../architecture.md) owns component responsibilities and flows.

## 2. Decision

### 2.1 Shared Agent and explicit capabilities

Use a common Mastra `Agent` with curated tools and skills for direct API/chat execution and shared warm background workers. A [Cloud Run API service and separate worker pool](0017-cloud-run-worker-pool.md) use the same backend codebase with distinct entrypoints. The API service keeps CPU available after HTTP acknowledgement through instance-based billing. Each run receives backend-established user, resource, and thread bindings in private run context, without mutating shared Agent fields. No permanent runtime or VM is assigned to every user. Mastra's [Agent facilities](https://mastra.ai/docs/agents/overview) supply the loop and tool dispatch, while MyStacks supplies domain instructions and business behavior.

Reuse Mastra's skill folders, loading, and discovery. Register executable tool modules explicitly, then let the runtime select applicable tools dynamically. A `SKILL.md` file provides instructions and can supply provider SDK/API guidance; it cannot install a tool or grant permissions. Broad provider APIs, E2B shell/file/code tools, and backend web research can compose without a bespoke tool for every analysis. Mastra documents [filesystem skills and dynamic skill resolution](https://mastra.ai/docs/skills).

### 2.2 Context, memory, and execution

Reuse Mastra native structured working memory for an account-shared personal profile with a few stable categories and flexible free text. Use native [Observational Memory for token-budgeted per-channel compaction](0010-native-channel-context-compaction.md), supplying recent raw messages, channel compact notes, and the shared profile to the model. Stored raw history remains retained. Observational Memory does not automatically write the shared profile; main-agent turns control those writes under backend authority. Phase 1 provides neither vector retrieval nor cross-channel history retrieval. Backend code must bind the resource and thread for each run rather than accepting model-selected memory ownership. Mastra documents its [memory facilities and storage configuration](https://mastra.ai/docs/memory/overview).

Use the native PostgreSQL adapter with [one PostgreSQL database on a dedicated TimescaleDB-enabled Tiger Cloud service and separate ordinary application-owned and Mastra-owned tables](0013-shared-postgresql-storage.md). Native partial profile merges preserve distinct fields, while the [last successful save wins for the same field](0012-last-save-wins-profile-updates.md), including an older turn overwriting a correction or deletion. [Forgetting changes only the profile](0011-profile-only-forgetting.md) through its native update tool; channel histories and compact notes remain unchanged. MyStacks owns schema, budgets, retention, authorization, and integration within those accepted limits.

The [E2B decision](0003-sandboxed-code-execution.md) owns shell, file, and Python/JavaScript isolation. Prefer native [Mastra E2B workspace/tools](https://mastra.ai/integrations/sandboxes/e2b) and SDKs. Each foreground invocation or background attempt lazily creates one sandbox when needed and reuses it across successive calls; files persist for that run. The shared Mastra loop remains outside the sandbox, and generated commands/code cannot execute in the shared backend. Save required outputs before destroying the workspace. Whole-job retries start with a fresh sandbox, and main-agent continuation reads saved child results in its own run.

The [credential decision](0002-backend-owned-financial-credentials.md) keeps raw provider secrets outside sandbox environments, files, and prompts. **Credential brokering** uses native egress-proxy injection outside the VM for supported authentication and a user-bound backend read bridge for application signing or proxy-incompatible authentication. The [capability decision](0006-composable-agent-capabilities.md) owns **programmatic tool calling** through scripts and broad provider SDK/API access, with authorized current-user financial-data exposure accepted. Default-deny egress permits required provider endpoints under backend policy; general web research uses backend tools. Framework schemas, skill instructions, and Agent hooks cannot replace provider/backend permission checks. Exact workspace integration, native proxy compatibility and provider limits, bridge authorization, and network configuration remain open.

The initial adoption uses regular `Agent` execution for direct foreground chat and the [queued-work boundary](0004-durable-scheduling-and-queued-execution.md) for background runs. Workers save results before completing jobs; native BullMQ `QueueEvents` normally wakes the coordinator, while startup and periodic pending-completion checks recover missed wakeups. Both paths use the same ordered channel handler with current authorization, cancellation, and delivery checks. Empty checks make no model calls, and completed research is reused. A background completion supplies fresh input to a new main-agent turn, which can continue tool/model rounds and owns the user reply. The [channel-turn decision](0009-channel-turns-and-background-subagents.md) owns the pending/handled contract, its open mechanics, the absence of an exactly-once guarantee, and the accepted interrupted-chat limit. It does not select an exact Mastra dispatcher or require workflow checkpoints. Advanced execution facilities need a concrete requirement and a separate persistence and execution-ownership decision.

Only main-agent turns may delegate background subagents, with an initial five-outstanding limit per chat. Backend scheduling starts user-requested and proactive runs independently of that quota under the [scheduling decision](0004-durable-scheduling-and-queued-execution.md). Restricted tool capabilities and backend authorization preserve useful financial read, research, E2B, and shared personal-memory read access while preventing background agents from spawning children, changing settings, connections, memory, or saved user tasks, or sending user messages. Exact native configuration remains open.

### 2.3 Low-priority additive tracing

LangSmith tracing is a **low-priority observability integration** for diagnosing agent and tool execution. It adds diagnostics to the selected runtime rather than owning agent execution, scheduling, durable task state, authentication, or authorization. LangSmith Deployment is a separate product and is not selected.

Exact integration packages and versions, trace payloads, configuration, sampling, access, and retention remain open. The credential boundary applies to every trace: configuration must not intentionally include financial credentials, refresh tokens, database credentials, model keys, or E2B management keys. Raw provider secrets remain outside the sandbox; authorized financial data can appear in generated-code outputs and requires the selected provider-handling policy before export.

## 3. Rationale and alternatives

### 3.1 Reuse the components around the loop

The `mystacks-be` and `hs-llm-service` implementations use AI SDK automatic tool loops and provide a simplicity reference for direct backend chat. Choosing Mastra does not create agent reasoning or tool use that AI SDK lacks. It reduces MyStacks' assembly work for skill loading, context, memory, tool dispatch, and related runtime facilities.

Mastra uses AI SDK provider interfaces alongside its own Agent, memory, and runtime abstractions. Its [model integration](https://mastra.ai/models) supports AI SDK provider modules. MyStacks still owns financial tools, authorization, task behavior, storage policy, and delivery.

### 3.2 Continue with AI SDK directly

Continuing the existing AI SDK approach is viable and preserves familiar provider and tool-loop integration. MyStacks would assemble more of the surrounding skill, memory, and context behavior itself. Mastra is selected to reuse those facilities while keeping business logic in the backend.

### 3.3 Eve or LangGraph

Eve is a viable file-based framework using AI SDK. Its [self-hosting contract](https://eve.dev/docs/guides/deployment/self-hosting) requires a Workflow world designed for shared deliveries across replicas and schedule-runner coordination; its beta Workflow stack adds compatibility work. Its [getting-started requirements](https://eve.dev/docs/getting-started) specify Node.js 24 or newer, while Bun compatibility remains unverified for MyStacks. Using E2B for Eve's native sandbox facilities would require its [custom sandbox-provider boundary](https://eve.dev/docs/sandbox/custom-providers); a separate E2B analysis tool is also possible. Adopting Eve's Workflow operating model adds more infrastructure change than the selected shared-worker design needs.

LangGraph is a strong alternative when explicit graph checkpoints and interruption/resumption govern the workflow. Its [persistence](https://docs.langchain.com/oss/javascript/langgraph/persistence) and [interrupt](https://docs.langchain.com/oss/javascript/langgraph/interrupts) facilities support those requirements. Phase 1 has not established a need for that execution model.

### 3.4 Add diagnostics without changing execution ownership

Optional tracing can improve diagnosis while retaining the selected Mastra and shared-worker responsibilities. Its integration and data-handling work remain low priority; the trade-off is less detailed diagnostics until that work is justified. Adopting a separate deployment runtime for tracing would add execution ownership and operating changes beyond this decision.

## 4. Consequences and open decisions

- **Hosting and license:** the selected Cloud Run API service and separate worker pool use this project's own deployments, resources, identities, secrets, configuration, and pipeline; sibling projects supply reference conventions only. The worker pool starts with one or two running instances and manual scaling. Application restarts use native BullMQ shutdown/reconnection/stalled-job recovery with PostgreSQL and Valkey state retained separately. Stop/start downtime is accepted; exact Cloud Run configuration and preservation of one active coordinator during replacement remain open. Mastra's [license](https://github.com/mastra-ai/mastra/blob/main/LICENSE.md) places core code outside `ee/` under Apache-2.0, with separate terms for enterprise and third-party components. Enterprise features and hosted cloud services remain optional commercial choices.
- **Implementation validation:** pin and validate package versions, storage adapters, E2B integration, main/subagent tool configuration, fresh-turn completion input, and deployment compatibility during implementation. Framework selection does not establish that every feature has the same stability or operating guarantees.
- **Runtime and model:** Bun remains a runtime candidate requiring compatibility checks. DeepSeek is a supported model-integration candidate; no production runtime, model, provider, or gateway is selected by this decision.
- **Memory policy:** the [shared-memory decision](0008-channel-scoped-work-and-shared-memory.md) defines account-wide personal context and main-agent-controlled updates. Native per-channel compaction, profile-only forgetting, last-successful-save updates, and PostgreSQL storage have separate decision records above. Exact profile schema and budgets, compaction thresholds and models, retention, adapter/package versions, and framework integration remain open.
- **Security and correctness:** trusted identity binding, account/object authorization, credential brokering, the accepted current-user financial-data exposure limit, restricted egress, financial scope, and analysis validation remain MyStacks responsibilities.
- **Capacity:** selecting Mastra and E2B does not validate the 1,000-user launch or 100,000-user growth targets. Frequency, run duration, bursts, quotas, and operational evidence must determine capacity.
