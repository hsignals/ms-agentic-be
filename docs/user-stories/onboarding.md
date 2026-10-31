# Onboarding user stories

## 1. Status and scope

**Status: phone signup followed by the persistent website dashboard, channel linking through QR codes or direct buttons, connection experiences, website portfolio preview, and account/channel continuity below are accepted.** Access to general financial questions without connected financial accounts and the controls identified in `US-ONB-07` are also accepted. Choices explicitly marked open remain proposed; phone changes and recovery are low priority, and account deletion is deferred.

The governing [product requirements](../requirements.md) define Phase 1 as read-only financial information, analysis, and monitoring. Onboarding must not grant trading authority or promise specific buy, sell, or rebalance recommendations.

**Website signup and channel linking are required before assistant chat; financial connections are optional.** The user signs up and logs in with a phone number and an SMS code, then lands on the persistent dashboard. They can connect financial sources or link iMessage or WhatsApp in either order; a verified channel link is required only before assistant chat. Only phone verification is required for MyStacks signup. Name, goals, and preferences are optional and can be learned through chat; financial providers may require their own setup. A stable MyStacks account ID owns the user's saved state, and each messaging channel is separately verified and linked to that account.

Chat is the default interaction surface for questions and ongoing work. The persistent website dashboard manages financial connections, messaging channels, and proactive insights and shows an immediate portfolio preview after connection. Supported chat controls can also change the same **proactive insights** setting for eligible linked iMessage. **iMessage is the priority channel**, supporting chat, one-off work, user schedules, and proactive reports. WhatsApp supports user-initiated chat and one-off requested analysis or background work; WhatsApp schedules, proactive work, and template messaging are deferred. Target sources are EVM and Solana wallets and accounts at Binance, Coinbase, Interactive Brokers (IBKR), moomoo, and Robinhood for a mixed/global audience. Hyperliquid remains **low priority**. Actual regional, account, asset, balance, position, and update availability depends on the supported provider; the user sees coverage and limits before confirming a connection. A wallet becomes a connected source only after successful wallet-control verification. Exact supported networks and wallet types remain open. Interactive Brokers update timing and moomoo availability outside the US and Canada remain unresolved target gaps. Bybit, Upbit, and prediction-market connectors are deferred; general financial questions and research about them remain allowed.

The [technical design](../design/onboarding.md) owns implementation proposals and remains **tentative pending the overall architecture design round**. The [account identity decision](../ADRS/0014-stable-account-and-independent-channel-links.md) owns the selected phone-authentication integration; detailed channel verification and recovery policy remain open. Phone-number changes, lost-number recovery, and email recovery are **low priority**. WhatsApp login is deferred; signup uses the website phone-verification flow.

## 2. Experience outline

1. Sign up on the phone-friendly website using a phone number and an SMS code, then land on the persistent dashboard.
2. Choose whether to connect financial sources or link messaging channels first. In **Add account**, search supported sources, choose **Connect a wallet**, or **Skip for now**.
3. To link a channel, scan its iMessage or WhatsApp QR code or use **Open iMessage** or **Open WhatsApp**, then send the prepared linking message and wait for **Connected**.
4. After each financial connection, see its result and available portfolio preview, then choose **Add more** or **Continue to chat**. If no channel is linked, **Continue to chat** prompts channel linking first.
5. Ask portfolio questions or general financial questions in a verified linked channel, and optionally share preferences. In iMessage, optionally create an ongoing task. Financial connections remain optional.
6. Return to the same website dashboard to add or remove financial connections, link or disconnect messaging channels, or enable or disable proactive insights for linked iMessage. The website and supported chat controls use the same account setting. Both chats control shared personal preferences and their own one-off jobs; iMessage also controls its schedules.

Connecting every account is not a prerequisite for value. A skipped or failed connection does not imply a zero balance.

## 3. User stories

### 3.1 US-ONB-01 — Sign up and continue across chat and web

**Status: accepted account, signup order, and channel-linking experience; verification mechanisms remain tentative.**

