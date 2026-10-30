# Memory User Stories

## 1. Status and scope

**Status: accepted Phase 1 memory experience, including account-wide automatic updates and in-chat controls.** The [requirements](../requirements.md) require user-specific knowledge to persist across conversations. The assistant saves useful personal context in an account-shared profile and lets users inspect, correct, and forget it from any authorized linked chat. Clear new user statements update older personal facts automatically; unclear conflicts need clarification only when they materially affect the answer. Native partial-field updates and last-successful-save ordering for the same field are accepted. Detailed selection, retention, and presentation remain open.

Memory supports continuity and personalization within **wealth and assets**. It must not expand Phase 1 authority, establish account access, or replace current financial evidence. The [runtime design](../design/runtime.md) and [architecture](../architecture.md) remain **tentative pending the overall architecture design round**; the product agreements in these stories remain accepted.

Remembered personal context is shared across the MyStacks account. Useful personal facts learned in one channel can shape relevant answers in another. Each linked channel keeps separate recent history, a compact summary of older history, jobs, scheduled tasks, and results. Its context combines that same-channel history and summary with the shared personal profile and relevant request or job inputs. Shared memory must not become a copy of transcripts or work records. Forgetting clears only saved profile content; retained channel context can still influence answers or cause a fact to be learned again. The [context](../ADRS/0010-native-channel-context-compaction.md), [forgetting](../ADRS/0011-profile-only-forgetting.md), and [save-order](../ADRS/0012-last-save-wins-profile-updates.md) decisions own these trade-offs.

## 2. User stories

### 2.1 US-MEM-01 — Remember useful personal context

**Status: accepted experience; selection and retention details remain open.**

As a user, I want the assistant to remember useful personal context so that relevant future answers reflect my goals, preferences, and circumstances without repeated setup.

- The assistant automatically remembers useful personal context from conversation in either linked channel, including personal facts, goals, preferences, and relevant circumstances; the user does not have to say “remember this.”
- The user can also explicitly ask the assistant to remember personal context, such as a preference for brief summaries or a stated long-term objective.
- Useful personal context can include free-form details; the user does not need to fit every fact into a fixed set of profile fields.
- In a later conversation, including in another linked channel, relevant answers use remembered personal context without requiring the user to repeat it; continuity survives a service restart.
- Remembering a goal does not silently create an ongoing task, enable notifications, or authorize a financial recommendation or action.

### 2.2 US-MEM-02 — Inspect and correct remembered information

**Status: accepted automatic updates, in-chat controls, and last-successful-save ordering; detailed presentation remains open.**

As a user, I want to see and correct what the assistant remembers so that old or mistaken information does not keep shaping its answers.

- The user can ask any authorized linked chat, “What do you remember about me?”, and receive a readable account of shared remembered personal context.
- A clear new user statement automatically updates the applicable older personal fact, goal, or preference without requiring an explicit correction request.
- The user can correct remembered personal context in chat, including goals and preferences, and receive a clear acknowledgement of the account-wide correction.
- A saved correction is available to relevant answers across linked channels, including in a new conversation; the assistant explains if the change could not be saved. A later successful update to the same field can replace it.
- If conflicting personal statements leave the user's meaning unclear, the assistant asks for clarification only when resolving the conflict materially changes the answer. Otherwise it gives a useful answer without treating the disputed fact as settled.
- Concurrent updates to different profile fields preserve those fields. If turns update the same field, the last successful save wins, regardless of user-message order; a slower older turn can overwrite a newer correction or restore a removed detail. Text and array fields are replaced as whole fields rather than merged fact by fact.

### 2.3 US-MEM-03 — Ask the assistant to forget saved personal context

**Status: accepted profile-only forgetting for specific details or the whole profile, with continued-context and relearning limits.**

As a user, I want to remove saved personal context from my profile and understand what remains in my conversations.

- The user can identify a specific detail to forget from any authorized linked chat; the assistant resolves an ambiguous request before removing the wrong profile content and preserves unrelated saved facts.
- The user can say, “Forget everything you remember about me,” to clear the account's shared personal profile.
- The assistant reports whether the profile change was saved and explains that it applies across the account. Channel transcripts and summaries remain unchanged.
- A removed fact can remain in context, influence an answer, or be learned into the profile again. The assistant is instructed not to recreate it solely from older history, but this is best effort; a slower in-flight update can also restore it under the accepted save-order rule.
- The experience distinguishes profile-only forgetting from account or financial-data deletion and explains remaining retention without promising erasure of conversations, artifacts, backups, or provider records.

### 2.4 US-MEM-04 — Keep memory separate from financial and task evidence

**Status: accepted evidence boundary and distinction between user facts and assistant interpretations.**

