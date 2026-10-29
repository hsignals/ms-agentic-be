# Assistant User Stories

## 1. Status and scope

**Status: accepted text-first replies, natural financial questions in `US-CHAT-01`, low-priority supplied-file analysis in `US-CHAT-04`, longer work in `US-CHAT-05`, and staffed human support in `US-CHAT-07`; other detailed stories remain proposed.** The [requirements](../requirements.md) define accepted product outcomes. These stories separate agreed conversational behavior from detailed proposals still to discuss.

The assistant handles broad requests within **wealth and assets**, combining available information and capabilities without requiring users to choose a fixed intent. Website signup with a phone number and an SMS code opens the dashboard, where financial connections and channel linking can be completed in either order; financial connections remain optional. Assistant access requires a verified linked channel. A message before signup receives an onboarding link to that same website flow. iMessage and WhatsApp are the launch messaging channels, each separately verified and linked to the user's MyStacks account. Response-time targets remain open.

Phase 1 provides **read-only financial information and analysis**. It excludes specific buy, sell, or rebalance recommendations and financial execution. The [runtime design](../design/runtime.md) and [architecture](../architecture.md) remain **tentative pending the overall architecture design round**; the product agreements in these stories remain accepted.

**Phase 1 is text-first in iMessage and WhatsApp.** Answers, research summaries, reports, scheduled results, and proactive insights give a concise, precise briefing that reads naturally in chat. Available-source research, significant calculations, generated-code analysis, and background jobs remain in scope; the depth of the work does not require a long response. Image replies are optional later work at low priority. Extensive deep-research reports, polished webpage artifacts, full report pages, and long-form report exports are deferred. There is no separate web chat or report experience in Phase 1.

## 2. User stories

### 2.1 US-CHAT-01 — Ask questions and follow up naturally

**Status: accepted experience; supported sources and response-time targets remain open.**

As a user, I want to ask financial questions in ordinary language so that I can understand my portfolio and relevant financial information without learning a command list.

- After signup, users can ask general financial questions in a verified linked channel before connecting any financial account. A financial connection is needed only for answers that require its account information.
- Each linked channel has its own conversation, history, current context, and compaction. Background jobs, scheduled tasks, and results stay within their originating channel; switching channels does not carry over that work or conversation.
- Useful personal facts, goals, preferences, and financial connections are shared across the account. A useful fact learned in either channel can inform relevant answers in another channel without making its transcript or task records available there.
- Chat can inspect and control only its own channel's jobs and scheduled tasks. Phase 1 offers no cross-channel history lookup, destination selector for requested work, or work transfer, including on request.
- Users can control shared personal memory and preferences and select proactive insight delivery channels in chat. Chat and the website dashboard update the same account setting: iMessage, WhatsApp, both, or neither. Each newly linked channel is selected by default. Insights go only to selected channels, without automatic fallback; with neither selected, proactive investigation and delivery are disabled, including unsent insights.
- To add or remove financial connections or link or disconnect a channel, the assistant links to the website dashboard. The proactive insight delivery channels setting routes only proactive insights; chat replies, requested work, and scheduled work retain their originating channel. Scheduled work does not retrieve another channel's history, tasks, or results.
- The assistant uses connected or supplied portfolio information when relevant, including for questions about holdings, composition, changes, and supported position risks.
- The assistant leads with the answer or main finding, followed by key numbers and only the reasoning and evidence needed to understand it. Short paragraphs or bullets keep the result readable in the channel.
- Follow-up questions provide deeper detail. Concision preserves important reasoning and evidence rather than imposing a rigid word count.
- The assistant gives its best useful answer from available information without routine warnings about missing data.
- When the user explicitly asks for unavailable information, the assistant explains what is unavailable and offers the closest useful answer it can support.
- Answers describe their actual scope naturally, such as “Across your connected accounts,” without inventing figures, treating unavailable data as zero or no risk, or implying unsupported completeness.
- Follow-up questions can refer to the prior answer; if the reference is unclear, the assistant resolves it before drawing a materially different conclusion.
- Quick work completes in the conversation. For longer analysis, the assistant starts background work, briefly acknowledges the intended work, provides useful initial information when available, and frees the conversation for new questions. `US-CHAT-05` describes the accepted longer-work experience.
- If a new message arrives while the assistant is still handling a foreground turn, it remains pending for a later turn; several pending messages may be handled together. The message does not silently steer the active turn.