**As a new user, I want to sign up on my phone and link my messaging channels so that web setup and chat use one MyStacks account.**

- After website signup with a phone number and an SMS code, the user lands on the persistent dashboard and can connect financial sources or link messaging channels in either order. A verified messaging-channel link is required before assistant chat. Connecting a financial source remains optional, and name, goals, and preferences do not block signup.
- Each MyStacks account has one primary verified phone number, and a phone number can belong to only one account at a time. The account persists when its primary number changes.
- The user can link iMessage, WhatsApp, or both to the same account; each chosen channel requires separate verification. A matching phone number or email address does not implicitly link or merge accounts or channels.
- On phone and desktop, the dashboard shows a QR code for each of iMessage and WhatsApp alongside **Open iMessage** and **Open WhatsApp**. Scanning a QR code or using a button opens a prepared linking message that the user sends. The website offers the recipient and message for copying if the handoff cannot open the app, and shows **Connected** only after separate channel verification succeeds. Displaying or scanning a QR code alone does not verify or link a channel.
- If the user messages before signup, the onboarding reply provides a signup/sign-in link to the same website flow. Assistant access starts after signup and channel linking.
- Future messaging channels, including SMS, also require their own verified link to the account; the signup phone number alone does not establish a messaging-channel link.
- The persistent website dashboard supports signup, financial connections, messaging-channel settings, and the immediate portfolio preview. New and returning users use the same **Add account** flow; chat requests to add or manage connections link there.
- The chat and connection flow explain the read-only informational purpose before requesting a connection.
- After the user links a messaging channel, chat and the connection preview show consistent connection status and portfolio coverage for that account.
- Personal memory, financial connections, and portfolio evidence are shared across linked channels. Useful personal facts learned in one channel can inform another; personal-memory corrections and forgetting apply account-wide. Conversation history, current context, jobs, and results remain in their originating channel, with schedules supported only in iMessage, as defined by the [memory stories](memory.md) and [task stories](tasks.md).
- When a handoff cannot continue, the user sees a clear way to retry without unknowingly creating a second account.

### 3.2 US-ONB-02 — Choose a useful starting point

**Status: accepted source chooser and access to general financial questions after signup and channel linking without connected financial accounts.**

**As a new user, I want to choose one supported source or skip connections so that I can begin without collecting every account first.**

- The dashboard's **Add account** flow lets new and returning users search target sources, choose **Connect a wallet**, or **Skip for now**. Targets include EVM and Solana wallets, Binance, Coinbase, Interactive Brokers (IBKR), moomoo, and Robinhood; Hyperliquid remains low priority.
- The chooser shows actual provider-supported availability by region, account, and capability, including material update delays. A target listing does not promise unsupported access or live account data.
- The user can choose the supported accounts or addresses they want to include and leave others for later.
- After each connection, the result and available portfolio preview offer **Add more** and **Continue to chat**, so the user can keep adding accounts. If no messaging channel is linked, **Continue to chat** prompts channel linking before assistant access.
- If a provider is unavailable, the user can retry, choose another source, or continue and add it later.
- If the signed-up user skips, they can ask general financial questions in a linked channel and return to connections later.

### 3.3 US-ONB-03 — Verify and connect an EVM or Solana wallet

**Status: EVM and Solana wallet support and the verification flow are accepted; exact wallet types, networks, and provider coverage remain open. The Solana verification mechanism remains open.**

**As a user, I want to connect my EVM or Solana wallet and sign a readable off-chain message so that MyStacks can verify my control before saving and tracking the wallet.**

