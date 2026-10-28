# Memory User Stories

## 1. Status and scope

**Status: accepted Phase 1 memory experience, including account-wide automatic updates and in-chat controls.** The [requirements](../requirements.md) require user-specific knowledge to persist across conversations. The assistant remembers useful personal context across the user's linked channels and lets users inspect, correct, and forget it from any authorized linked chat. Clear new user statements update older personal facts automatically; unclear conflicts need clarification only when they materially affect the answer. Storage, retention, presentation, and concurrent-write mechanics remain open.

Memory supports continuity and personalization within **wealth and assets**. It must not expand Phase 1 authority, establish account access, or replace current financial evidence. The [runtime design](../design/runtime.md) and [architecture](../architecture.md) remain **tentative pending the overall architecture design round**; the product agreements in these stories remain accepted.

Remembered personal context is shared across the MyStacks account. Useful personal facts learned in one channel can shape relevant answers in another. Each linked channel keeps separate history, current context, compaction, jobs, scheduled tasks, and results. Shared memory must not become a copy of those transcripts or work records. These stories do not select a storage or retrieval mechanism or promise universal erasure of retained data.

## 2. User stories

### 2.1 US-MEM-01 — Remember useful personal context

**Status: accepted experience; selection and retention details remain open.**

As a user, I want the assistant to remember useful personal context so that relevant future answers reflect my goals, preferences, and circumstances without repeated setup.

- The assistant automatically remembers useful personal context from conversation in either linked channel, including personal facts, goals, preferences, and relevant circumstances; the user does not have to say “remember this.”
- The user can also explicitly ask the assistant to remember personal context, such as a preference for brief summaries or a stated long-term objective.
- In a later conversation, including in another linked channel, relevant answers use remembered personal context without requiring the user to repeat it; continuity survives a service restart.
- Remembering a goal does not silently create an ongoing task, enable notifications, or authorize a financial recommendation or action.

### 2.2 US-MEM-02 — Inspect and correct remembered information

**Status: accepted automatic updates and in-chat controls; detailed presentation and concurrent-write mechanics remain open.**

As a user, I want to see and correct what the assistant remembers so that old or mistaken information does not keep shaping its answers.

- The user can ask any authorized linked chat, “What do you remember about me?”, and receive a readable account of shared remembered personal context.
- A clear new user statement automatically updates the applicable older personal fact, goal, or preference without requiring an explicit correction request.
- The user can correct remembered personal context in chat, including goals and preferences, and receive a clear acknowledgement of the account-wide correction.
- Later relevant answers use the correction across linked channels, including in a new conversation; the assistant explains if the change could not be saved.
- If conflicting personal statements leave the user's meaning unclear, the assistant asks for clarification only when resolving the conflict materially changes the answer. Otherwise it gives a useful answer without treating the disputed fact as settled.
- Concurrent writes from linked chats or background work preserve saved updates; an older in-flight write must not silently undo an accepted correction or forgetting operation. Simultaneous-write ordering and merging remain open implementation decisions.

### 2.3 US-MEM-03 — Ask the assistant to forget personal context

**Status: accepted in-chat controls for specific details and all remembered personal context; retention and completion details remain open.**

As a user, I want to remove remembered information so that it stops influencing future personalization.

- The user can identify a specific detail to forget from any authorized linked chat; the assistant resolves an ambiguous request before removing the wrong information.
- The user can say, “Forget everything you remember about me,” to clear the account's shared remembered personal context.
- The assistant acknowledges the account-wide scope of the request and explains if it cannot complete it. After forgetting completes, the forgotten personal context stops influencing future personalization across linked channels.
- The experience explains the forgetting scope and any remaining conversation, artifact, backup, or provider retention under the selected policy; it does not promise immediate erasure from every system.

### 2.4 US-MEM-04 — Keep memory separate from financial and task evidence

**Status: accepted evidence boundary and distinction between user facts and assistant interpretations.**

As a user, I want remembered context to be distinguishable from current evidence so that I can trust what an answer is based on.

