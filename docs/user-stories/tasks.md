# Scheduled tasks and proactive message user stories

## 1. Scope and authority

**Status: accepted core Phase 1 task and proactive-message UX.** Shared chat behavior in US-TASK-01, US-TASK-02, US-TASK-04, US-TASK-05, US-TASK-06, US-TASK-07, and US-TASK-08 is accepted. Specific risk-story details in US-TASK-03 remain proposed under the governing scope and security requirements. Section 4 identifies open architecture and operating choices.

These stories cover supported **finance-related informational and read-only background work** requested in chat, alongside useful agent-initiated insights. Daily portfolio digests and periodic risk checks are examples of one flexible task experience, not separate task categories or a fixed catalog. The [requirements](../requirements.md) own product behavior. The [architecture](../architecture.md) and [technical companion](../design/tasks.md) remain **tentative pending the overall architecture design round**; the product agreements in these stories remain accepted.

Financial access remains read-only. Results must exclude specific buy, sell, or rebalance recommendations and financial execution. Current portfolio analysis and account-specific proactive current-exposure insights require fresh or near-fresh relevant account state obtained at analysis time; brief appropriate reuse is allowed. Source as-of time remains distinct from retrieval time, and fresh prices do not make old holdings current. When timely account evidence is unavailable, proactive work must avoid dependent current-exposure conclusions. Requested work returns the best useful supported answer with concise material timing or coverage limits; delayed data remains usable for accurately dated historical or reporting claims. The assistant does not add routine missing-data disclaimers, block unrelated answers, fabricate evidence, or treat missing data as zero or proof of no risk.

All replies and reports, including task updates, are **text-first, concise, precise, and readable in chat**. They include the main finding, key numbers, and reasoning needed to understand the result; follow-up questions can deepen the analysis. Substantial calculations, research using available sources, and background jobs remain supported. Image replies are low priority; deep research reports and polished web artifacts are deferred.

**iMessage is the priority channel** and the chat surface for creating and managing user schedules and receiving scheduled results and proactive reports. WhatsApp supports user-initiated chat and one-off requested analysis or background work; its scheduled tasks, proactive work, and template messaging are deferred. Signup is required before assistant chat. The stable account owns tasks, but each channel keeps its own conversation, current context, background jobs, and results; schedules belong to iMessage. Job controls access only the originating channel's work. WhatsApp cannot create, list, or manage iMessage tasks; scheduling requests there explain the limitation and direct the user to linked iMessage. Personal memory and financial connections remain account-wide under the [channel and memory decision](../ADRS/0008-channel-scoped-work-and-shared-memory.md). The main chat remains usable while work runs; the delegation limit in US-TASK-02 is separate from the enabled-schedule limit in US-TASK-01.

Each scheduled task and its results stay in **iMessage**. Phase 1 chat cannot select another destination, transfer work, or retarget a result, including on an explicit chat request. The account's **proactive insights** setting enables or disables eligible linked iMessage only. Website and supported chat controls expose the same setting. Linking iMessage enables insights by default, subject to channel permissions; linking WhatsApp does not enable proactive work. Chat replies and one-off requested work retain their originating channel and current delivery eligibility, including WhatsApp's provider messaging window. Requested schedules follow their chosen times; proactive checks follow US-TASK-04. Checks and delivery are best effort, and some qualifying events may be missed. **High precision takes priority over recall:** missing marginal events is accepted to avoid spam.

## 2. User stories

### 2.1 US-TASK-01 — Receive scheduled updates in chat

As a user, I want scheduled informational updates in chat so that I can understand relevant changes without starting a conversation.