- On the companion website, the user connects a supported wallet, confirms the selected address and network, and signs a readable message for wallet-control verification. Connecting the wallet alone does not complete verification.
- The product explains that this off-chain signature establishes a read-only connection and grants no transaction or token-approval authority. MyStacks identity and attached-wallet control are separate bindings.
- Only successful wallet-control verification creates a verified wallet connection and starts portfolio reads or monitoring. Typing an arbitrary address does not create a tracked connection.
- A cancelled, expired, invalid, or unsupported pending connection attempt creates no verified wallet connection and starts no portfolio reads or monitoring for that attempt. Existing verified wallet connections remain active, and the user sees a clear correction or retry path.
- The same verification rule applies when setup starts through web, chat, a tool, a task, or an import. Uploaded evidence alone does not create a verified wallet connection or start tracking.
- After verification, routine reads and monitoring can continue without daily signatures or an open wallet. Expiry of the verification attempt does not expire the completed connection.
- Disconnecting on the website stops new reads and excludes that source from the current portfolio. Connecting a new address or reconnecting a disconnected wallet requires fresh wallet-control verification. Completed EVM tracking has no periodic expiry.

The [wallet connection decision](../ADRS/0007-verified-evm-wallet-connections.md) owns the accepted rationale. The technical design owns [EVM verification](../design/onboarding.md#42-evm-wallet-control-verification) and the [open Solana mechanism](../design/onboarding.md#43-solana-wallet-control-verification). EVM-specific signing standards do not define the Solana flow.

### 3.4 US-ONB-04 — Connect an exchange or brokerage with read-only access

**Status: accepted experience; the connection mechanism belongs to technical design.**

**As an exchange or brokerage user, I want clear connection instructions and visible permissions so that I can share supported account information without granting financial action authority.**

- The user selects a supported exchange or brokerage through **Add account** on the dashboard, completes the provider’s secure authorization flow, and returns to the dashboard with connection status and coverage.
- Before confirmation, the user reviews regional availability, included accounts, supported capabilities, material update delays, and required read-only access. The connection grants no trading or withdrawal authority.
- Chat does not ask the user to share API secrets or other connection secrets.
- After authorization, the dashboard shows connection and read progress and which supported accounts are included.
- If setup or import fails, the product explains the problem and offers a clear correction or retry path without claiming that assets were loaded.

### 3.5 US-ONB-05 — Understand the first read

**As a user, I want progress and results for each source so that I know what is ready and what still needs attention.**

- Each source shows whether it is waiting, reading, ready, or needs attention, with a useful next action when one is available.
- Ready information identifies its source, coverage, source as-of time or unknown freshness, and retrieval time. A recently retrieved delayed observation is not described as current account state.
- If one source is slow or fails, available information from other sources remains usable and the missing coverage is visible.
- An unread or failed source is never shown as a zero balance or evidence that no risk exists.
- Interrupted or failed setup preserves completed connections and returns the user to the dashboard with an explanation and options to retry, choose another source, or continue to chat.

### 3.6 US-ONB-06 — See the first portfolio snapshot

**Status: accepted experience; detailed financial definitions remain open.**

**As a user, I want a useful portfolio snapshot from available information so that I can understand my portfolio before every connected source finishes loading.**

- After each connection, the website shows its result and a preview of available portfolio value, holdings, positions, and included accounts, with **Add more** and **Continue to chat**.
- Useful results remain available while other sources load or need attention. The website shows source availability, and unavailable data is never presented as a zero balance.
- The current portfolio uses supported provider data. Values use USD by default while preserving native asset quantities. Totals and conclusions use the available supported coverage; portfolio-value changes and investment gains or losses are distinct, and deposits are not presented as profit. Provider-supplied history or metrics may appear when supported and backed by the required evidence. A MyStacks indexer and historical reconstruction or P&L requiring MyStacks infrastructure are deferred at low priority.
- Current portfolio analysis obtains the latest relevant account state at analysis time, with brief reuse only while it remains fresh or near-fresh for the claim. The preview distinguishes delayed observations from current account state. Fresh prices alone do not make earlier holdings current.
- The user can request portfolio answers in chat and follow up on the snapshot within Phase 1 informational scope. Answers highlight available results and briefly explain material timing or coverage limits without routine missing-data warnings or unsupported claims of completeness.

### 3.7 US-ONB-07 — Choose what happens after first value

**As a user, I want optional next steps after the first useful result so that I can shape the experience without delaying access to it.**

- The user can choose **Add more** on the website, share a useful preference in chat, or continue without either step.
- The morning digest offer explains its informational purpose, iMessage delivery, and best-effort timing before the user chooses an available option. WhatsApp users are directed to linked iMessage to create a schedule; WhatsApp cannot create or manage iMessage tasks.
- **Proactive insights:** the dashboard and supported chat controls enable or disable the same account-wide setting for eligible linked iMessage. Linking iMessage enables insights by default, subject to channel permissions. WhatsApp cannot be selected, and linking WhatsApp does not enable proactive work.
- Disabling proactive insights stops investigations and suppresses unsent findings. Disconnecting iMessage stops proactive work without selecting WhatsApp as a fallback.
- Each proactive investigation runs once account-wide. Each qualifying insight goes only to verified, currently eligible iMessage. Human ownership of iMessage makes automated delivery there unavailable.
- **Task controls:** explicitly requested summaries and other schedules belong to iMessage. Each chat can inspect or control only its own one-off jobs; only iMessage can inspect, change, pause, resume, or cancel its schedules. Changes to proactive insights do not reroute scheduled tasks; the [task stories](tasks.md) own their lifecycle.
- The website detects and saves the device timezone once during onboarding. Users explicitly change their default in the web app or chat; automatic re-detection on later visits is deferred. A timezone specified for a task affects only that task, and existing tasks keep their assigned zone unless edited. Scheduling asks for a timezone only if unknown and a morning time if none is known. Confirmations show the selected time and timezone.

### 3.8 US-ONB-08 — Manage connected sources

**As a returning user, I want to review and manage my connections so that portfolio coverage reflects what I intend to share.**

- In chat, the user can ask which sources are connected and see their included accounts or addresses, status, coverage, and freshness.
- The persistent website dashboard provides the same **Add account** flow used during onboarding. Chat requests to add or manage connections link to that dashboard.
- When a provider supports renewal without user action, renewal is automatic. The product requests reconnect only when the provider requires user action; temporary outages show the source as unavailable and offer an appropriate retry path.
- Only the website can remove a financial connection. Chat can explain the effect and link to the dashboard. Disconnecting stops future reads and excludes the source from the current portfolio while other sources continue.
- After disconnection, a scheduled task continues only if remaining authorized data fulfills its request; otherwise it pauses with one explanation in its originating channel. Restoring the source leaves affected tasks paused until explicit resume from that channel, as defined in the [task stories](tasks.md).
- The product distinguishes disconnecting from deleting retained information. Past reports remain under the separate data-retention policy; disconnecting does not claim to erase them.

### 3.9 US-ONB-09 — Return to the same account or recover access

**Status: phone sign-in and account continuity are accepted. Phone-number changes, lost-number recovery, and email recovery are low priority; exact recovery evidence and policy remain open.**

**As a returning user, I want to recover access to my existing account so that I can continue with my connections, preferences, and ongoing work.**

- Successful sign-in with the primary phone number and an SMS code returns the user to the same MyStacks account without creating a duplicate account.
- If sign-in expires, the user sees how to authenticate again and retains completed setup.
- The ordinary phone-number change flow verifies the current and new numbers. Changing the primary phone number preserves the same account ID, conversation histories, shared personal memory, preferences, financial connections, tasks, results, and separately linked messaging channels. The new number cannot remain linked to another account.
- A changed phone number or messaging identity requires the appropriate verified change or recovery flow before existing financial information becomes accessible; the detailed experience remains open.
- Only the website can add or disconnect messaging channels. The website and supported chat controls can change the same iMessage proactive insights setting. A channel link does not replace the account's primary login number.
- Disconnecting a channel suppresses pending deliveries while retaining its history and results. Disconnecting iMessage also pauses its scheduled tasks, including future runs and pending deliveries. Relinking iMessage does not resume them automatically; the user resumes from iMessage. Already-started sends cannot be recalled. One-off jobs and active attempts retain the cancellation and outcome rules in the [task stories](tasks.md).
- Proactive insights follow the iMessage-only setting in `US-ONB-07`; scheduled tasks remain in iMessage, and one-off requested work stays in its originating channel.

### 3.10 US-ONB-10 — Understand and control account data

**Status: review and export remain proposed with scope open; account deletion is deferred.**

**As a user, I want to understand what MyStacks stores and how to remove it so that I can make informed choices about my information.**

- The product distinguishes disconnecting a financial source, forgetting personal memory, deleting retained data, and closing the MyStacks account. Useful analysis inputs, reusable calculations, results, and supporting evidence are retained conservatively for authorized follow-ups, subject to provider data rights and privacy constraints; automatic pruning is deferred.
- Proposed review and export controls need agreement on which records they cover and any retention limits. Account deletion remains deferred.
- A request reports its actual progress or outcome and does not imply that data outside the product's control has been erased.
- The detailed scope, identity checks, retention, and completion behavior remain open product decisions; memory-specific controls belong to the [memory stories](memory.md).

### 3.11 US-ONB-11 — Connect a Hyperliquid account

**Status: accepted experience; low priority.** Eligible EVM wallet types and supported account coverage remain provider-dependent.

**As a Hyperliquid user, I want to connect my own account so that its supported balances and positions appear in my portfolio.**

- On the website, the user chooses **Connect Hyperliquid** and can select an eligible EVM wallet they have already verified with MyStacks, or connect another supported EVM wallet and sign a readable off-chain wallet-control message.
- When an already verified wallet is eligible, the user can reuse it without signing another wallet-control message.
- If a wallet cannot be used for the connection, the product explains why and offers another wallet or a supported correction. When no eligible verified wallet is available, the user can connect and verify one.
- Before confirmation, the product identifies the actual Hyperliquid account address being connected and its available asset, balance, and position coverage. The user confirms the authorized account and its visible coverage limits.
- The connection includes only the user's own supported account information verified through the selected wallet. Supported account types and products depend on the provider or connector.
- After confirmation, the user sees connection progress and the available portfolio data. A successful connection with no balances or positions shows an empty result; a failed or incomplete read is not shown as zero.
- A cancelled or failed setup attempt creates no new connection, preserves existing connections, and offers a clear retry or correction path.
- Public availability of an address alone does not make it eligible for connection or monitoring.

## 4. Open product decisions

| Decision | What needs agreement |
| --- | --- |
| Account entry and continuity | Authentication provider, supported channel sender types, and exact recovery evidence and policy. Phone-number changes, lost-number recovery, and email recovery are low priority. |
| Launch coverage | Supported EVM and Solana wallet networks and types, EVM cross-chain proof policy, and visible regional, account, capability, and update limits for the target sources. Interactive Brokers timing and moomoo coverage outside the US and Canada remain unresolved target gaps. |
| Hyperliquid account connection | Which supported EVM wallet types qualify and how actual account addresses, supported coverage, and connection limits are explained. |
| First portfolio snapshot | The useful minimum for each source, valuation sources, formulas, and supported provider-supplied history and metrics for portfolio-value changes and investment gains or losses. A MyStacks indexer and historical reconstruction or P&L requiring MyStacks infrastructure are deferred at low priority. USD is the default display currency; alternate currencies are low priority. |
| Personalization | Which optional preferences to ask for after first value and how the automatic-memory experience is introduced. |
| Notifications | How to explain best-effort monitoring limits, pending proactive delivery after changes to the iMessage insights setting, and exact daylight-saving mechanics within the accepted timezone rules. |
| Apple messaging controls | The [Apple messaging decision](../ADRS/0021-apple-messages-with-bird.md) owns the selected integration. The [Apple messaging TODO](../TODO.md) owns account approval, experience review, exact permitted financial notification scope, and required notices or opt-outs. |
| Data policy | Provider retention rights and privacy constraints, treatment after disconnect, review and export scope, and how previously read information is presented. Useful analysis retention is accepted; automatic pruning and account deletion are deferred. |

These decisions need agreement before the affected stories become implementation acceptance criteria.
