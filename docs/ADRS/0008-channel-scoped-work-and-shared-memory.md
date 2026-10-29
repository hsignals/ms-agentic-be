# Channel-scoped work and shared memory

## 1. Status and scope

**Status: ACCEPTED Phase 1 product scope and native structured personal-memory direction.** MyStacks shares useful personal memory and financial connections across a user's linked channels while keeping conversation history and user-requested work within their originating channel. Exact memory schema, storage adapter, and framework integration remain **tentative pending the overall architecture design round**.

The [requirements](../requirements.md) own product outcomes. The [architecture](../architecture.md), [runtime design](../design/runtime.md), [task design](../design/tasks.md), and [onboarding design](../design/onboarding.md) own implementation boundaries and open technical choices. This record owns the scope decision and its trade-offs.

## 2. Decision

### 2.1 Shared personal context, separate conversations and work

Useful personal facts, goals, preferences, and their corrections or forgetting are account-wide. A fact learned in either linked channel can shape a relevant answer in another. Financial connections and portfolio evidence are also account-wide within their backend boundary.

Clear new user statements automatically update the applicable older personal facts, goals, or preferences without requiring an explicit correction request. If conflicting personal statements leave the user's meaning unclear, the assistant asks for clarification only when resolving the conflict materially changes the answer. Otherwise it answers without treating the disputed fact as settled. Assistant guesses and interpretations remain distinguishable from user-stated or user-confirmed facts.

History, current context, compaction, user-requested independent jobs, scheduled tasks, and their results stay within their originating channel. Shared memory holds useful personal context rather than copies of transcripts, task records, or results. It does not establish current financial facts or grant access to work from another channel.

Proactive finding and notification history is a separate account-level record of findings, supporting evidence, and channel-specific delivery outcomes. It supports meaningful-change judgments as selected proactive insight delivery channels change without copying channel transcripts or task histories into personal memory.

The latest user statement about holdings, balances, prices, or access remains user-supplied context; it does not overwrite provider financial evidence or establish current account access.

### 2.2 Current-channel work controls and shared proactive settings

Chat inspects and controls only its current channel's jobs and scheduled tasks, using each work type's supported controls. Its channel is fixed by trusted backend context. Phase 1 provides no destination selector for user-requested work, work transfer, or cross-channel history lookup. The agent may know that other channels exist without loading their transcripts or task logs.

Chat retains controls for shared personal memory and preferences. The website owns adding and removing financial sources and linking or disconnecting messaging channels. Dashboard and chat share the account's **proactive insight delivery channels** setting, selecting one, both, or none of the linked channels. Every newly linked channel is selected by default. Selecting none stops proactive investigations and unsent proactive delivery. Removing or disconnecting a selected channel does not automatically select another channel.

One proactive investigation per account may run at a time. Each qualifying finding is delivered to all selected, currently eligible verified destinations, with a separate delivery outcome for each channel. The setting routes only proactive insights under the task design. Background results return internally to a new main-agent turn, which owns the reply in the originating channel; chat replies and requested work retain that channel.

Each linked channel orders user messages and internal completion events through one logical event stream, with one foreground main-agent turn at a time. Background runs do not occupy that turn while waiting for completion. The [channel-turn decision](0009-channel-turns-and-background-subagents.md) owns continuation and delegation behavior; the exact cross-replica coordination and Mastra mapping remain open.

### 2.3 Fixed task channel and disconnect behavior

A scheduled task's creating channel remains its destination in Phase 1. Disconnecting that channel pauses its scheduled tasks, future runs, and pending deliveries without rerouting them. History and task records remain. Relinking does not resume tasks automatically; the user resumes them from that channel.

Already-started sends cannot be recalled. Task attempts and one-off jobs retain their documented cancellation and outcome guarantees; disconnecting a channel does not promise rollback or task migration.

### 2.4 Native structured personal profile

Account-shared personal memory uses Mastra's native schema-based working memory. The profile has a few stable categories with flexible free-text content, including room for context outside fixed fields. Personal facts, goals, and preferences are example categories; exact keys, schema/types, and size and selection budgets remain open. The [runtime design](../design/runtime.md) owns the illustrative profile and native update semantics.

Main-agent turns can write useful personal context automatically or through explicit user instructions, using native memory facilities under backend-controlled authority. Research and background agents have read access only. User facts and assistant interpretations remain distinguishable, while current financial observations, permissions, and authoritative account configuration remain in their backend boundaries.

## 3. Rationale and alternatives

**Channel-scoped work** gives each conversation a clear set of requests, controls, and results. Passing another channel through runtime context is straightforward, but cross-channel work tools require product rules for destination choice, work ownership, access, and delivery. Phase 1 keeps user-requested work within its originating channel while allowing the account's proactive insights to reach every selected eligible channel. One investigation can serve both destinations without duplicating research or merging their conversations.

**Shared personal memory** supports continuity without repeated setup. Users accept that useful facts learned in one channel can influence answers in another; channel separation does not make those personal facts private to one conversation. Keeping memory separate from transcripts and work records preserves the accepted history and task boundary. Separate personal profiles per channel would lose that intended continuity.

**Automatic personal updates** keep clear changes in the user's circumstances useful without requiring memory-management commands. Clarification is reserved for unclear conflicts that materially affect the answer so that unrelated uncertainty does not block useful replies. Distinguishing assistant interpretations from user facts preserves their different authority; recency alone does not give a user financial statement authority over provider evidence.

**A few stable categories with flexible text** keep the profile readable and allow native named-field updates without defining a field for every possible personal fact. Free text, including Markdown, preserves context beyond a rigid taxonomy; the schema must leave room for it. Updating a fact inside a text field still requires editing that text. Structured representation does not itself solve same-field concurrency, correction, or forgetting, and adapter-specific atomic merging does not select a database.

**One shared runtime** can enforce these scopes through trusted bindings and backend authorization. Channel separation does not require a separate VM, queue, or runtime deployment for each channel.

## 4. Consequences and open implementation choices

- **Enforcement:** backend handlers must check both account and current channel for history, user-requested work, and result access. Model-selected channel IDs or prompts cannot establish authority.
- **Runtime integration:** retain the shared Mastra regular `Agent`, fresh trusted per-run `RequestContext`, account-scoped structured working memory, and separate channel thread history and compaction. Exact framework integration remains open. Selecting this profile does not enable cross-channel transcript search, vector memory, new memory agents or extractors, or a custom memory engine.
- **Memory implementation:** exact schema and storage adapter, source representation, selection and size budgets, simultaneous-write ordering and same-field merging, retained histories and enabled derived layers, retention, and deletion mechanisms remain open. Conversational handling of outdated or conflicting personal facts is accepted; implementation choices must preserve it, and older in-flight writes or retained summaries must not restore superseded or forgotten personal context. Native field merging alone does not settle that precedence.
- **Delivery:** proactive selection and channel-specific delivery outcomes remain separate from fixed-channel jobs and scheduled tasks. Exact pending-dispatch mechanics remain open within the accepted pause and manual-resume behavior. [TODO](../TODO.md) owns provider-specific Apple controls; minimum compliance requirements must not dictate the general product experience.
