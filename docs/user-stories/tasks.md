# Proactive tasks and notification user stories

## 1. Scope and authority

**Status: proposed detailed stories.** Accepted product boundaries apply throughout; unresolved experience and operating choices remain discussion items.

These stories cover **Phase 1 proactive information and ongoing work**: daily portfolio digests, user-defined tasks, periodic risk checks, useful independent initiative, and notification controls. The [requirements](../requirements.md) own product behavior; the [architecture](../architecture.md) and [technical companion](../design/tasks.md) own component responsibilities and technical choices.

Every task remains within wealth and assets, with read-only financial access. Results must exclude specific buy, sell, or rebalance recommendations and financial execution. The [portfolio stories](portfolio.md) define the financial evidence that tasks use.

Monitoring starts with checks **every couple of hours or daily**, with exact cadence open. Checks and delivery are best effort, and some qualifying events may be missed. Precision takes priority over recall. Proposed defaults and unresolved policies below require a product decision before they become guarantees.

## 2. User stories

### 2.1 US-TASK-01 — Receive a daily portfolio digest

As a user, I want a morning portfolio digest so that I can understand relevant changes without starting a conversation.

- The digest summarizes available portfolio changes and relevant developments across supported, connected or user-supplied assets.
- Before enabling delivery, the user can understand its timing, timezone, source coverage, and authorized destination; missing choices are resolved.
- The digest identifies source evidence, as-of time or unknown freshness, and material coverage gaps; missing data is not a zero balance or absence of risk.
- When the requested digest is due, a quiet market or unchanged balance can be reported plainly; lack of change alone does not cancel the requested daily update.

### 2.2 US-TASK-02 — Delegate ongoing work in natural language

As a user, I want to describe an ongoing informational task so that I can delegate work beyond a fixed task catalog.

- A request such as “Watch my portfolio concentration and tell me about material changes” can become a standing task when available capabilities support it.
- Before activation, the assistant makes the intent, covered sources, trigger or cadence, timezone where relevant, and destination clear and resolves material ambiguity.
- The assistant explains unsupported evidence, unavailable capabilities, or requests outside Phase 1 authority instead of claiming that the task is active.
- The saved task retains its intent, current status, user, trigger, and destination after chat closes, separately from execution attempts and their outcomes.

### 2.3 US-TASK-03 — Receive evidence-based risk alerts

As a user, I want relevant risk information so that I can understand changes affecting my assets and positions.

- Periodic checks can identify supported risks, such as a position approaching liquidation or a substantial decline in a concentrated holding, using the available evidence.
- An alert explains the observed condition, source coverage, freshness, and uncertainty without giving a specific investment instruction.
- The user can see that checks run every couple of hours or daily under the chosen policy, with best-effort timing and possible missed events.
- Incorrect or repetitive alerts are minimized; unknown or unavailable evidence is not presented as evidence that no risk exists.

### 2.4 US-TASK-04 — Receive useful independent initiative

As a user, I want the assistant to surface useful findings so that relevant information can reach me without an explicit watch request.

- The assistant may surface an independently identified finding when evidence supports its relevance to the user's portfolio.
- The message explains why the finding matters to the covered assets and distinguishes observations from assumptions or uncertainty.
- Proactive messages respect current notification settings and avoid repeated findings or no-change messages that add no useful information.
- The user can change or pause proactive notifications; the available controls and their scope are visible.

### 2.5 US-TASK-05 — Manage standing tasks

As a user, I want to list, inspect, edit, pause, resume, and remove tasks so that delegated work stays under my control.

- The user can list tasks and inspect each task's intent, status, coverage, trigger or cadence, timezone, destination, and recent execution outcome.
- The user can edit supported settings and receive a readable confirmation of the resulting standing request.
- The user can pause, resume, or remove a task and see the resulting status and what that action means for future checks and pending results.
- If work or delivery is already underway, the interface explains the applicable policy; a message already being delivered may still arrive under the proposed pause policy.

### 2.6 US-TASK-06 — Control notifications and destinations

As a user, I want clear notification settings so that messages reach the right place with an appropriate level of noise.

- The user can inspect and change the authorized destination and relevant notification settings without relying on the assistant to remember them informally.
- Task timing and timezone remain visible; changing the destination or timezone shows the resulting settings and any effect on pending work.
- Unchanged or repeated findings can remain quiet when they add no useful information, while an explicit request such as “Send my balance every day” still receives its requested update.
- The user can change or pause ongoing-task and proactive notifications, with the scope of the control clear; exact defaults, frequency limits, and quiet-time behavior remain proposed decisions.

### 2.7 US-TASK-07 — Understand progress, results, and failures

As a user, I want to inspect delegated work after leaving chat so that I know what ran and what happened.

- A task can become due and run without another user message, and its standing request and required outcomes remain available across service restarts.
- The user can distinguish work waiting to run, work underway, an available result, and a failed or interrupted attempt; exact status labels are a design choice.
- An outcome shows when work ran, what evidence and coverage supported the result, and a useful explanation when execution or delivery failed.
- Failed delivery is not presented as successful notification, and interrupted work is not presented as a completed analysis; retry and recovery behavior is made clear under the chosen policy.

### 2.8 US-TASK-08 — Understand access and connection changes

As a user, I want tasks to respect changed access so that disconnected sources and destinations do not retain authority through queued work.

- When a source disconnects or loses required permission, affected tasks identify the missing access and cannot fabricate a result or silently substitute zero.
- Before publication, the product respects the current task state, source permissions, notification settings, and authorized destination rather than relying only on queued state.
- When partial information remains useful, the result makes its available coverage and gaps explicit under the chosen task policy.
- After access is repaired, the user can see whether the task can continue and what action is required; reconnecting is not represented as proof that missed checks ran.

## 3. Acceptance evidence

- Demonstrate a daily digest, a flexible user-defined task, a supported periodic risk check, and an independently surfaced useful finding with evidence and visible controls.
- A saved recurring task starts automatically when it becomes due and produces an authorized result without another user message. Asking for an immediate check alone does not demonstrate recurrence.
- After the originating chat closes and the service restarts, the standing task and saved outcome remain available. The user can distinguish retained state from work that has actually completed.
- Exercise task edits, pause, resume, removal, notification changes, changed destinations, and source disconnection with pending work; verify the visible result against the selected policies.
- Show a useful partial result, a no-change watch that stays quiet, an explicitly requested daily update that still sends, and honest execution and delivery failure states.

## 4. Open product decisions

| Area | Decision needed |
| --- | --- |
| Timing | Exact cadence per task, morning time, timezone selection, travel and daylight-saving behavior, and overdue checks. |
| Risk and initiative | Risk definitions, claim-specific freshness, relevance criteria, precision measures, repeat suppression, and notification-frequency limits. |
| Controls | Task-management interface, notification-setting scope, quiet times, and defaults for independent initiative. |
| In-flight changes | Effects of edits, pause, removal, and destination changes on queued work, pending results, and delivery already underway. |
| Recovery | Retries, overlapping checks, interruption, restart, repeated delivery, and how uncertain delivery is shown. |
| Limits | Monitoring and analysis budgets, behavior when limits are reached, partial-result policy, and retained task/outcome history after removal. |

The [technical companion](../design/tasks.md) lists concrete proposed choices for these policies without selecting new operating guarantees.
