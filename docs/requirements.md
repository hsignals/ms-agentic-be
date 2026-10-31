# MyStacks 2.0 Requirement Spec

MyStacks aims to become a **personal investing agent**. It must provide professional, personalized assistance that helps users understand their combined portfolio and make better-informed decisions.

- **Phase 1** focuses on financial information, analysis, and proactive monitoring through read-only access to connected assets.
- **Phase 2** introduces execution as a separate product expansion.

These requirements define the intended product behavior and business context. They do not claim that the capabilities are implemented or select an architecture, runtime, hosting service, or integration technology.

The [user stories](user-stories/README.md) develop the complete Phase 1 experience. The [technical designs](design/README.md) describe how the accepted architecture can support those stories, with detailed product and implementation choices still open.

## 1. Purpose and users

### 1.1 Primary outcome

Users must be able to understand their holdings, positions, performance, and risks across supported sources as one portfolio. Personalized research and proactive information must support that understanding.

The assistant must handle broad requests **within wealth and assets**, rather than require users to choose from a fixed list of intents. It must remain focused on that domain and decline unrelated work, such as researching recent NBA games.

### 1.2 Intended users

The product must serve:

- Self-directed investors with assets across wallets and exchanges.
- Active traders managing leveraged positions.
- Long-term investors with crypto and traditional assets.

Audience scope is broader than initial data coverage. Serving a user with traditional assets does not imply that every brokerage connection is available in Phase 1.

## 2. Product phases and authority

### 2.1 Phase 1 informational scope

The assistant must explain holdings, portfolio changes, risks, and options using available evidence. It may research assets, analyze supplied documents, calculate hypothetical scenarios, and produce concise reports directly in chat.

Phase 1 must exclude **specific buy, sell, or rebalance recommendations** and **execution of financial actions**. For example, the assistant may explain how a market decline would affect a portfolio, but must not turn that analysis into an instruction to sell a particular asset.

**Read-only access** applies to financial accounts and assets. The assistant may still create reports, retain user-specific memory, maintain informational tasks, and send messages within the product scope.

All financial credentials and operations available to an execution must enforce read-only financial access. An execution must never access another user's private data or credentials. User instructions, added capabilities, and analysis code must preserve these boundaries.

### 2.2 Phase 2 direction

Phase 2 is intended to introduce **smart accounts and automated financial actions**. Its execution authority, approval requirements, and action limits remain undecided.

Specific investment recommendations remain deferred pending the business's **licensing decisions and requirements**. Execution and investment recommendations require **separate scope decisions**; Phase 2 does not settle both together.

## 3. Connected assets and unified portfolio

### 3.1 Coverage

**Phase 1 target sources** are EVM and Solana wallets and accounts at Binance, Coinbase, Interactive Brokers (IBKR), moomoo, and Robinhood for a mixed/global audience. Hyperliquid remains in scope at low priority. Connections must support the informational experience without requiring financial execution authority.

**Hyperliquid support is low priority.** It remains in product scope; delivery sequencing is not selected.

Actual availability depends on the provider-supported region, account, and capability. A target source does not promise every account type, instrument, balance, position, or update frequency. The connection experience must show supported coverage, regional limits, and unavailable or unsupported information clearly. The [portfolio design](design/portfolio.md) owns the integration baseline and its coverage limits. Interactive Brokers account-update timing and moomoo coverage outside the US and Canada remain unresolved against the current-portfolio and mixed/global targets.

**EVM and Solana wallet connections require wallet-control verification.** The user must connect a supported wallet on the companion website and sign a readable off-chain message. Only after the backend verifies control may MyStacks save the wallet as a tracked connection and start importing its portfolio data. Entering an address, connecting a wallet without signing, or supplying a file must not establish a verified connection; chat and scheduled tracking must enforce the same boundary.

Verification enables read-only portfolio tracking without granting transaction or token-approval authority. Once connected, routine reads and monitoring must not require daily signatures or an open wallet app. A short-lived verification attempt does not determine the lifetime of the established connection; disconnecting stops future reads through that connection.

Hyperliquid setup must offer eligible EVM wallets the user has already verified, without requiring another wallet-control signature. Users may instead connect and verify another supported EVM wallet with a readable off-chain message, then confirm the actual Hyperliquid account address and supported account information they want to include. A public address alone does not establish an authorized connection.

**Deferred connections** include Bybit, Upbit, and prediction-market connectors. General financial questions and research about those sources or markets remain within the informational scope. Further exchange and brokerage expansion remains future coverage; exact supported chains, protocols, wallet types, account types, and instruments remain provider-dependent.

### 3.2 Portfolio understanding

The assistant must combine current provider-supplied holdings and positions across supported connections into a coherent portfolio view. Users must be able to ask about the combined portfolio and understand the contribution of individual sources.

“Full portfolio” means the **supported, connected or user-supplied portion** of the user's assets. It must not imply knowledge of accounts or assets the user has not connected or supplied.

The experience must support questions about:

- Total holdings and positions across connections.
- Portfolio composition and concentration.
- Portfolio changes, including changes over 24 hours when provider history and inputs support the comparison.
- Position risks, including proximity to liquidation where supported data is available.

These are examples of required outcomes, not a complete intent catalog. **Portfolio values default to USD**, with native asset quantities preserved. Choosing another display currency is low priority. Value changes must be distinguished from investment gains and losses: separate deposits and withdrawals when the available evidence supports it, and describe a balance change as a balance change when investment performance cannot be established. Exact valuation and performance formulas remain provider-dependent design decisions.

Phase 1 uses available provider data and code-based calculations on a best-effort basis, without operating a MyStacks indexer. Reuse suitable provider-calculated values and fetch the evidence needed for the requested calculation. Common definitions and reusable calculation code must keep website, chat, and scheduled results consistent. Historical P&L and reconstruction that require MyStacks to collect its own history or operate an indexer are deferred at low priority. Provider-supplied historical data and metrics remain usable when their coverage and inputs support the requested answer; unavailable history must not be reconstructed through new indexing infrastructure in Phase 1.

## 4. Conversational experience and personalization

### 4.1 Open-ended financial work

The assistant must interpret requests expressed in natural language and **combine available capabilities** to complete informational work within wealth and assets. Supported work must extend beyond retrieving a single predefined answer.

Supported work may combine authorized data retrieval, available-source web research, file processing, and code-based calculations. Analysis can retrieve additional authorized data as needed rather than depend on a fixed dataset supplied before it starts.

Users must be able to ask general financial questions before connecting a financial account. When relevant, the assistant must use available connected or supplied portfolio information and preserve the understood scope across follow-up questions.

Examples include researching an asset, interpreting an uploaded statement, calculating a portfolio scenario, and producing a concise chat report that combines account information with relevant research. When a request is materially ambiguous, the assistant should clarify what the user wants. When the user explicitly requests unavailable information or an unsupported action, it must explain the limitation and offer a useful supported alternative.

Financial file analysis is **low priority**. When a user uploads a file without instructions, the assistant must ask what they want to do with it and clarify intent before analysis. Clear accompanying instructions guide the work without an unnecessary clarification step.

Adding a relevant skill or tool should let the assistant handle new requests **without requiring a new hard-coded intent** or rewriting the general system prompt for each feature. The product's domain and authority boundaries must continue to apply to new capabilities.

### 4.2 Interaction surfaces and responsiveness

**Chat is the default assistant surface after required signup.** The website provides signup and a persistent dashboard for financial connections, messaging channels, and portfolio previews. New and returning users use the same **Add account** flow. The launch chat channels are **iMessage and WhatsApp**, with **iMessage as the priority channel**. Both support user-initiated chat and one-off requested analysis or background work. User-created schedules and proactive reports are supported only in iMessage; WhatsApp schedules, proactive work, and template messaging are deferred. Task management remains in the originating iMessage chat; the website manages channel links, and web and supported chat controls manage the same **proactive insights** setting for iMessage. WhatsApp replies and requested results remain subject to its current provider messaging window.

**Phase 1 replies and reports are text-first, concise, precise, and readable in chat.** Answers, research summaries, scheduled updates, and proactive messages lead with the main finding and include key numbers, relevant evidence, and only the explanation needed to understand them. Short paragraphs and bullets support reading; follow-up questions provide deeper detail. Concision must preserve information needed to answer correctly rather than impose an arbitrary word limit. Image replies are low priority. Extensive deep-research reports and polished website report artifacts are deferred; available-source research, substantial calculations, and background work remain in scope.

Onboarding follows **phone/SMS signup → dashboard**. From the dashboard, users may connect financial sources and link messaging channels in either order. A verified channel link is required before assistant chat; financial connections remain optional. The searchable chooser presents supported sources, with a **Connect a wallet** option and **Skip for now**. For a supported exchange or brokerage, the user completes the provider’s secure authorization flow and returns to the dashboard with connection status and coverage. Financial authorization may use mobile web or provider apps; required setup steps depend on the supported source and provider. After a connection, users can choose **Add more** or **Continue to chat**; adding one account does not end setup automatically. The same dashboard remains available for later additions.

Once useful portfolio data is available after connection, the website must show a preview of available value, holdings, and positions with their included accounts, without waiting for every connected source. Users request portfolio answers in chat. Failed or cancelled setup preserves completed connections and offers an explanation, retry, another source, or continuation in chat from the same dashboard.

Financial sources can be removed only on the website; chat requests link to the dashboard. Removal stops future reads and excludes that source from the current portfolio, while other connections keep working. Past reports remain subject to their retention policy. Reconnect is requested only when the provider requires user action; supported renewal happens automatically, and temporary provider outages show unavailable status.

For supported research or analysis that takes longer, the assistant should provide a **useful initial response quickly** and continue the work afterward. It must make clear when work is ongoing and return a concise chat result when it is ready, subject to current delivery controls and the uncertain-send limit in Section 5.3. Significant execution work does not require a lengthy user-facing report. Exact response-time targets remain open.

