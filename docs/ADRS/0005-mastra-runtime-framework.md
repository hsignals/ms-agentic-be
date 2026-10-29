# Mastra runtime framework

## 1. Status and scope

**Status: ACCEPTED framework selection.** MyStacks builds its shared custom runtime with Mastra's regular `Agent` and core facilities, and uses E2B for isolated generated-code execution. BullMQ and Redis remain the provisional scheduling and queue choice.

This decision selects reusable runtime components, not a completed service or implementation plan. It preserves Phase 1 informational work, read-only financial access, the exclusion of specific investment recommendations, and the accepted best-effort monitoring limits. The [requirements](../requirements.md) own those product boundaries, and the [architecture](../architecture.md) owns component responsibilities and flows.

## 2. Decision

### 2.1 Shared Agent and explicit capabilities

Use a common Mastra `Agent` with curated tools and skills in shared warm workers. Each run receives backend-established user, resource, and thread bindings in private run context, without mutating shared Agent fields. No permanent runtime or VM is assigned to every user. Mastra's [Agent facilities](https://mastra.ai/docs/agents/overview) supply the loop and tool dispatch, while MyStacks supplies domain instructions and business behavior.

Reuse Mastra's skill folders, loading, and discovery. Register executable tool modules explicitly, then let the runtime select applicable tools dynamically. A `SKILL.md` file provides instructions; it cannot install a tool or grant permissions. Mastra documents [filesystem skills and dynamic skill resolution](https://mastra.ai/docs/skills).

### 2.2 Context, memory, and execution

Reuse Mastra native structured working memory for an account-shared personal profile with a few stable categories and flexible free text. Use native [Observational Memory for token-budgeted per-channel compaction](0010-native-channel-context-compaction.md), supplying recent raw messages, channel compact notes, and the shared profile to the model. Stored raw history remains retained. Observational Memory does not automatically write the shared profile; main-agent turns control those writes under backend authority. Phase 1 provides neither vector retrieval nor cross-channel history retrieval. Backend code must bind the resource and thread for each run rather than accepting model-selected memory ownership. Mastra documents its [memory facilities and storage configuration](https://mastra.ai/docs/memory/overview).

Use the native PostgreSQL adapter with [one PostgreSQL database and separate application-owned and Mastra-owned tables](0013-shared-postgresql-storage.md). Native partial profile merges preserve distinct fields, while the [last successful save wins for the same field](0012-last-save-wins-profile-updates.md), including an older turn overwriting a correction or deletion. [Forgetting changes only the profile](0011-profile-only-forgetting.md) through its native update tool; channel histories and compact notes remain unchanged. MyStacks owns schema, budgets, retention, authorization, and integration within those accepted limits.

The [E2B decision](0003-sandboxed-code-execution.md) owns generated-code isolation and adapter reuse. The shared Mastra loop remains outside the sandbox. The [credential decision](0002-backend-owned-financial-credentials.md) owns authorization and secret handling; framework schemas, skill instructions, and Agent hooks cannot replace the protected operation's permission checks.

The initial adoption uses regular `Agent` execution for direct foreground chat and the [queued-work boundary](0004-durable-scheduling-and-queued-execution.md) for background runs. A background completion supplies fresh input to a new main-agent turn, which can continue tool/model rounds and owns the user reply. The [channel-turn decision](0009-channel-turns-and-background-subagents.md) defines this application contract and the accepted interrupted-chat limit; it does not select an exact Mastra dispatcher or require workflow checkpoints. Advanced execution facilities need a concrete requirement and a separate persistence and execution-ownership decision.

Only main-agent turns may delegate background subagents, with an initial five-outstanding limit per chat. Backend scheduling starts user-requested and proactive runs independently of that quota under the [scheduling decision](0004-durable-scheduling-and-queued-execution.md). Restricted tool capabilities and backend authorization preserve useful financial read, research, E2B, and shared personal-memory read access while preventing background agents from spawning children, changing settings, connections, memory, or saved user tasks, or sending user messages. Exact native configuration remains open.

## 3. Rationale and alternatives

### 3.1 Reuse the components around the loop

The `mystacks-be` and `hs-llm-service` implementations use AI SDK automatic tool loops and provide a simplicity reference for direct backend chat. Choosing Mastra does not create agent reasoning or tool use that AI SDK lacks. It reduces MyStacks' assembly work for skill loading, context, memory, tool dispatch, and related runtime facilities.

Mastra uses AI SDK provider interfaces alongside its own Agent, memory, and runtime abstractions. Its [model integration](https://mastra.ai/models) supports AI SDK provider modules. MyStacks still owns financial tools, authorization, task behavior, storage policy, and delivery.

### 3.2 Continue with AI SDK directly

Continuing the existing AI SDK approach is viable and preserves familiar provider and tool-loop integration. MyStacks would assemble more of the surrounding skill, memory, and context behavior itself. Mastra is selected to reuse those facilities while keeping business logic in the backend.

### 3.3 Eve or LangGraph

Eve is a viable file-based framework using AI SDK. Its [self-hosting contract](https://eve.dev/docs/guides/deployment/self-hosting) requires a Workflow world designed for shared deliveries across replicas and schedule-runner coordination; its beta Workflow stack adds compatibility work. Its [getting-started requirements](https://eve.dev/docs/getting-started) specify Node.js 24 or newer, while Bun compatibility remains unverified for MyStacks. Using E2B for Eve's native sandbox facilities would require its [custom sandbox-provider boundary](https://eve.dev/docs/sandbox/custom-providers); a separate E2B analysis tool is also possible. Adopting Eve's Workflow operating model adds more infrastructure change than the selected shared-worker design needs.

LangGraph is a strong alternative when explicit graph checkpoints and interruption/resumption govern the workflow. Its [persistence](https://docs.langchain.com/oss/javascript/langgraph/persistence) and [interrupt](https://docs.langchain.com/oss/javascript/langgraph/interrupts) facilities support those requirements. Phase 1 has not established a need for that execution model.

## 4. Consequences and open decisions

- **Hosting and license:** Mastra's open-source core can run on MyStacks-managed GCP compute. Its [license](https://github.com/mastra-ai/mastra/blob/main/LICENSE.md) places core code outside `ee/` under Apache-2.0, with separate terms for enterprise and third-party components. Enterprise features and hosted cloud services remain optional commercial choices.
- **Implementation validation:** pin and validate package versions, storage adapters, E2B integration, main/subagent tool configuration, fresh-turn completion input, and deployment compatibility during implementation. Framework selection does not establish that every feature has the same stability or operating guarantees.
- **Runtime and model:** Bun remains a runtime candidate requiring compatibility checks. DeepSeek is a supported model-integration candidate; no production runtime, model, provider, or gateway is selected by this decision.
- **Memory policy:** the [shared-memory decision](0008-channel-scoped-work-and-shared-memory.md) defines account-wide personal context and main-agent-controlled updates. Native per-channel compaction, profile-only forgetting, last-successful-save updates, and PostgreSQL storage have separate decision records above. Exact profile schema and budgets, compaction thresholds and models, retention, adapter/package versions, and framework integration remain open.
- **Security and correctness:** trusted identity binding, account/object authorization, secret exclusion, financial scope, and analysis validation remain MyStacks responsibilities.
- **Capacity:** selecting Mastra and E2B does not validate the 1,000-user launch or 100,000-user growth targets. Frequency, run duration, bursts, quotas, and operational evidence must determine capacity.