- The user can request scheduled updates in iMessage, using the same task experience as other supported background work. WhatsApp scheduling requests explain that the capability is deferred and direct the user to linked iMessage without creating or managing tasks there.
- For example, a daily portfolio digest summarizes available portfolio changes and relevant developments across supported, connected or user-supplied assets.
- A clear supported request within the task limits creates the task immediately and receives a concise confirmation of its purpose, selected time, and timezone.
- User-created recurring schedules have a configurable one-hour minimum interval in Phase 1. For a shorter request, the assistant explains the limit and offers hourly without silently changing the schedule. Normal chat and explicitly requested one-off work are unaffected.
- The iMessage chat may have up to five enabled user-created recurring tasks. Paused tasks do not count; creating, enabling, or resuming a task must respect the enabled-task limit.
- Website onboarding detects and saves the device timezone **once** as the personal default. The app does not continuously detect timezone or track travel; redetection on later website visits is deferred. The user can explicitly change the personal default timezone in the web app or chat.
- A timezone named in a task request applies to that task without changing the personal default. A changed default applies to new tasks; existing tasks keep their assigned timezone unless explicitly edited. The assistant asks for the timezone when it is unknown and asks for a time for “every morning” when no morning time is known.
- The assistant asks a question when another material ambiguity affects the requested work.
- The update arrives in the creating channel around the selected time on a best-effort basis and identifies the task.
- An explicitly requested daily summary still arrives on quiet or no-change days and can report the lack of change plainly.
- Each eligible due occurrence runs independently. If the same task's previous occurrence is still queued or running, both can proceed in parallel; the new occurrence is not skipped, replaced, delayed behind, or used to cancel the earlier one. Available execution capacity can still delay actual start.

### 2.2 US-TASK-02 — Delegate ongoing work in natural language

As a user, I want to describe a finance-related informational task so that I can delegate supported background work beyond a fixed task catalog.

- The user can request supported finance-related informational or read-only one-off work in either linked chat without choosing a predefined task type or a particular financial provider. Standing schedules are available only in iMessage.
- In iMessage, a request such as “Watch my portfolio concentration and tell me about material changes” can become a standing task when available capabilities support it.
- A clear supported scheduling request in iMessage within the task limits creates the task immediately and receives a concise confirmation of what will run and when. The assistant clarifies only material ambiguity, such as an unclear schedule or scope that would change the work.
- If the request requires unavailable capabilities or falls outside the read-only information scope, the assistant briefly explains the limitation instead of claiming that the task is active.
- The task continues without requiring the user to keep chat open or send another message when it is due.
- For substantial work, the assistant can delegate background work, acknowledge it, and leave chat available for new questions and status requests. Initially, up to five runs delegated by the assistant may be queued or running in one chat; if five are outstanding, it reports capacity instead of accepting a sixth. Finished runs do not count.
- Automatically started scheduled occurrences and proactive checks are excluded from that delegation limit. A new job delegated by the assistant after receiving a scheduled result still counts. Saved recurring tasks follow their separate enabled-task limit.
- When background work finishes, the assistant can combine findings or obtain more evidence before replying in the originating channel. A background result does not have to appear as a separate report, and the assistant uses actual run status when reporting progress.

### 2.3 US-TASK-03 — Receive evidence-based risk information

**Status: proposed details under the governing scope and security requirements in section 1.**

As a user, I want relevant risk information so that I can understand changes affecting my assets and positions.

- The user can schedule supported risk analysis through the same iMessage task experience, including checks for a position approaching liquidation or a substantial decline in a concentrated holding.
- A useful result explains the observed condition and the evidence supporting it, including material uncertainty, without giving a specific investment instruction.
- Monitoring follows the best-effort periodic limits in section 1; a scheduled check does not guarantee that every event will be detected.
- Risk information follows the evidence boundaries in section 1. A claim about a current position or exposure requires fresh or near-fresh relevant account state; a newly fetched delayed observation alone does not meet that requirement.

### 2.4 US-TASK-04 — Receive useful independent initiative

As a user, I want the assistant to surface useful findings so that relevant information can reach me without an explicit watch request.