For longer work, the assistant must briefly acknowledge the request and describe the intended work. The user may leave chat and receive the result there later, ask for status, or ask the assistant to stop. Progress messages should be sent only for meaningful updates. If the work cannot be completed, the assistant must explain the outcome.

Longer work must continue independently while the user chats. The main agent initially permits **five outstanding subagent runs it has spawned per chat**, counting queued and running work. Terminal runs do not count. Scheduler-started occurrences are outside this delegation limit and follow Section 5.2. When the delegation limit is reached, the assistant must explain that the user can wait or cancel existing delegated work before it starts another subagent. Each chat can list, check, or cancel only jobs originating in that channel, and results remain in that channel. New chat messages must not automatically redirect or cancel a running job. Jobs can complete, fail, or be cancelled. The assistant must acknowledge a cancellation request promptly and suppress results that have not yet been sent, including late completions. It must confirm stopped execution or a terminal cancelled outcome only when known; status remains queryable without a required second routine notification. Stopping active computation is best effort, and in-flight provider requests may finish and incur cost. Exact interruption mechanics remain open. Steering a running job is deferred at low priority.

The main conversational agent may delegate background work and continue handling other messages. Background results may be intermediate data or findings: their return must let the main agent continue analysis, combine results, use further tools, or answer the user without requiring another user message. The main agent owns the user-facing reply and judges whether the request is answered. Subagents perform their assigned work without spawning further subagents or changing user settings, personal memory, connections, or saved tasks. Final replies enter the originating conversation so follow-up questions have them in context.

Within each channel, foreground turns run in order. Messages arriving during a foreground turn wait for the next turn and may be handled together; they do not wait for independent background work. Phase 1 accepts that a service interruption can leave an acknowledged foreground message without a reply, requiring the user to retry. The [runtime design](design/runtime.md) owns the execution and recovery limits.

### 4.3 Long-term personalization

The assistant must **automatically remember useful personal context**, including goals, preferences, and relevant context the user shares, and use it when relevant across conversations. The user must not need to issue a separate instruction for every useful detail.

When a clear new user statement updates an older personal fact, the assistant must update the shared memory automatically. When conflicting context is unclear and materially affects the answer, it should ask for clarification. Assistant interpretations or guesses must remain distinguishable from user-confirmed facts. Concurrent changes to different profile fields must be preserved; for the same field, the last successfully saved update wins, even when a slower turn saves an older statement after a newer correction or deletion. These update rules do not make remembered financial statements authoritative current account evidence.

In chat, users must be able to inspect the saved personal profile, correct it, remove a specific saved detail, or clear the profile. Forgetting updates only that profile; conversation history and compact summaries remain unchanged. Users accept that retained context may still influence an answer or cause a fact to be remembered again. The assistant should avoid recreating deleted entries merely from older history, but this is best effort. Confirmations must describe removal from saved memory rather than erasure from all agent context or deletion of conversation, financial, or provider records. Selection and retention details remain open. Remembered information must not expand the assistant's Phase 1 authority or override current account evidence.

### 4.4 Signup and channel continuity

Users must sign up before any assistant chat. The primary signup and login method is a **phone number verified by an SMS code**, linked to a stable MyStacks account. Only phone verification is required for MyStacks signup; name, goals, and preferences are optional and may be learned through chat. Financial providers may request their own setup information. Each account has one primary verified phone number, and a phone number belongs to one account at a time. Phone-number changes, lost-number recovery, and email recovery are low priority. An authorized number change must preserve the account and its state; recovery evidence and safe number-reassignment handling remain open.

Messaging channels are separately verified links to that account. The dashboard offers QR codes and **Open iMessage** or **Open WhatsApp** buttons to open the linking flow on the chosen device. The user sends the prepared linking message; copying the recipient and message provides a fallback. Successful verification changes the website status to **Connected**. Opening a link or scanning a QR code alone does not verify a channel. WhatsApp-based login is deferred. Matching phone numbers or email addresses must not implicitly link or merge accounts or channels. Signup identity, channel access, and financial connection authority remain distinct.

Each linked channel has its own conversation history, current context, background jobs, and results; user-created schedules belong to iMessage. Chat can inspect or manage only work supported in and originating from that channel and cannot select another delivery channel. WhatsApp cannot create, list, or manage iMessage tasks; a scheduling request there must explain the limitation and direct the user to linked iMessage without creating or retargeting work. Useful personal memory and financial connections are shared across the account; facts learned in one channel may help another. Memory corrections and forgetting apply account-wide. Shared memory must not act as a copy of channel transcripts, task logs, or results. Cross-channel work and conversation handoff are deferred.

Messaging channels are added and disconnected on the website; chat may explain these settings and link to them. Disconnecting a channel preserves the account and shared data but suppresses its pending deliveries. Disconnecting iMessage also pauses its scheduled tasks. Relinking does not resume those tasks automatically; users resume them from iMessage. A message from an unlinked sender receives a signup or sign-in link into the same onboarding flow before assistant conversation begins.

