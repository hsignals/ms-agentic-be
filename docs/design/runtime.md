# Assistant and Memory Technical Design

## 1. Status and design boundary

**Status: proposed Phase 1 implementation details.** The [requirements](../requirements.md) own product outcomes. The [architecture](../architecture.md) accepts a shared custom runtime built with Mastra's regular `Agent`, fresh trusted `RequestContext` for each run, durable user-scoped state, and E2B for generated code. **BullMQ with Redis remains provisional.** This design refines those choices without selecting hosting, models, interfaces, storage engines, or exact policies.

The design supports [assistant stories US-CHAT-01–06](../user-stories/assistant.md) and [memory stories US-MEM-01–04](../user-stories/memory.md). Phase 1 permits financial information, analysis, reports, memory, and informational tasks; it excludes specific buy, sell, or rebalance recommendations and financial execution.

## 2. Trusted entry and agent execution

### 2.1 Run identity and context

- The orchestration layer authenticates incoming chat and product requests and resolves the authorized user, conversation, and requested resources before invoking the runtime.
- Each invocation receives a **fresh trusted `RequestContext`** and authorized resource and thread bindings. Background execution resolves its user and permissions through trusted durable state.
- Model arguments, uploaded content, message text, and queued identifiers cannot establish or replace the user binding. A resource or thread identifier is not authorization to read it.
- Shared agent definitions contain common instructions and capability registration. Private run data must not live in shared mutable agent fields or a shared private-file workspace.

The same rules apply to conversational work, continued analysis, scheduled work, and independent initiative. Login, channel authentication, runtime interfaces, and concrete context fields remain open.

### 2.2 Skills, tools, and authority

The runtime uses Mastra's native agent, skill, tool, and context facilities. Curated skills guide reasoning; registered backend tools execute trusted capabilities. Adding an applicable skill or tool can extend broad wealth-related work without adding a fixed intent for each request. The [agent capabilities ADR](../ADRS/0006-composable-agent-capabilities.md) owns the rationale for composing reusable tools with generated-code analysis and the conditions for considering a future API proxy.

Protected tool handlers or the financial tools API authorize the current user, account, and object on every protected path. Capability registration and model instructions do not replace those checks. Memory and task writes use validated backend-owned operations with their own user and object scope.

The tool surface provides read-only financial access. Output policy also applies to explanations, research, reports, artifacts, and messages, so a read-only tool cannot justify a specific investment recommendation. The exact enforcement mechanism remains open; its observable behavior must meet US-CHAT-06.

Financial credentials, refresh tokens, database credentials, and E2B management keys stay in trusted backend adapters. They must not enter prompts, `RequestContext`, job payloads, traces, generated code, tool results, or sandbox files and environment variables.

## 3. Evidence and conversational answers

### 3.1 Shared financial evidence

The [portfolio design](portfolio.md) owns the financial evidence contract used by the portfolio website, chat, reports, and digests. Runtime consumers preserve that contract through calculations and presentation, including the evidence needed to interpret aggregation and conversions.

The runtime distinguishes financial observations, research claims, supplied documents, assumptions, and hypothetical results. A source document or retrieved passage is evidence to examine, not an instruction that can change authority or tool access.

Available evidence can support a partial answer. The response must expose gaps relevant to its conclusion and must not convert missing information into zero or no risk. Personalization memory does not supply current holdings, prices, or permissions.

### 3.2 Request scope and response composition

The runtime resolves ambiguity when it materially changes the requested answer, authorized data, or calculation. Otherwise it can state a reasonable assumption and provide useful information. It combines relevant tools and skills within the wealth and assets domain rather than routing every question through a closed intent catalog.

For deeper work, an initial response should contain supported information or a useful explanation of the analysis and its limits. It must clearly distinguish completed findings from work still underway. Exact latency targets and the boundary between synchronous and continued work remain open.

## 4. Continued work and durable outcomes

### 4.1 Ownership and durability

**Proposed:** continued analysis persists enough user-scoped state to identify the request, authorized input references, conversation or delivery destination, progress, and outcome outside the serving worker. Required outputs also persist outside the worker and disposable sandbox. Concrete records and storage remain open.

A one-off continued analysis does not implicitly create an ongoing task. The [task design](tasks.md) owns standing task intent, schedule ownership, execution attempts, and delivery policy. A recurring task remains distinct from each attempt; the runtime supplies analysis within the claimed work.

Under the provisional queue choice, BullMQ owns queued eligibility and retries. Mastra performs agent execution within a claimed job; a second independent background scheduler or retry owner must not manage the same work. Whether initial chat execution enters the queue remains open.

Durability does not promise checkpoint resumption inside an interrupted model call. The implementation must select whether interrupted work restarts, resumes a supported boundary, or reports failure, and must preserve enough outcome information to tell the user what happened.

### 4.2 Progress, failure, cancellation, and delivery

The user must be able to distinguish work in progress, useful partial output, completion, and failure. A tool error or exhausted budget must not become an unsupported success claim. Exact status names, progress events, timeouts, retry limits, and replay behavior remain open.

**Proposed cancellation control:** a user can request that continued work stop. The implementation must distinguish accepting the request from confirming that execution has stopped. Effects on in-flight tool calls, retained partial artifacts, charges, and later delivery require a selected policy before this control is promised.

Before delivering an outcome, the orchestration layer rechecks current permissions and destination; task results also use current task status. The task design owns how pauses, edits, retries, and repeated delivery affect ongoing work. Cancellation or delivery checks cannot recall a result already received by the user.