- When proactive insights are enabled and verified linked iMessage is currently eligible for automated delivery, the assistant investigates defined financial scopes using the user's connected portfolio, goals, and remembered interests to judge relevance flexibly. These scopes do not limit the supported finance-related work a user may request.
- These are periodic investigations, not continuous monitoring. The default targets approximately five checks per eligible account per day, randomly spaced within 09:00–21:00 in the saved user timezone. Times vary across users and days rather than following fixed daily times. This is a configurable product default, not an exact daily quota or a user frequency setting.
- The time window limits investigation starts. A check starting at 20:58 may produce a message at 21:03; finishing after 21:00 does not itself hold the message until morning.
- Only one proactive investigation per account runs at a time. An overlapping occurrence is skipped, and missed checks after downtime do not create a catch-up backlog. Checks do not start while automated delivery is unavailable, including human ownership of iMessage; skipped checks do not accumulate.
- Before drawing an account-specific current-exposure conclusion, the assistant obtains the latest relevant account state or briefly reuses evidence that remains fresh or near-fresh for that claim. If timely evidence is unavailable, it avoids that dependent conclusion; findings supported independently may still qualify.
- The assistant sends an independently identified finance-related finding only when it is meaningfully new and useful, supported by strong evidence, and worth the user's attention. The message concisely explains why it matters and distinguishes observations from material assumptions or uncertainty.
- **High precision takes priority over recall.** The assistant suppresses uncertain, minor, repetitive, or low-value findings and stays quiet when none qualifies, accepting missed marginal events to avoid spam.
- The assistant resurfaces a finding only after an important change or new useful evidence.
- The assistant uses account-level proactive finding and notification history, kept separately from personal memory, to judge repetition after setting or channel-link changes. A finding that was investigated but never sent is distinct from a notification actually sent; recorded delivery outcomes must preserve that distinction.
- A failed or interrupted proactive investigation stays quiet and waits for the next scheduled check without automatically repeating the whole investigation. Requested work keeps its own recovery and failure-notice behavior.
- These insights follow the proactive-message control in US-TASK-06. Explicitly scheduled tasks follow the user's request and their own controls; the initiative attention filter must not suppress their requested results, including daily summaries on quiet or no-change days.
- Each qualifying proactive insight goes only to linked, currently eligible iMessage after delivery checks. The assistant investigates once per account, and the message appears in iMessage history. A result from already-running proactive work must not interrupt human ownership; the assistant may consider it on explicit staff handback only when it remains useful and eligible.

### 2.5 US-TASK-05 — Manage scheduled tasks in chat

As a user, I want to list, inspect, change, pause, resume, and cancel tasks in chat so that delegated work stays under my control.

- In iMessage, a request such as “What are my scheduled tasks?” shows its current tasks with their purpose, schedule, and active or paused status. In WhatsApp, the assistant explains that schedules are deferred there and directs the user to linked iMessage without listing or managing its tasks.
- The user can ask for more detail about that channel's individual tasks, current runs, and available results.
- A clear request to change, pause, resume, or cancel a standing task applies immediately to that task's settings and receives a concise confirmation of the change or resulting status.
- If the intended task is ambiguous, the assistant asks which task the user means before changing it.
- Edits apply to future runs. An active run keeps its original instructions unless the user explicitly cancels it; current financial permissions, channel validity, pause/cancel state, and delivery authority still apply.
- Pausing stops future runs and holds automatic results whose sending has not begun. Resuming continues at the next scheduled time without a backlog of missed updates. Cancelling ends the recurring task and requests cancellation of all its queued and running occurrences; past results remain available in that channel.
- A paused task frees its enabled-task slot. If five other tasks are enabled, the assistant explains the limit instead of resuming it; the user can pause an enabled task to free a slot.
- The user can list, check, and request cancellation of running work only from its originating channel. The assistant promptly acknowledges the cancellation request, cancels queued work, and requests that running work stop. Work already underway may finish; the assistant confirms stopped execution or terminal cancellation only when known. Unsent results, including late completions, are suppressed after the request, and current status stays available on request. A message already submitted for sending may not be recallable. In-flight steering is deferred at low priority; a new message does not promise to redirect a running job.
- Disconnecting iMessage on the website pauses its scheduled tasks, future runs, and pending unsent results without rerouting them. Relinking iMessage keeps its tasks paused until the user explicitly resumes them there. Sends already started cannot be recalled.