### 2.2 US-CHAT-02 — Combine research with portfolio context

As a user, I want research that connects relevant information to my assets so that I can understand what may matter to me.

- A request can combine supported portfolio data, available-source research, and significant calculations instead of returning only a predefined response.
- The assistant names or links the sources supporting material claims and distinguishes reported facts, analysis, and hypothetical outcomes.
- If sources conflict or do not support a requested conclusion, the answer explains that limit without inventing agreement or certainty.
- A concise research summary or report leads with the main findings and explains relevant exposure or risks while keeping the user's supported, connected or supplied assets distinct from the wider market. The user can ask for deeper detail in follow-up messages.

### 2.3 US-CHAT-03 — Resolve ambiguity without needless setup

As a user, I want the assistant to clarify choices that affect my request so that the result answers the question I intended.

- If an unclear asset, account, period, or scenario would materially change the answer, the assistant asks a focused question.
- If a reasonable assumption is enough for useful work, the assistant states it and proceeds within the request's scope.
- If the user explicitly requests unavailable information or an unsupported action, the assistant explains the limitation and offers a useful supported alternative.
- If the user corrects the scope or an assumption in the conversation, the next answer reflects the correction and identifies any earlier conclusion it changes. Changes to work already running follow the separate in-flight policy.

### 2.4 US-CHAT-04 — Analyze a supplied financial document, spreadsheet, or screenshot

**Status: accepted experience; low priority. Supported formats, providers, limits, and artifact details remain open.**

As a user, I want to supply a financial document, spreadsheet, or screenshot so that the assistant can explain it and analyze the information I ask about.

- When an upload has no instructions, the assistant asks what the user wants and clarifies the intended work before analyzing it. When instructions are already clear, the assistant follows them.
- The user can supply a supported financial document, spreadsheet, or screenshot and learn which parts were read, which could not be interpreted, and which inputs need clarification.
- The analysis distinguishes supplied information from connected-account evidence, and states relevant dates, values, units, and scenario assumptions.
- **Low-priority artifact detail:** when enabled, an artifact explains the inputs, method, and limits needed to interpret it. The analysis result follows the same concise, text-first contract as other replies.
- If parsing or calculation checks fail, the assistant explains the affected result and does not present it as verified; supported findings can still be returned.

### 2.5 US-CHAT-05 — Receive longer work in chat

**Status: accepted experience with results in the originating channel and an initial five-run main-agent delegation limit; global capacity and in-flight cancellation behavior remain open. In-flight steering is low priority.**

As a user, I want the assistant to continue longer work and return the result in chat so that I can leave the conversation and come back later.

- For a request needing longer work, the assistant starts background work and acknowledges accepted work as appropriate. It explains the intended work and can include useful initial information when available.
- The user can leave chat while the work continues and receive the result later in the same channel.
- Longer work can include research and substantial calculations; its result still leads with the answer or main finding in a concise chat reply, with deeper detail available through follow-ups.
- The main chat remains usable while background work runs, including for new questions and job-status requests. The assistant does not hold the conversation open while waiting for a background result.
- The configurable initial limit is five outstanding main-agent-spawned background runs per chat, counting queued and running work. Completed, failed, or cancelled runs do not count. If five such runs are outstanding, the assistant reports capacity instead of accepting another delegation, whether the user requested it or the assistant chose it. A new delegation after handling a result uses the same quota.
- Scheduler-started recurring and proactive runs are excluded from that delegation quota. User-created scheduled occurrences are independent and can run in parallel even when an earlier occurrence of the same task is still queued or running. The [task stories](tasks.md) own saved-schedule limits and scheduled failure behavior.
- A background result returns to the main assistant for a fresh turn in the same channel. The assistant can check more data, run calculations, combine results from several runs, or end the turn quietly while another run continues; it does not forward every background output as a separate report. Its reply remains available in normal channel history for follow-ups.
- If a result arrives while the assistant is handling another turn, it stays pending for a later turn without changing the current response.
- The assistant gives progress updates when they add meaningful information, without routine chatter. From the originating channel, the user can list background work, ask for status, inspect results, and request cancellation. Another linked channel cannot access or control that work.
- The assistant acknowledges a stop request honestly and does not claim that work has stopped until that outcome is known. Completion, failure, and cancellation are terminal outcomes; exact handling of work and delivery already underway remains open.
- If work fails or reaches a limit, the user sees that outcome, any useful completed findings, and whether further action is needed; a failed attempt is not shown as complete.
- In-flight steering is deferred at low priority. A new chat message does not promise to redirect a running job; changing a standing scheduled task and changing its current run are distinct requests.