## 5. Supplied files and generated-code analysis

### 5.1 Input ownership and interpretation

- An upload is bound to its authenticated owner and authorized analysis before storage or processing. Later reads must enforce the same object access boundary.
- The upload boundary validates supported formats and configured file limits. Parsers treat document text, formulas, embedded content, and CSV cells as untrusted input.
- Extracted values retain their source, relevant date, and units. Unsupported sections and ambiguous values remain visible gaps; supplied statements are not live connected-account observations.
- Instructions embedded in uploads or retrieved material cannot grant tools, authorize an action, or override the user's request. Generated code and untrusted executable content must not run in shared workers.

Supported formats, parsing libraries, upload interfaces, size limits, retention, and handling of damaged or encrypted files remain open. These decisions must bound US-CHAT-04 without promising universal document support.

### 5.2 E2B execution and checked results

The E2B execution tool binds each sandbox to one user's task or analysis session and supplies only the selected code and data. A live sandbox cannot be reused across users. Native SDKs or a native Mastra adapter may implement this boundary; the adapter choice remains open.

**Outbound internet is disabled by default for financial analysis.** Trusted backend tools supply needed financial and research data. Any network exception requires explicit backend policy. Credentials stay outside sandbox mounts, code, files, environment variables, and outputs.

The tool enforces configured execution limits and returns errors, outputs, and artifacts to the runtime. Before using results, the runtime checks that they address the selected inputs and method, with appropriate numerical and unit checks. A successful process exit alone is not a verified financial conclusion.

Required reports and files are persisted to durable user-scoped storage before the adapter terminates the disposable sandbox. Artifact access rechecks ownership and permissions; an artifact reference alone grants no access. Failed persistence must not be reported as an available artifact.

Session limits, deadlines, resource budgets, interruption cleanup, permitted pause/resume behavior, artifact formats, and provider retention and deletion remain open. Sandbox pause does not establish deletion.

## 6. Memory lifecycle and user control

### 6.1 Native facilities and durable writes

The runtime uses **Mastra message history, working memory, and storage adapters** with explicit durable user and thread scopes. MyStacks owns the selection and write policy; it does not build a separate memory engine. Exact configuration and storage schemas remain open.

**Proposed explicit-memory path:** the assistant proposes a supported preference or goal through a validated backend write, receives its outcome, and acknowledges only information that was saved. A correction updates the applicable remembered item. The same information must remain available in a later authorized conversation after worker replacement.

The backend validates user and thread bindings when reading or writing memory. Resource-wide personalization and conversation-scoped history must have intentional scopes; shared agent execution must not mix their owners. A model-supplied item or thread identifier cannot authorize a memory operation.

Retained user statements and assistant interpretations must remain distinguishable. Financial observations belong to the financial data boundary; retaining a user's statement about an account does not create a current observation or account permission.

### 6.2 Concurrent updates and correction

Chat and background work may update the same user's state. The chosen write policy must preserve consistent state and prevent an older in-flight update from silently undoing an accepted correction or forgetting operation. Ordering, conflict handling, and the effects on work already reading memory remain open.

Prefer the selected storage and native framework capabilities where they meet this requirement. A separate lock, event log, or coordination service needs a concrete unmet requirement before adoption.

### 6.3 Inspection, forgetting, and derived layers

**Proposed controls:** authorized users can inspect supported remembered preferences and goals, correct them, and request forgetting. The product must distinguish an accepted removal request from completed removal or failure.

The implementation must identify every enabled memory layer. Forgetting must cover applicable source records and all enabled derived representations, including profiles, summaries, and vectors; a retained derivative must not silently restore a forgotten item. Prompt trimming is not stored-data deletion.

Automatic observations and semantic recall are **not selected policies**. If enabled, their writes, source attribution, user controls, and deletion lifecycle must fit the same boundary. The initial design must not assume that every conversation becomes a profile fact or vector record.

Retention for conversation history, memory, artifacts, backups, and providers needs an explicit policy. User-facing controls must describe the actual scope and completion limits instead of promising instant universal erasure.

## 7. Minimal operational evidence

Operations need enough evidence to relate an authorized request to its execution outcome, protected tool failures, queue delay where used, artifact persistence, and delivery outcome. Resource use must be visible enough to enforce the selected analysis budgets. Exact telemetry, retention, and operating thresholds remain open.

Logs and traces must follow the credential boundary and selected handling policy for private financial data. Monitoring should support diagnosing failures and interrupted work without copying full private inputs into routine diagnostics by default.

Verification must demonstrate user isolation across chat and background entry paths, evidence-preserving partial answers, checked artifacts, durable memory continuity and correction, and truthful continued-work outcomes. If forgetting is adopted, verification must cover every enabled derived memory layer.

## 8. Open implementation decisions

| Area | Decision still needed |
| --- | --- |
| Interfaces | Login and channel binding, chat routing, model/provider configuration, Mastra package versions, and context fields. |
| Continued work | Durable records, restart/resume/failure policy, progress, cancellation, retry and replay behavior, and limits. |
| Files and execution | Formats, parsers, quotas, E2B configuration, checked-result methods, artifact access and retention. |
| Memory | Enabled native layers, scopes, schemas, write and conflict policy, inspection, correction, forgetting, and retention. |
| Operations | Hosting, datastore adapters, resource budgets, telemetry, recovery, and provider data terms. |

The accepted architecture remains the constraint for these decisions. The portfolio and task designs own their respective evidence and standing-work contracts.