### 2.6 US-TASK-06 — Control proactive insights

As a user, I want to enable or disable proactive insights in iMessage so that I can control whether the assistant initiates messages.

- Website settings and supported chat controls expose the same account-wide **proactive insights** setting for eligible linked iMessage. Linking iMessage enables insights by default, subject to channel permissions. WhatsApp cannot be selected, and linking it does not enable proactive work.
- A clear request changes the setting immediately and receives a concise confirmation.
- A request such as “No proactive messages” disables insights, stopping future investigations and suppressing unsent proactive messages, including findings from an investigation already running.
- Disconnecting iMessage stops proactive investigations and pending sends without falling back to WhatsApp. Eligibility is checked before investigation starts and again before each message is sent; human ownership of iMessage makes automated delivery there unavailable.
- There are no fewer/more controls or frequency sliders. Task management stays in chat without a separate task-management webpage.
- The setting affects agent-initiated insights. Tasks the user explicitly scheduled retain their own controls and channel-availability rules.

### 2.7 US-TASK-07 — Receive results and ask follow-ups

As a user, I want scheduled results in chat so that I can understand the outcome and continue the conversation.

- Results arrive in the task's creating channel around the selected time on a best-effort basis and clearly identify the task that produced them.
- An explicitly requested daily summary still arrives on quiet or no-change days, including when the task concerns risk information.
- The user can ask follow-up questions about a result in its channel, using useful retained inputs, reusable calculations, final results, and supporting evidence within current authorization and provider retention rights. Retained data keeps its source and timing context; current claims still require fresh evidence, and automatic pruning is deferred.
- A requested scheduled occurrence gets one automatic retry for a known temporary execution failure, within at most two total execution attempts shared with any interruption recovery. If the retry fails, the assistant gives a concise explanation, identifies any required user action, and avoids repeated identical failure notices. The recurring schedule stays enabled.
- After a service interruption, unfinished requested background work restarts from the beginning only if it is still active and authorized and has no cancellation request, within that two-total-attempt limit. An interrupted attempt counts. Saved completed results are recovered without another user message or repeating successful research or calculation, subject to current access, cancellation, and delivery controls.
- A delivery failure does not repeat successful research or calculation. If sending times out and delivery remains uncertain, the assistant does not blindly resend automatically. The result remains available when the user asks, even if the report does not arrive automatically. Definitive send-failure retry details remain open.
- Completion, failure, and cancellation are terminal run outcomes. Without a cancellation request, the assistant reports the actual outcome and any useful completed findings. After a cancellation request, unsent results remain suppressed even if work finishes; current status stays available on request, and stopped execution is confirmed only when known.
- The user can return to iMessage after leaving chat to inspect the scheduled task's current status and available results.
- During human ownership, requested analyses and user-created schedules continue and save results while automated replies and task reports wait. Only explicit staff handback returns control to the assistant; a new inbound message does not do so. The main assistant then judges pending results for usefulness, uses their actual timestamps and current evidence, and applies current authorization and delivery checks. Handoff alone does not cancel or restart work.
- Exact temporary-failure classification and retry delay, non-interruption retry eligibility for one-off work, ordinary-chat retries, and overdue-result rules remain open within these controls.

### 2.8 US-TASK-08 — Understand source and access changes

As a user, I want task results to respect available access so that I can trust the information they use.

- **Governing evidence boundary:** tasks use available, authorized information and follow the no-fabrication and missing-data rules in section 1.
- **Governing result behavior:** useful partial results do not need routine missing-data warnings. When the user explicitly requested unavailable information, the assistant explains that limitation.
- When a financial source is explicitly disconnected, a task continues only if the remaining authorized data still fulfills its intended request. Otherwise, the assistant pauses the affected task and explains why once in its originating channel.
- Reconnecting the financial source leaves that task paused until the user explicitly resumes it from its originating channel. It resumes at the next scheduled time without a backlog of missed checks.
- A temporary provider outage is distinct from explicit disconnection. An isolated provider failure remains eligible for automatic recovery and does not automatically cancel the task.