### 2.6 US-CHAT-06 — Understand the assistant's authority

As a user, I want clear boundaries so that I can tell which financial help the assistant can provide.

- The assistant supports relevant informational work across wealth and assets, including explanations, research, hypothetical scenarios, and reports.
- If asked which specific asset to buy, sell, or rebalance, the assistant explains the boundary and can provide relevant factual information, risks, or user-defined scenarios.
- If asked to place an order, transfer assets, or perform another financial action, the assistant explains that Phase 1 cannot carry out the action and never claims it did.
- If asked for unrelated work, the assistant briefly explains the domain boundary; adding a new capability does not change these limits.

### 2.7 US-CHAT-07 — Reach human support during support hours

**Status: accepted capability; support hours, staffing, response expectations, and handoff details remain open in the [open decisions](../TODO.md).**

As a user, I want to reach a real support person in chat during support hours so that someone can help when I need human assistance.

- The user can ask for a human in either linked channel and reach staffed human support during published support hours. Forwarding a request to a staff tool alone does not satisfy the handoff.
- Support hours and their time zone are visible to the user, including when asking chat about availability.
- The assistant acknowledges the request and describes it as pending until a human joins; it does not claim that a person is present merely because the request was forwarded.
- Human support replies reach the user in the originating iMessage or WhatsApp conversation. The user can tell whether a reply comes from the AI assistant or a human; using support does not require the user to join a staff tool.
- Support staff receive the issue and the authorized account and originating-channel context needed to help. The handoff does not expose another channel's history, tasks, or results.
- While a human owns the support conversation, human and AI replies must not conflict. The ownership and return-to-assistant mechanism remain open.
- Outside support hours, the user sees the next opening and how their request or contact will be handled. The experience does not promise 24-hour staffing or an unagreed response time.
- Human support does not grant permission to place trades, transfer assets, or perform other financial execution.

Support tooling, including proposed staff use of Slack, remains open. Apple-specific support controls must meet applicable requirements with the minimum necessary controls; the exact controls and their effect on the chat experience remain open in the [open decisions](../TODO.md).

## 3. Observable acceptance examples

These examples exercise the stories without limiting the assistant to a fixed request catalog.