- If a remembered preference or goal materially shapes an answer, the assistant can explain that context and its source.
- User-stated or user-confirmed personal facts remain distinguishable from assistant guesses and interpretations; the assistant does not present an interpretation as a confirmed user fact.
- Current holdings, prices, position risks, and account access rely on available financial evidence rather than being asserted from memory.
- When remembered context and current evidence differ, the assistant does not silently treat either as a corrected goal or preference. Current financial evidence remains the basis for financial facts.
- A newer user statement about holdings, balances, prices, or account access remains user-supplied context; it does not overwrite provider financial evidence or establish current access.
- Remembering a past balance or connected account does not make it current or accessible. When the user explicitly requests unavailable current information, the assistant explains the gap and offers the closest useful supported answer.
- Shared memory can retain useful personal facts learned during work, but it does not expose another channel's transcripts, task records, or results. Task inspection and controls remain within the current channel.

## 3. Observable acceptance examples

These examples establish observable continuity and control without selecting a storage or recall mechanism.

| Situation | Observable result |
| --- | --- |
| The user mentions a useful goal or preference without saying “remember this.” | The assistant remembers the personal context and uses it in relevant later answers. |
| “Remember that I prefer brief balance summaries.” | A relevant answer in a new conversation follows the remembered preference. |
| The user shares a useful preference in iMessage and later asks a relevant question in linked WhatsApp. | The answer can use the shared preference while WhatsApp keeps its own conversation history and current context. |
| The user shares a useful personal fact while discussing an iMessage task. | A relevant WhatsApp answer can use the personal fact without retrieving the iMessage task or its result. |
| The service restarts between conversations. | The saved preference remains available and can affect a relevant answer. |
| The user previously said “I plan to retire in 2040” in iMessage and now says “I plan to retire in 2045” in linked WhatsApp. | The clear new statement automatically updates the shared personal fact, and later relevant answers in either channel use 2045. |
| “I now want more detail in those summaries.” | The assistant acknowledges the account-wide correction and later relevant answers in either linked channel use it. |
| A new statement leaves the user's retirement goal unclear, and the requested calculation depends on that goal. | The assistant asks for clarification before using a disputed goal in the calculation. |
| The same unclear goal has no material effect on the requested balance summary. | The assistant gives the useful summary without requiring clarification and does not present the uncertain goal as settled. |
| “What do you remember about me?” | The assistant describes remembered personal context in chat. |
| The assistant has inferred a preference that the user has not stated or confirmed. | Inspection and relevant answers distinguish the inference from user-stated or user-confirmed facts. |
| The user forgets a preference in one linked channel. | The assistant reports the account-wide removal outcome and the preference stops shaping future personalization in all linked channels after completion. |
| An older background write completes after a saved correction or forgetting operation. | It does not silently restore the superseded or forgotten personal context. |
| “Forget everything you remember about me.” | The assistant clears remembered personal context and explains the scope without promising erasure of all conversation history or retained data. |
| The user disconnects an account mentioned in memory. | The assistant does not claim present access or present an old balance as current evidence. |
| The user's newest balance statement differs from available provider financial evidence. | The assistant keeps the statement distinct from provider evidence and does not replace the provider's financial facts with remembered context. |

## 4. Open decisions

### 4.1 Selection and representation

- The detailed selection rules for useful personal context and how relevant remembered context is retrieved.
- The storage representation and presentation of user statements, confirmations, assistant interpretations, and unresolved uncertainty, while preserving their accepted distinctions.

### 4.2 Writes, control, and retention

- Simultaneous-write ordering, merging, and schemas that preserve saved updates and prevent older writes from undoing accepted corrections or forgetting.
- The detailed presentation of in-chat inspection, correction, and forgetting, and the distinction between conversation history and remembered personal context.
- Retention periods, deletion completion behavior, backup and provider limits, and the scope of source-record removal.
- The behavior of conversations and background work already using information when the user corrects or forgets it.

The [assistant stories](assistant.md) describe conversational use. The [task stories](tasks.md) describe ongoing work, which requires its own explicit task state and controls.