## 3. Acceptance evidence

- Create a daily digest, a flexible finance-related task, and a supported periodic risk check through iMessage; clear requests activate immediately with concise confirmations, while material ambiguities receive targeted questions.
- Ask “What are my scheduled tasks?” in iMessage and see its tasks, details, and results; change, pause, resume, and cancel a clearly identified task with confirmation. An ambiguous task identity receives clarification before a change. Ask WhatsApp to create or list a schedule and receive the deferred-capability explanation and direction to linked iMessage, without reading, creating, or changing iMessage tasks. A request to deliver a task to another channel does not create a destination change.
- Continue using chat while independent background runs are active. List runs, check status, and request cancellation only in their originating channel. Verify prompt acknowledgement, cancellation of queued work, requests to stop running work, suppression of unsent late results, and stopped-execution confirmation only when known. Current status remains available on request; already-submitted messages may not be recallable.
- Detect and save the device timezone once during website onboarding. Create a morning task with a known and an unknown morning time, clarify an unknown timezone, and confirm the chosen time and timezone. A later website visit or travel does not automatically change the saved default or assigned task zones.
- Change the personal default timezone explicitly in the web app and chat; new tasks use the changed default while existing tasks keep their assigned zones. Create a task with an explicit timezone without changing the personal default, then explicitly edit an existing task's timezone.
- Edit an active task and preserve that run's original instructions while enforcing current permissions and delivery authority. Pause before sending, resume at the next scheduled time without missed updates, and cancel a recurring task with an honest active-run cancellation outcome.
- Disconnect iMessage and retain its history and tasks while pausing future runs and unsent automatic results without fallback to WhatsApp. Relink it, confirm tasks remain paused, then explicitly resume from iMessage.
- Receive a scheduled result in chat around the selected time, identify its task, and ask a follow-up. The task runs without a new user message or an open chat.
- Keep chat usable after background delegation; accept five queued or running assistant-delegated runs, report capacity for a sixth, and exclude finished runs and automatically started scheduled or proactive runs from that count. A new delegation after a scheduled result does count. A completed job can lead to a combined or further-informed assistant reply in the same channel instead of a separate child report.
- Request a 15-minute recurrence and receive an hourly offer without a silent change. With five enabled tasks and another paused task, enforce the enabled-task limit, free a slot by pausing a task, and then resume the paused task.
- While five delegated jobs are outstanding, admit an eligible saved occurrence independently. Let an hourly task's 09:00 run remain active when its 10:00 occurrence becomes due; both can continue without the earlier run suppressing the later one.
- Show an explicitly requested daily update arriving on a quiet or no-change day. A known temporary execution failure receives one retry; demonstrate retry success and retry failure with at most two total attempts shared with interruption recovery. After failure, give a concise explanation, retain the enabled schedule, and avoid repeated identical notices. A delivery failure does not repeat successful research or calculation.
- Interrupt unfinished requested one-off and scheduled work: restart it from the beginning only if it is still active and authorized and has no cancellation request, count the interrupted attempt, and never exceed two total attempts. Recover a saved completed result after a service interruption without another user message or repeated analysis, subject to current access, cancellation, and delivery controls. If sending remains uncertain after a timeout, do not blindly resend automatically; keep the result available on request even if automatic delivery is missed.
- Enable and disable proactive insights through the website and supported chat controls; verify both surfaces expose the same iMessage-only account setting. Linking iMessage enables insights by default, subject to permissions. Linking WhatsApp leaves disabled insights disabled and never offers WhatsApp as a proactive destination.
- With insights enabled and iMessage eligible, investigate once per account and deliver qualifying insights only to iMessage. Record actual delivery outcomes; WhatsApp chat and one-off requested work remain independent.
- Disable insights before a check starts and during an investigation; verify no investigation in the first case and no unsent proactive message in either case. Disconnect iMessage while WhatsApp remains linked and suppress proactive work without fallback; scheduled tasks retain their own pause and resume rules.
- Show initiative relevance informed by the connected portfolio, goals, and remembered interests. Send a meaningfully new and useful finding only with strong evidence and a concise reason it deserves attention; suppress uncertain, minor, repetitive, and low-value findings, stay quiet when none qualifies, and resurface only after an important change or new useful evidence. Keep requested scheduled results outside this initiative attention filter.
- Exercise the approximately five-check default at varying times in the saved timezone's 09:00–21:00 start window, skipped overlap, and no catch-up after downtime. A 20:58 investigation may deliver at 21:03. A check requires enabled insights and verified linked iMessage currently eligible for automated delivery; requested schedules retain their own controls.
- Keep a failed or interrupted proactive investigation quiet until the next scheduled check without repeating the whole investigation automatically. Keep proactive sent-notification history separate from personal memory and use it after setting or channel-link changes without treating an unsent candidate as a sent notification.
- Show a useful partial result without routine missing-data warnings, an explanation for explicitly requested unavailable information, and no fabricated evidence or missing data represented as zero or no risk.
- Obtain the latest relevant account state for current analysis, allowing brief appropriate reuse. With delayed or unknown-age holdings and fresh prices, avoid dependent proactive current-exposure conclusions; give requested answers with concise material limits and preserve supported historical or unrelated findings. Keep source as-of and retrieval times distinct.
- Explicitly disconnect a financial source: continue a task whose intended request can still be fulfilled with authorized data, and pause an affected task whose request cannot be fulfilled with one explanation in its originating channel. Reconnect the source, retain the pause, and require explicit resume from that channel at the next scheduled time without missed checks. A temporary outage retains automatic recovery without automatic cancellation.
- Receive concise text-first task updates and follow-up replies with the main finding, key numbers, and needed reasoning; use follow-up questions to deepen substantial calculations or research using available sources and useful retained analysis data without treating its saved time as source freshness.
- Let a human take over in either channel while requested analysis continues, and in iMessage while a schedule becomes due. Save results while holding automated replies; a new inbound message must not return control. Skip proactive starts while a human owns iMessage. On explicit staff handback, have the main assistant assess pending results for usefulness, timestamps, current evidence, authorization, and delivery eligibility without a proactive catch-up backlog.