As a user, I want remembered context to be distinguishable from current evidence so that I can trust what an answer is based on.

- If a remembered preference or goal materially shapes an answer, the assistant can explain that context and its source.
- User-stated or user-confirmed personal facts remain distinguishable from assistant guesses and interpretations; the assistant does not present an interpretation as a confirmed user fact.
- Current holdings, prices, position risks, and account access rely on financial evidence rather than being asserted from memory. Current portfolio analysis and proactive current-exposure claims require fresh or near-fresh relevant account state; remembered holdings and fresh market prices do not make an older account observation current.
- When remembered context and current evidence differ, the assistant does not silently treat either as a corrected goal or preference. Current financial evidence remains the basis for financial facts.
- A newer user statement about holdings, balances, prices, or account access remains user-supplied context; it does not overwrite provider financial evidence or establish current access.
- Remembering a past balance or connected account does not make it current or accessible. When the user explicitly requests unavailable current information, the assistant explains the gap and offers the closest useful supported answer.
- Shared memory can retain useful personal facts learned in chat while discussing work, but it does not expose another channel's transcripts, task records, or results. Background research can use authorized personal memory without changing it. Task inspection and controls remain within the current channel.

## 3. Observable acceptance examples

These examples establish observable continuity, account scope, and control.

| Situation | Observable result |
| --- | --- |
| The user mentions a useful goal or preference without saying “remember this.” | The assistant remembers the personal context and uses it in relevant later answers. |
| “Remember that I prefer brief balance summaries.” | A relevant answer in a new conversation follows the remembered preference. |
| The user shares a useful preference in iMessage and later asks a relevant question in linked WhatsApp. | The answer can use the shared preference while WhatsApp keeps its own conversation history and current context. |
| A long iMessage conversation continues after older messages leave active raw context. | The answer can use compact older iMessage context, recent iMessage messages, the shared profile, and relevant request inputs; WhatsApp history is not retrieved. |
| The user shares a useful personal fact while discussing an iMessage task. | A relevant WhatsApp answer can use the personal fact without retrieving the iMessage task or its result. |
| The service restarts between conversations. | The saved preference remains available and can affect a relevant answer. |
| The user previously said “I plan to retire in 2040” in iMessage and now says “I plan to retire in 2045” in linked WhatsApp. | The clear new statement automatically updates the shared personal fact, and later relevant answers in either channel use 2045. |
| “I now want more detail in those summaries.” | The assistant acknowledges the account-wide correction and later relevant answers in either linked channel use it. |
| A new statement leaves the user's retirement goal unclear, and the requested calculation depends on that goal. | The assistant asks for clarification before using a disputed goal in the calculation. |
| The same unclear goal has no material effect on the requested balance summary. | The assistant gives the useful summary without requiring clarification and does not present the uncertain goal as settled. |
| “What do you remember about me?” | The assistant describes remembered personal context in chat. |
| The assistant has inferred a preference that the user has not stated or confirmed. | Inspection and relevant answers distinguish the inference from user-stated or user-confirmed facts. |
| The user forgets a preference in one linked channel. | The assistant reports its removal from the shared profile, preserves unrelated saved facts, and explains that channel transcripts and summaries remain unchanged. |
| Two linked channels save updates to different profile fields. | Both fields retain their saved updates. |
| An earlier authorized turn saves the same profile field after a newer correction or removal. | Its later successful save wins and can replace the correction or restore the removed content, regardless of user-message order. |
| A removed preference still appears in retained channel context. | It can influence an answer or be learned again; the assistant does not promise that profile-only forgetting prevents this. |
| “Forget everything you remember about me.” | The assistant clears the saved personal profile across the account and explains that transcripts, summaries, financial data, and other retained records are unchanged. |
| The user disconnects an account mentioned in memory. | The assistant does not claim present access or present an old balance as current evidence. |
| The user's newest balance statement differs from available provider financial evidence. | The assistant keeps the statement distinct from provider evidence and does not replace the provider's financial facts with remembered context. |

## 4. Open decisions

### 4.1 Selection and presentation

- The detailed selection rules for useful personal context and how relevant remembered context is retrieved.
- The presentation of user statements, confirmations, assistant interpretations, and unresolved uncertainty, while preserving their accepted distinctions.

### 4.2 Control and retention

- The detailed presentation of in-chat inspection, correction, and forgetting, and the distinction between conversation history and remembered personal context.
- Retention periods, backup and provider limits, and any separate controls for deleting retained records beyond the personal profile.
- Raw-history, summary, and total context budgets and the models used for native channel compaction.

The [assistant stories](assistant.md) describe conversational use. The [task stories](tasks.md) describe ongoing work, which requires its own explicit task state and controls.