Financial connections remain optional, so a signed-up user with a linked channel can ask general financial questions without connecting an account. Supported sender identities and verification mechanisms remain architectural choices. Account deletion is deferred; export and broader retained-data controls remain proposed capabilities.

### 4.5 Human support

Users must be able to request a real person in chat during published support hours and receive the human reply in the originating channel. The product must show support hours and timezone, distinguish a waiting request from a human taking over, and provide a clear out-of-hours response. Staff receive only the context needed for the issue within the account and channel boundaries. Human support must preserve Phase 1 financial authority.

**One owner controls the conversation.** When a human takes over, automated replies and task reports wait until staff explicitly return control to the assistant; a new inbound message does not resume AI replies. Requested analyses and user-created schedules continue and save their results during human ownership. Proactive investigations do not start while iMessage is unavailable for automated delivery, including while a human owns that conversation. Results from already-running proactive work must not interrupt the human conversation. On explicit return, the main assistant handles pending results, checks their usefulness and current eligibility, and uses their actual timestamps and current evidence. Handoff does not itself cancel or restart requested work.

The accepted [human-support story](user-stories/assistant.md#27-us-chat-07--reach-human-support-during-support-hours) owns the experience in both channels. [The ownership decision](ADRS/0022-human-support-conversation-ownership.md) selects Bird Conversations for Apple-channel staff support; the WhatsApp support integration remains to be verified. Staffing, hours, and response expectations remain open in [the TODO list](TODO.md#2-human-support).

## 5. Proactive information and ongoing tasks

### 5.1 Examples of ongoing financial work

The product must support flexible financial work, including **risk information** and a **daily morning portfolio digest**. These are examples of the general task and proactive-message capabilities, not a fixed task catalog the user must choose from.

Risk alerts must communicate relevant, evidence-based information about the user's assets or positions. Examples include a leveraged position approaching liquidation or a substantial decline affecting a concentrated portfolio holding.

The morning digest must summarize portfolio changes and explain information relevant to the user's portfolio. Users choose its time using the scheduling behavior below; detailed content remains open.

### 5.2 User-defined ongoing tasks

In **iMessage**, users must be able to delegate **ongoing informational tasks in natural language**, such as asking the assistant to watch portfolio concentration and report material changes. These tasks must be flexible within wealth and assets rather than limited to a fixed catalog. WhatsApp supports one-off requested work; scheduling there must explain that schedules are deferred and direct the user to linked iMessage without creating or managing tasks on their behalf.

When the request is clear and supported, the assistant must create the task immediately and confirm what was scheduled without an extra approval step. It must ask a follow-up only when needed to resolve material ambiguity.

User-created recurring tasks initially have a **minimum one-hour interval** and a limit of **five enabled tasks per iMessage chat**. Paused tasks do not consume the enabled-task quota; creating or resuming a task must respect it. Both limits are configurable. If the requested recurrence is shorter than an hour, explain the limit and offer hourly execution without silently changing the user's request. Ordinary chat and explicitly requested one-off work are unaffected.

Each eligible scheduled occurrence starts an independent background agent run, outside the main agent's five-subagent delegation limit. Admission does not check whether that saved task's previous run has finished; occurrences may run in parallel. Worker availability still governs when queued work begins. The [task design](design/tasks.md) owns the operating assumptions and execution details.

In iMessage, users must be able to list their iMessage tasks, see what each does, its schedule and active or paused status, and ask for more detail. Clear requests to change, pause, resume, or cancel a task must take effect with a concise confirmation; an ambiguous task reference requires clarification. Task creation fixes delivery to that channel, without a destination selector or automatic cross-channel fallback.

Detect and save the device timezone **once during website onboarding**. Users explicitly change their personal default in the **web app or chat**; automatic re-detection on later website visits is deferred. A timezone specified in a task request applies to that task without changing the personal default. Existing tasks keep their assigned timezone unless explicitly edited; a changed default applies to new tasks. Ask for a timezone only when it cannot be determined. Scheduling confirmations include the time and timezone. For requests such as “every morning,” clarify the time when it is not already known. Exact daylight-saving and recurrence mechanics remain open.

Task edits apply to future runs; an active run continues its original instructions unless cancelled. **Pause** stops future runs and holds automatic results that have not started sending. **Resume** continues at the next scheduled time without a missed-update backlog. **Cancel** ends the recurring task and requests cancellation of all its queued and running occurrences. Past results remain accessible within that channel. Exact stopping effects on in-flight operations remain open.

Scheduled results must use the originating channel around the selected time, identify the task, and support follow-up questions, within the accepted best-effort delivery limits. A known temporary execution failure gets **one automatic retry**, for at most two execution attempts of that occurrence. If it still fails or the requested update otherwise cannot be produced, the main agent gives a brief explanation and any required user action without repeating identical failure notices. An isolated failure keeps the recurring task active. An explicitly requested daily summary must still send a short update when little has changed. Transient-error classification, retry delay, and retries after definitive transport failures remain implementation choices; delivery failure must not restart successful investigation work. Ambiguous submission follows Section 5.3.

Each task must durably retain its **intent, current status, user, originating channel, and trigger**; its channel fixes the delivery destination. This standing request must remain distinct from individual execution attempts and their outcomes. When that channel disconnects, pause the task without rerouting; relinking alone must not resume it.

When a financial source is disconnected, continue a task only if the remaining authorized data still fulfills its intended request. Otherwise pause the affected task and explain why once in its originating channel. Reconnecting the source leaves that task paused until the user explicitly resumes it from that channel; resume uses the next scheduled time without a backlog. A temporary provider outage follows the failure-recovery behavior rather than being treated as an explicit source disconnection.

The assistant must keep ongoing work within the same domain and informational boundaries as conversational work. It must explain when a requested task falls outside that scope or cannot be supported.

### 5.3 Independent initiative and user control

Beyond explicit user tasks, the assistant may **independently surface information** based on the user's portfolio, goals, and remembered interests. Proactive messages require strong evidence of something meaningfully new and useful that meets relevance and attention criteria. They must briefly explain why the finding matters to that user. Any conclusion about the user’s current exposure requires fresh or near-fresh relevant account state under Section 6.2; without it, the assistant must avoid that dependent conclusion.

Proactive investigations begin within **defined financial scopes**. The assistant may reason and choose useful research or analysis within those scopes; their exact coverage requires financial and provider research. This scope selection does not restrict user-created financial tasks to a fixed catalogue.

**High precision takes priority, accepting lower recall to avoid spam.** Suppress uncertain, minor, repetitive, and low-value findings; stay quiet when nothing qualifies. Resurface a finding only when an important change or new useful evidence warrants it. Exact criteria and thresholds depend on provider evidence and later design, without a numeric precision guarantee. This attention filter governs unsolicited initiative; explicitly scheduled updates follow the user's request, including quiet-day summaries.

**Proactive insights are available only in iMessage.** Linking iMessage enables them by default, subject to applicable channel permissions. Users can enable or disable them through the dashboard or supported chat controls; both surfaces update the same account-wide **proactive insights** setting and confirm changes. A clear request such as “No proactive messages” disables it, stopping future proactive investigations and suppressing unsent findings, including results from running work. WhatsApp cannot be selected for proactive delivery, and linking WhatsApp does not enable proactive work. Explicitly scheduled tasks retain their own controls. There is no user-facing fewer/more setting for proactive messages.

A proactive investigation requires enabled insights and a verified iMessage link currently eligible for automated delivery. Investigate once per account and check eligibility again before sending the qualifying insight to iMessage. Human ownership of iMessage makes automated delivery there unavailable. Skip checks while delivery is unavailable without a catch-up backlog. Disconnecting iMessage disables proactive delivery without choosing another channel; relinking does not resume its paused user-created tasks.

Proactive findings already sent, their timing, and their supporting evidence must inform later investigations so the assistant can judge meaningful change and avoid repetition after setting or channel-link changes. This account-level notification history is separate from personal memory and channel transcripts. Record delivery outcomes so an unsent finding is not treated as a delivered notification.

Before delivering task results, the product must respect **current permissions, task status, conversation ownership, and channel binding** rather than rely only on the state captured when work was queued. Future-only edits preserve the active run's original instructions, while current pause, cancellation, and access controls still govern its actions and delivery. A message already submitted to its provider may not be recallable. Use provider-supported idempotency or delivery-status checks when available. If submission remains uncertain, record that outcome and do not automatically resend blindly. Keep the saved result available when the user asks, accepting that it may not arrive automatically. Delivery failure must not rerun completed analysis. Exact provider integration and retries after definitive send failures remain architectural decisions.

### 5.4 Monitoring target and accepted limits

Independent proactive checks target **approximately five investigations per eligible account per day**, with randomized start times between **9 AM and 9 PM in the user's saved timezone**. Times vary across users and occurrences. This is periodic investigation, not continuous monitoring, and a configurable target rather than an exact quota. The window governs investigation starts: a check starting at 8:58 PM may deliver a qualifying result at 9:03 PM. Eligibility and current permissions still apply before delivery.

Only one proactive investigation may be active per account. Skip overlapping or missed occurrences rather than building a catch-up backlog. If an investigation fails, record the failure internally and wait for the next scheduled check, without an automatic whole-investigation retry or a routine user failure message. Delivery failures must not restart the investigation. The uncertain-send limit in Section 5.3 applies; retries after definitive delivery failures remain open.

User-defined monitoring tasks use their confirmed schedule and timezone. Their failure and quiet-day behavior remains as defined in Section 5.2. Checks and delivery are **best effort** rather than high-frequency or comprehensive. Some qualifying events, including approaching liquidation, may be missed within the accepted Phase 1 operating limits.

**Precision takes priority over recall**: avoiding incorrect alerts matters more than detecting every qualifying event. The assistant must also minimize unnecessary or repetitive notifications. Numeric precision targets, risk thresholds, and alert-frequency limits remain open.

Each eligible proactive check runs an agent investigation within its defined scopes. Monitoring and deeper analysis must operate within time and resource budgets; numeric limits remain open.

## 6. Information quality and transparency

### 6.1 Evidence and uncertainty

The assistant must ground portfolio statements, calculations, and risk claims in **available evidence**. It must distinguish reported information from assumptions, hypothetical scenarios, and uncertain conclusions. It must not invent holdings, positions, prices, or execution outcomes.

Financial evidence must identify its **source, source as-of time or unknown freshness, retrieval time, coverage gaps, and native values and units**. Retrieval time must remain distinct from when the source observed the account state; fetching a delayed observation now does not make it current. Conversions and aggregation must preserve enough of that evidence to explain the result. The post-connection portfolio preview, chat, reports, and digests must use consistent backend financial evidence. Personalization memory remains separate and must not become the source of current holdings, prices, or account permissions.

The informational scope applies equally to requested answers, generated reports, scheduled work, and unsolicited messages. Professional behavior must come from accurate explanations, relevant information, and clear limits rather than confidence unsupported by evidence.

### 6.2 Incomplete or stale data

For **current portfolio analysis** and account-specific proactive insights about current exposure, the assistant must obtain the latest relevant account state at analysis time. Brief reuse is allowed when that state remains fresh or near-fresh for the claim. Fresh market prices do not make older holdings or positions current. Exact reuse windows, maximum evidence age, and service-level targets remain open.

When timely account evidence is unavailable, the assistant must avoid proactive current-exposure conclusions that depend on it. For user-requested answers, including scheduled work, it must give the best useful supported answer and briefly explain material timing or coverage limits. Delayed observations remain usable for accurately dated historical or reporting claims. These limits must not block unrelated answers or add routine missing-data warnings; when the user explicitly asks for unavailable information, explain what is unavailable and offer the closest useful answer.

Answers must describe their actual scope naturally, such as “Across your connected accounts,” and must not imply unsupported completeness or present earlier observations as fresh. Unavailable data must not become a **zero balance or absence of risk**. Financial evidence retains source, freshness, and gap information; connection and portfolio views show loading, unavailable, or unsupported states where applicable.

Useful partial information is preferable to withholding an answer until every connected source is current. The assistant need not append a list of missing sources to an otherwise supported answer.

### 6.3 Retained analysis and follow-ups

The product must **retain useful analysis data** for authorized follow-up questions, including provider inputs actually used, reusable intermediate calculations, final results, and supporting evidence. Examples include provider-supplied transaction or trade history, price and position datasets, and cleaned or joined analysis files. Keep the retained material associated with its account, originating channel, and analysis, with enough source and timing context to identify what it supports. Retained analysis remains separate from shared personal memory and does not expose another channel's work.

Be conservative about discarding useful data; **automatic pruning is deferred**. Provider-specific retention rights, privacy constraints, and current authorization still apply. Saved or retrieved time does not replace source as-of time: retained data can support historical or follow-up analysis but does not remove the fresh-evidence requirement for current claims. This retention does not create a continuous portfolio-history archive, guarantee exact replay of an analysis, or require every scratch file or log to persist.

## 7. Product priorities and business constraints

### 7.1 Priorities

| Area | Required priority |
| --- | --- |
| Core value | Unified portfolio understanding and better-informed decisions. |
| Flexibility | Broad informational work within wealth and assets. |
| Authority | Read-only financial access and informational outputs in Phase 1. |
| Proactivity | Relevant, evidence-based, low-noise information, including user-defined ongoing tasks. |
| Monitoring | High precision ahead of comprehensive recall; best-effort timing. |
| Responsiveness | A useful initial response, followed by deeper work when needed. |
| Continuity | User-specific knowledge that improves assistance over time. |
| Available information | Best-effort useful answers with accurate scope and no routine missing-data warnings. |
| Lower-priority capabilities | Hyperliquid support, financial file analysis, image replies, phone-number changes, lost-number and email recovery, and alternate display currencies are low priority; steering running background work and historical P&L or reconstruction requiring MyStacks-owned history infrastructure are deferred at low priority. |
| Deferred capabilities | Bybit, Upbit, and prediction-market connectors; extensive deep-research reports; polished website report artifacts; automatic timezone re-detection on later website visits; account deletion; WhatsApp-based login, scheduled tasks, proactive work, and template messaging; automatic analysis-data pruning; and cross-channel requested work or task routing from chat. General financial questions and research about deferred sources or markets remain supported. |

### 7.2 Scale and unresolved business constraints

Launch planning assumes **1,000 users**, with a growth target of **100,000 users**. Whether these counts refer to registered or active users remains undefined. Phase 2 authority remains a separate product decision.

The target audience is mixed/global; exact launch regions and provider-supported availability remain open. Operating cost per user, monetization, and other commercial constraints remain undecided. The user target is product context, not a detailed rollout schedule.

## 8. Observable acceptance examples

These examples define product behavior without prescribing an implementation or limiting the request space.

| Situation | Expected behavior |
| --- | --- |
| A user asks a general financial question before connecting an account. | The assistant answers from available information without requiring a financial connection. |
| A user completes phone OTP verification. | The dashboard opens with financial connections and QR/button channel linking available in either order; chat starts only after channel verification. |
| A user connects a supported EVM or Solana wallet. | A verified readable off-chain proof of wallet control is required before saving the connection or tracking its portfolio. |
| A user requests historical P&L unavailable from provider data. | The assistant explains the unavailable evidence; MyStacks-owned history reconstruction and indexing are deferred at low priority. |
| A person starts assistant chat without a MyStacks account. | The product directs them to signup before the assistant conversation begins. |
| A user chats through linked iMessage and WhatsApp conversations. | Each keeps its own conversation, jobs, and results while sharing personal memory and authorized financial connections; schedules and proactive reports are supported only in iMessage. |
| Useful portfolio data becomes ready after connection. | The website shows a preview with Add more and Continue to chat; users request portfolio answers in chat. |
| A returning user wants another financial connection. | The website uses the same Add account flow, preserving existing connections. |
| A user connects a wallet and supported exchange or brokerage accounts, then asks for current total holdings and positions. | The assistant obtains the latest relevant account state, allowing brief appropriate reuse, and presents a supported combined portfolio with its source coverage and any material timing limits. |
| A target source is unsupported in the user’s region or for their account. | The website shows that availability limit without promising unsupported coverage; other supported sources remain connectable. |
| A newly retrieved account observation is delayed while market prices are fresh. | The assistant preserves the account observation’s source as-of time; it does not present old exposure as current, and avoids dependent proactive conclusions. Historical or user-requested supported answers remain available with material limits explained. |
| The user has a supported leveraged position approaching liquidation. | When monitoring detects a sufficiently supported risk, the assistant sends an informational alert, subject to the best-effort timing and recall limits. |
| The user receives a scheduled morning digest in iMessage. | The digest explains supported portfolio changes and relevant developments from available data with accurate scope. |
| The user requests supported financial research requiring several steps. | The assistant gives a useful initial response, continues the work, and returns a concise text report in that chat or explains a limitation; deeper detail is available through follow-ups. |
| The user asks a price question while portfolio research runs in the background. | The main agent answers the price question independently; returned research can trigger further calculations and the final portfolio answer without another user message. |
| Five main-agent-spawned subagent runs are already queued or running in one chat. | The assistant explains the delegation limit and lets the user wait or cancel existing delegated work; ordinary chat and scheduler-started occurrences remain available. |
| The user requests research every minute or a sixth enabled recurring task in iMessage. | The assistant explains the applicable limit and offers a supported interval or pausing an existing task, without silently changing the request. |
| The next occurrence becomes due while the same scheduled task's previous run is unfinished. | The new occurrence is admitted independently and may run alongside the previous one; actual start depends on worker capacity. |
| A requested scheduled run encounters a known temporary execution failure. | It gets one automatic retry. If that also fails, the main agent explains the outcome and the schedule remains enabled. |
| The user asks iMessage for an ongoing portfolio-concentration watch. | The assistant can establish and maintain an in-scope informational task that the user can change or pause. |
| The user returns in a later conversation. | Relevant user-specific knowledge improves continuity and personalization. |
| The user turns proactive messages off. | Future proactive investigations and unsent proactive insights stop; explicitly scheduled tasks continue unless separately paused or cancelled. |
| A proactive investigation starts at 8:58 PM and finishes at 9:03 PM. | It may produce a message after 9 PM if the finding qualifies and current delivery eligibility remains valid. |
| A proactive investigation fails. | The failure is recorded internally; the next normal check can proceed without a routine failure notification or catch-up investigation. |
| The user enables or disables proactive insights in web or supported chat controls. | Both surfaces show the same account setting for linked iMessage; disabling it stops investigations and suppresses unsent findings. WhatsApp cannot be selected. |
| A user links WhatsApp while proactive insights are disabled. | WhatsApp chat and one-off requested work become available; proactive insights remain disabled. |
| A user asks WhatsApp to schedule or list a morning digest. | The assistant explains that WhatsApp schedules are deferred and directs the user to linked iMessage without creating, retrieving, or retargeting iMessage work. |
| The user asks iMessage what is scheduled or requests a clear task change. | iMessage lists or manages its tasks and confirms the result; edits affect future runs. |
| iMessage is disconnected and later relinked. | Its scheduled tasks pause without rerouting and stay paused until the user resumes them from iMessage. |
| A financial source required by a scheduled task is disconnected and later restored. | The task pauses if remaining data cannot fulfill its request, explains why once, and stays paused after restoration until explicitly resumed from its channel. |
| The user changes their default timezone or names a timezone for one new task. | The new default applies to new tasks; a task-specific timezone affects only that task. Existing tasks keep their assigned timezone unless explicitly edited. |
| iMessage is disconnected while WhatsApp remains linked. | Proactive investigation and unsent delivery stop; neither schedules nor proactive results move to WhatsApp. |
| A user requests a human in iMessage or WhatsApp during or outside support hours. | During support hours, the request reaches staffed support and the human replies in the originating channel. Outside support hours, the user sees availability and how the request will be handled. |
| A human owns the conversation when requested analysis or an iMessage schedule completes. | Requested work continues and saves its result; automated replies and reports wait for staff to explicitly return control. A new user message does not resume AI replies. |
| Staff return control after analysis results have waited. | The main assistant checks pending results for usefulness, their actual timestamps, current evidence, and delivery eligibility before replying; proactive checks skipped during human ownership do not accumulate. |
| The user asks a follow-up about a prior analysis in the same channel. | Useful retained inputs, calculations, and evidence can support the answer within current access and provider retention rights; current claims still require fresh evidence. |
| A user adds money to a connected account. | Supported calculations distinguish the deposit from investment profit; insufficient evidence supports only a balance-change claim. |
| The user asks the assistant to forget all remembered personal context. | The assistant reports the outcome for personalization memory without claiming all other records were deleted. |
| One connected source is unavailable. | The assistant gives a useful answer from available information with accurate scope, without a routine missing-source warning. |
| The user explicitly asks for unavailable account information. | The assistant explains what is unavailable and offers the closest useful answer it can support. |
| The user asks which specific asset to buy or sell. | The assistant explains relevant information, risks, and options while staying outside specific investment recommendations. |
| The user asks for research on unrelated sports results. | The assistant declines the unrelated task and keeps its work within wealth and assets. |
| A relevant new skill or tool becomes available. | The assistant can use it for applicable requests without requiring a separately enumerated intent for each new workflow. |

## 9. Open decisions

| Area | Still to determine |
| --- | --- |
| Data coverage | Provider-supported regional and account availability, wallet eligibility, supported networks, and capability limits within the accepted target sources. Interactive Brokers update timing and moomoo regional coverage remain gaps against the current-portfolio and mixed/global targets. The portfolio design owns the integration baseline. |
| Portfolio measures | Provider-supported metrics, valuation sources, performance formulas, and calculation of external cash flows within the accepted USD and evidence rules. |
| Alert evaluation | Provider-supported risk definitions, evidence and attention thresholds, exact brief-reuse windows, maximum evidence age and service-level targets within the fresh or near-fresh account-state rule, repeat-suppression mechanisms, and any numeric precision targets within the accepted precision-first policy. |
| Interaction details | Supported channel identities, linking verification mechanics, device handoff compatibility, and response-time targets. The [Apple messaging decision](ADRS/0021-apple-messages-with-bird.md) owns the selected integration. [TODO](TODO.md#1-apple-messaging) owns account approval, experience review, exact permitted financial notification scope, and required notices or opt-outs. |
| Human support | Staffing, published hours/timezone, response expectations, out-of-hours handling, and WhatsApp support integration. Bird Conversations is selected for Apple staff support under the [ownership decision](ADRS/0022-human-support-conversation-ownership.md); see [TODO](TODO.md#2-human-support). |
| Account recovery | Low-priority phone changes, lost-number and email recovery, and safe reassigned-number handling. Account deletion is deferred. |
| Task behavior | Recurrence and daylight-saving mechanics, native stopping integration within honest cancellation reporting, transient-error classification and delay for the single scheduled-execution retry, one-off job and definitive delivery-failure retry policies, duplicate handling, and resource budgets. Scheduled admission, parallel occurrences, and quotas are defined in Section 5.2; uncertain-send behavior in Section 5.3; proactive behavior in Section 5.4. |
| Memory | Selection and size budgets for useful context, retention, and native memory integration within the accepted automatic-update, material-clarification, last-successful-save, and profile-only forgetting rules. |
| Business and data policy | Cost, monetization, exact launch regions within the mixed/global target, provider-specific retention rights and privacy constraints, separate retained-data controls, and applicable licensing requirements. Useful analysis retention is defined in Section 6.3; automatic pruning is deferred. |
| Phase 2 | Supported actions, smart-account experience, execution authority, automation limits, and approval behavior. |
| Architecture | Refine the [Mastra and E2B design](architecture.md) within the selected BullMQ/Valkey queue storage, Cloud Run API and worker hosting, [Tiger Cloud PostgreSQL](ADRS/0013-shared-postgresql-storage.md), [Privy with Twilio Verify phone authentication](ADRS/0014-stable-account-and-independent-channel-links.md), persistence boundaries, and recovery policies. Exact framework and identity integration, exclusive coordinator ownership during replacement, service configuration, sandbox configuration, and operating settings remain open. |

Future architecture decisions must be evaluated against these outcomes and accepted limits.