## 4. Open architecture and operating decisions

| Area | Decision needed |
| --- | --- |
| Timing | Exact supported recurrence forms at or above the one-hour minimum, delivery windows, randomized proactive timing mechanics, daylight-saving behavior, and overdue requested work outside pause/resume. Redetection on later website visits is deferred. |
| Risk and initiative methods | Exact financial investigation scopes, supported risk definitions, provider calculations, exact brief-reuse windows, maximum evidence age and service-level targets within the fresh or near-fresh account-state rule, exact attention and material-change thresholds, precision measurement and any numeric target, and detailed repeat handling within the accepted qualitative policy and best-effort limits. |
| In-flight work | Exact stop mechanics and the precise sending boundary within prompt cancellation-request acknowledgement, suppression of unsent late results, and honest stopped-execution confirmation; steering a current run remains low priority. |
| Recovery | Temporary scheduled-failure classification and retry delay within the shared two-total-attempt limit, non-interruption retry eligibility for one-off work, ordinary-chat retries, definitive send-failure retries, and how uncertain delivery is shown. Proactive investigations retain their separate skip-overlap and failure-wait policy. |
| Limits | Global execution capacity, numeric monitoring and analysis budgets, behavior when those limits are reached, and retained task/result history after cancellation. The five enabled-task quota and five assistant-delegated-run limit are distinct; automatically started scheduled and proactive runs are outside the delegation limit. |
| Apple-channel controls | Account approval, experience review, permitted financial notification scope, and required notices or opt-outs remain in the [central TODO](../TODO.md). The [Apple messaging decision](../ADRS/0021-apple-messages-with-bird.md) owns the selected integration; applicable requirements govern delivery eligibility. |

The qualitative initiative policy is accepted; no numeric precision target is guaranteed. The [technical companion](../design/tasks.md) owns proposed mechanisms for unresolved operating policies, to be settled through architecture and evidence; those proposals do not create additional user guarantees.
