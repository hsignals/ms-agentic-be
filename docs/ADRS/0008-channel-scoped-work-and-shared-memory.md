# Channel-scoped work and shared memory

## 1. Status and scope

**Status: ACCEPTED Phase 1 product scope.** MyStacks shares useful personal memory and financial connections across a user's linked channels while keeping conversation history and work within their originating channel. The technical mapping remains **tentative pending the overall architecture design round**.

The [requirements](../requirements.md) own product outcomes. The [architecture](../architecture.md), [runtime design](../design/runtime.md), [task design](../design/tasks.md), and [onboarding design](../design/onboarding.md) own implementation boundaries and open technical choices. This record owns the scope decision and its trade-offs.

## 2. Decision

### 2.1 Shared personal context, separate conversations and work

Useful personal facts, goals, preferences, and their corrections or forgetting are account-wide. A fact learned in either linked channel can shape a relevant answer in another. Financial connections and portfolio evidence are also account-wide within their backend boundary.

Clear new user statements automatically update the applicable older personal facts, goals, or preferences without requiring an explicit correction request. If conflicting personal statements leave the user's meaning unclear, the assistant asks for clarification only when resolving the conflict materially changes the answer. Otherwise it answers without treating the disputed fact as settled. Assistant guesses and interpretations remain distinguishable from user-stated or user-confirmed facts.

History, current context, compaction, independent jobs, scheduled tasks, and results stay within their originating channel. Shared memory holds useful personal context rather than copies of transcripts, task records, or results. It does not establish current financial facts or grant access to work from another channel.

The latest user statement about holdings, balances, prices, or access remains user-supplied context; it does not overwrite provider financial evidence or establish current account access.

### 2.2 Current-channel chat controls and website settings

Chat inspects and controls only its current channel's jobs and scheduled tasks, using each work type's supported controls. Its channel is fixed by trusted backend context. Phase 1 provides no chat destination selector, work transfer, or cross-channel history lookup. The agent may know that other channels exist and explain website controls without loading their transcripts or task logs.

Chat retains controls for shared personal memory and preferences and the account-wide proactive on/off setting. The website owns financial connections, channel linking and disconnection, and preferred-channel routing settings. Jobs and scheduled tasks deliver to their originating channel; proactive insights follow their separate preferred-channel policy in the task design.

### 2.3 Fixed task channel and disconnect behavior

A scheduled task's creating channel remains its destination in Phase 1. Disconnecting that channel pauses its scheduled tasks, future runs, and pending deliveries without rerouting them. History and task records remain. Relinking does not resume tasks automatically; the user resumes them from that channel.

Already-started sends cannot be recalled. Task attempts and one-off jobs retain their documented cancellation and outcome guarantees; disconnecting a channel does not promise rollback or task migration.

## 3. Rationale and alternatives

**Channel-scoped work** gives each conversation a clear set of requests, controls, and results. Passing another channel through runtime context is straightforward, but cross-channel tools require product rules for destination choice, work ownership, access, and delivery. Phase 1 has no concrete need that justifies those added semantics, so cross-channel delivery and chat-based channel configuration remain deferred.

**Shared personal memory** supports continuity without repeated setup. Users accept that useful facts learned in one channel can influence answers in another; channel separation does not make those personal facts private to one conversation. Keeping memory separate from transcripts and work records preserves the accepted history and task boundary. Separate personal profiles per channel would lose that intended continuity.

**Automatic personal updates** keep clear changes in the user's circumstances useful without requiring memory-management commands. Clarification is reserved for unclear conflicts that materially affect the answer so that unrelated uncertainty does not block useful replies. Distinguishing assistant interpretations from user facts preserves their different authority; recency alone does not give a user financial statement authority over provider evidence.

**One shared runtime** can enforce these scopes through trusted bindings and backend authorization. Channel separation does not require a separate VM, queue, or runtime deployment for each channel.

## 4. Consequences and open implementation choices

- **Enforcement:** backend handlers must check both account and current channel for history, work, and result access. Model-selected channel IDs or prompts cannot establish authority.
- **Tentative mapping:** use the existing shared Mastra regular `Agent`, fresh trusted per-run `RequestContext`, account working memory, and separate channel thread history and compaction. Prefer native facilities within the runtime design's authorized scopes.
- **Memory implementation:** selection, schemas, source representation, simultaneous-write ordering and merging, retention, and deletion mechanisms remain open. Conversational handling of outdated or conflicting personal facts is accepted; implementation choices must preserve it, and older in-flight writes must not undo accepted corrections or forgetting. Native field merging alone does not settle that precedence.
- **Delivery:** proactive fallback does not migrate scheduled tasks. Exact pending-dispatch mechanics remain open within the accepted pause and manual-resume behavior.