| Situation | Observable result |
| --- | --- |
| The user messages before signup. | The onboarding reply links to website signup/sign-in; assistant access follows signup and verified channel linking. |
| A signed-up user asks a general financial question before connecting a financial account. | The assistant answers from available information without requiring a financial connection. |
| The user switches between linked iMessage and WhatsApp channels. | Each channel keeps its own conversation, history, current context, jobs, tasks, and results while useful personal memory and financial connections remain shared. |
| The user asks WhatsApp to retrieve an iMessage task result or send a task result to iMessage. | WhatsApp cannot retrieve, control, or route work from another channel; the user manages the work from its originating channel. |
| The user asks chat to disconnect a financial source. | The assistant links to the website dashboard, where the user manages that setting. |
| The user selects iMessage, WhatsApp, both, or neither for proactive insights in chat or on the website. | Both interfaces show the same proactive insight delivery channels setting; sends use only the selected channels without automatic fallback. |
| The user links a new channel. | The newly linked channel is selected for proactive insights by default; existing channel choices remain intact. |
| The user leaves no proactive insight delivery channels selected. | Proactive investigations are disabled, and unsent proactive insights are not sent. |
| The user asks about total exposure, then asks which source contributes most. | The follow-up uses the same understood scope and explains each source's contribution. |
| A request needs research, significant calculations, or background execution. | The assistant completes the needed work and returns a concise text reply with the main finding, key numbers, and relevant reasoning and evidence; follow-ups can explore the detail. |
| A scheduled result or proactive insight arrives in chat. | The message follows the same text-first briefing format as a direct answer. |
| One connected source is unavailable but is not needed for the requested research. | The assistant provides supported findings without a routine missing-source warning. |
| The user explicitly asks for a balance that is unavailable. | The assistant explains that the requested balance is unavailable and offers the closest useful supported information. |
| “How did I do?” could mean a balance change or investment performance. | The assistant resolves the distinction needed for a meaningful answer. |
| The user uploads a financial document without instructions. | The assistant asks what the user wants before analyzing it. |
| The user uploads a spreadsheet with a clear analysis request. | The assistant follows the request and identifies any inputs it could not interpret. |
| Longer analysis continues after the user leaves chat. | The result arrives later in the originating channel, with completion, failure, or cancellation made clear and useful completed findings included when available. |
| The user sends another independent request while longer work is running. | The main chat remains usable; independent background work can run subject to the agreed limits, without silently redirecting the earlier job. |
| The user asks for ETH's price and the status of a background analysis. | The assistant answers the price question and checks the analysis's actual job status while the analysis continues. |
| One of two background runs completes, but the other is still needed. | The assistant can end the result-handling turn quietly, then combine both results and any needed calculations when the other run completes. |
| A background result needs another financial check or calculation before it answers the request. | The assistant performs that work in a fresh turn and sends the supported answer rather than forwarding the internal output. |
| A new message or background result arrives during an active foreground turn. | It remains pending for a later turn; the channel has only one active foreground turn. |
| Five main-agent-spawned background runs are queued or running and another delegation is needed. | The assistant explains the current capacity instead of accepting a sixth delegation; terminal runs and scheduler-started work do not occupy a slot. |
| Five main-agent-spawned runs are outstanding when a saved task becomes due. | The due occurrence is admitted independently of that quota, subject to the task's normal eligibility and authority checks; worker start depends on available capacity. |
| The user asks chat to list longer work or report its status. | The assistant lists only that channel's background work or explains a run from that channel. |
| The user asks to stop longer work. | The assistant acknowledges the request, reports the actual outcome, and does not describe work as stopped before that outcome is known. |
| A user requests a specific trade or an unrelated sports report. | The assistant states the applicable boundary and makes no claim of execution. |
| The user asks for a human during published support hours. | The assistant acknowledges the pending request; staffed human support joins and replies in the same channel with a clear human identity. Forwarding alone is not reported as a completed handoff. |
| The user asks for support outside published hours. | The reply gives the next opening, the time zone, and how the request or contact will be handled without inventing a response-time promise. |
| Support staff receive a handoff from WhatsApp. | They receive the issue and necessary authorized account and WhatsApp context without iMessage history, tasks, or results. |
| A human owns the support conversation while an AI reply becomes ready. | Reply coordination prevents conflicting human and AI replies; the user can identify who is responding. |
| The user asks human support to execute a trade. | The support handoff does not expand Phase 1 financial authority or result in a claim of execution. |

## 4. Open decisions

- **Interaction:** follow-up context limits within each channel, progress presentation, and response-time targets.
- **Research:** supported sources, access methods, source attribution format, and claim-specific freshness requirements.
- **Low-priority uploads and artifacts:** supported formats, file and analysis limits, artifact formats when enabled, access duration, and retention.
- **Continued work:** global capacity, exact cancellation and in-flight behavior, unscheduled one-off retry and replay behavior, interrupted-work recovery, and resource budgets. Scheduled failure behavior follows the task stories. In-flight steering remains low priority.
- **Human support:** support hours and time zone, staffing, response expectations, out-of-hours handling, staff tooling and access, handoff and reply ownership, and any Apple-specific controls follow the [open decisions](../TODO.md).

The [portfolio stories](portfolio.md), [task stories](tasks.md), and [memory stories](memory.md) cover the connected experience, ongoing requests, and personalization alongside these conversations.
