# Chat-first reports

## 1. Status and scope

**Status: ACCEPTED Phase 1 presentation direction.** Assistant answers, research summaries, reports, scheduled results, and proactive insights are concise, precise, and text-first in iMessage and WhatsApp. The overall runtime architecture remains tentative.

The [requirements](../requirements.md#42-interaction-surfaces-and-responsiveness) and [assistant stories](../user-stories/assistant.md) own observable behavior. The [channel and memory decision](0008-channel-scoped-work-and-shared-memory.md) owns channel scope and website controls; the [channel-turn decision](0009-channel-turns-and-background-subagents.md) owns agent-authored reply authority and background-result handling.

## 2. Decision

### 2.1 Concise reports with enough evidence

Lead with the answer or main finding, followed by key numbers and the explanation and evidence needed to understand it. Use short paragraphs and bullets that read naturally in chat. Follow-up questions provide deeper detail. Concision must preserve a correct, useful answer rather than impose a rigid word limit.

The same presentation applies to direct answers, research, substantial calculations, background results, scheduled updates, and proactive insights. Backend work may be extensive without producing a lengthy user-facing report. Under the channel-turn decision, background findings return to the main agent, which owns agent-authored user replies and can combine or investigate findings before answering.

### 2.2 Messaging and website roles

Chat is the ongoing assistant and task-management surface. The persistent website dashboard provides signup, financial connections, channel controls, proactive insight delivery channels, and portfolio previews. Requested work and scheduled results stay in their originating channel; proactive insights follow the user's selected delivery channels.

Available-source research, generated-code analysis, and background work remain in scope. Extensive deep-research reports, polished website report artifacts, full report pages, and long-form report exports are deferred. Image replies remain low priority.

## 3. Rationale and alternatives

**A useful assistant reports where the user already talks.** Concise messages support ongoing questions, follow-ups, tasks, and timely findings in the launch messaging channels. The work behind an answer can be substantial while its presentation stays easy to read.

**The trade-off is limited presentation in Phase 1.** Long reports and polished web artifacts could expose more detail in one place, but require an additional presentation experience. MyStacks accepts that limit and supplies deeper explanation through conversation; rich artifacts remain a later direction.

## 4. Consequences and open choices

- **Quality:** brevity must retain material reasoning, evidence, scope, and uncertainty. It cannot justify invented figures or unsupported completeness.
- **Continuity:** final agent replies enter the originating conversation so follow-ups can use them. Background execution and meaningful progress updates follow the channel-turn and assistant-story contracts.
- **Implementation:** source attribution format, response-time targets, and future image or artifact formats remain open. The reporting choice does not reduce the supported depth of research or calculation.
