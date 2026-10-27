# Memory User Stories

## 1. Status and scope

**Status: proposed Phase 1 experience details.** The [requirements](../requirements.md) require user-specific knowledge to persist across conversations. These stories propose explicit retention and correction behavior, plus inspection and forgetting controls whose detailed policy remains open.

Memory supports continuity and personalization within **wealth and assets**. It must not expand Phase 1 authority, establish account access, or replace current financial evidence. The [runtime design](../design/runtime.md) describes the technical boundaries under the accepted [architecture](../architecture.md).

The stories do not select automatic inference, universal retention of conversations, or a retrieval policy.

## 2. User stories

### 2.1 US-MEM-01 — Retain an explicit preference or goal

As a user, I want to ask the assistant to remember a preference or goal so that relevant future answers reflect it.

- The user can explicitly ask the assistant to remember a supported preference or goal, such as brief summaries or a stated long-term objective.
- The assistant confirms what was saved, or explains why the information could not be retained, without implying that every conversation detail becomes memory.
- In a later conversation, relevant answers use the saved information without requiring the user to repeat it; continuity survives a service restart.
- Remembering a goal does not silently create an ongoing task, enable notifications, or authorize a financial recommendation or action.

### 2.2 US-MEM-02 — Inspect and correct remembered information

As a user, I want to see and correct what the assistant remembers so that old or mistaken information does not keep shaping its answers.

- **Proposed inspection control:** the user can see the retained preferences and goals used for personalization in readable form.
- A remembered item distinguishes the user's statement from an assistant interpretation; an interpretation is not presented as a confirmed user fact.
- The user can correct a supported item and receive a clear acknowledgement of the resulting saved information.
- Later relevant answers use the correction, including in a new conversation; the assistant explains if the change could not be saved.

### 2.3 US-MEM-03 — Ask the assistant to forget an item

As a user, I want to remove remembered information so that it stops influencing future personalization.

- **Proposed forgetting control:** the user can select an item or clearly identify the information to forget, and the assistant resolves an ambiguous request before removing the wrong information.
- The user receives a clear outcome that distinguishes removal in progress, completed removal, and failure.
- After removal completes, the forgotten item does not return through a summary or another retained representation used for personalization.
- The experience explains the removal scope and any remaining conversation, artifact, backup, or provider retention under the selected policy; it does not promise immediate erasure from every system.

### 2.4 US-MEM-04 — Keep memory separate from financial facts

As a user, I want remembered context to be distinguishable from current evidence so that I can trust what an answer is based on.

- If a remembered preference or goal materially shapes an answer, the assistant can explain that context and its source.
- Current holdings, prices, position risks, and account access rely on available financial evidence rather than being asserted from memory.
- If a remembered statement conflicts with current evidence, the assistant identifies the difference and does not silently treat either as the user's corrected preference.
- If current evidence is missing, the assistant explains the gap; remembering a past balance or connected account does not make it current or accessible.

## 3. Observable acceptance examples

These examples establish observable continuity and control without selecting a storage or recall mechanism.

| Situation | Observable result |
| --- | --- |
| “Remember that I prefer brief balance summaries.” | The assistant confirms the supported preference; a relevant answer in a new conversation follows it. |
| The service restarts between conversations. | The saved preference remains available and can affect a relevant answer. |
| “I now want more detail in those summaries.” | The assistant acknowledges the correction and later relevant answers use it. |
| The user inspects a stated goal. | The user can distinguish their statement from any assistant interpretation. |
| The user forgets a preference. | The assistant reports the removal outcome and the preference stops shaping future personalization after completion. |
| The user disconnects an account mentioned in memory. | The assistant does not claim present access or present an old balance as current evidence. |

## 4. Open decisions

### 4.1 Selection and use

- Which preferences, goals, and other user-specific knowledge can be retained, and when the assistant asks before saving them.
- Whether automatic observations or semantic recall are useful enough to enable, with their source, correction, and forgetting rules.
- How remembered information becomes outdated, how conflicting statements are resolved, and when clarification is needed.

### 4.2 Control and retention

- The inspection, correction, and forgetting interfaces, and the distinction between conversation history and personalization memory.
- Retention periods, deletion completion behavior, backup and provider limits, and the scope of source-record removal.
- The behavior of conversations and background work already using information when the user corrects or forgets it.

The [assistant stories](assistant.md) describe conversational use. The [task stories](tasks.md) describe ongoing work, which requires its own explicit task state and controls.
