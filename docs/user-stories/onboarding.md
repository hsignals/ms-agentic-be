# Onboarding user stories

## 1. Status and scope

**Status: the signup order, button-based channel linking, persistent website dashboard, connection experiences, website portfolio preview, and account/channel continuity below are accepted.** Access to general financial questions without connected financial accounts and the controls identified in `US-ONB-07` are also accepted. Choices explicitly marked open remain proposed; phone changes and recovery are low priority, and account deletion is deferred.

The governing [product requirements](../requirements.md) define Phase 1 as read-only financial information, analysis, and monitoring. Onboarding must not grant trading authority or promise specific buy, sell, or rebalance recommendations.

**Website signup and channel linking are required before assistant chat; financial connections are optional.** The user signs up and logs in with a phone number and an SMS code, then links iMessage or WhatsApp before optionally connecting financial sources. Only phone verification is required for MyStacks signup. Name, goals, and preferences are optional and can be learned through chat; financial providers may require their own setup. A stable MyStacks account ID owns the user's saved state, and each messaging channel is separately verified and linked to that account.

Chat is the default interaction surface for questions and ongoing work. The persistent website dashboard manages financial connections, messaging channels, and delivery-routing settings and shows an immediate portfolio preview after connection. Required connection categories remain wallet addresses, Binance, and Hyperliquid, with Hyperliquid at **low priority**. The source chooser lists supported providers, including exchanges or brokerages where available. Supported account types, assets, balances, and positions depend on the provider or connector, and the user sees the available coverage before confirming a connection. An EVM wallet becomes a connected source only after successful wallet-control verification.

The [technical design](../design/onboarding.md) owns implementation proposals and remains **tentative pending the overall architecture design round**. The authentication provider, detailed verification mechanisms, and recovery policy remain open. Phone-number changes, lost-number recovery, and email recovery are **low priority**. QR linking and WhatsApp login are deferred.

## 2. Experience outline

1. Sign up on the phone-friendly website using a phone number and an SMS code before starting assistant chat.
2. Use **Open iMessage** or **Open WhatsApp** on phone or desktop, then send the prepared linking message and wait for **Connected**.
3. In the dashboard's **Add account** flow, search supported sources, choose **Connect a wallet**, or **Skip for now**.
4. After each connection, see its result and available portfolio preview, then choose **Add more** or **Continue to chat**.
5. Ask portfolio questions or general financial questions in the linked channel, and optionally share preferences or create an ongoing task.
6. Return to the same website dashboard to add or remove financial connections, link or disconnect messaging channels, or change the preferred proactive channel. Chat controls personal preferences, the account-wide proactive on/off setting, and that channel's own tasks.

Connecting every account is not a prerequisite for value. A skipped or failed connection does not imply a zero balance.

## 3. User stories

### 3.1 US-ONB-01 — Sign up and continue across chat and web

**Status: accepted account, signup order, and channel-linking experience; verification mechanisms remain tentative.**

**As a new user, I want to sign up on my phone and link my messaging channels so that web setup and chat use one MyStacks account.**

- The user must complete website signup with a phone number and an SMS code, then link a messaging channel before using assistant chat. Connecting a financial source remains optional, and name, goals, and preferences do not block signup.
- Each MyStacks account has one primary verified phone number, and a phone number can belong to only one account at a time. The account persists when its primary number changes.
- The user can link iMessage, WhatsApp, or both to the same account; each chosen channel requires separate verification. A matching phone number or email address does not implicitly link or merge accounts or channels.
- On phone and desktop, **Open iMessage** and **Open WhatsApp** open a prepared linking message that the user sends. The website offers the recipient and message for copying if the button cannot open the app, and shows **Connected** only after verification succeeds.
- If the user messages before signup, the onboarding reply provides a signup/sign-in link to the same website flow. Assistant access starts after signup and channel linking.
- Future messaging channels, including SMS, also require their own verified link to the account; the signup phone number alone does not establish a messaging-channel link.
- The persistent website dashboard supports signup, financial connections, messaging-channel settings, and the immediate portfolio preview. New and returning users use the same **Add account** flow; chat requests to add or manage connections link there.
- The chat and connection flow explain the read-only informational purpose before requesting a connection.
- After the user links a messaging channel, chat and the connection preview show consistent connection status and portfolio coverage for that account.
- Personal memory, financial connections, and portfolio evidence are shared across linked channels. Useful personal facts learned in one channel can inform another; personal-memory corrections and forgetting apply account-wide. Conversation history, current context, jobs, scheduled tasks, and their results remain in their originating channel, as defined by the [memory stories](memory.md) and [task stories](tasks.md).
- When a handoff cannot continue, the user sees a clear way to retry without unknowingly creating a second account.

### 3.2 US-ONB-02 — Choose a useful starting point

**Status: accepted source chooser and access to general financial questions after signup and channel linking without connected financial accounts.**

**As a new user, I want to choose one supported source or skip connections so that I can begin without collecting every account first.**

- The dashboard's **Add account** flow lets new and returning users search supported providers, choose **Connect a wallet**, or **Skip for now**. It presents wallet addresses, Binance, and Hyperliquid with their supported coverage and required access; Hyperliquid remains low priority.
- Provider search offers exchanges or brokerages only where supported; the chooser does not promise coverage for an unsupported provider or account type.
- The user can choose the supported accounts or addresses they want to include and leave others for later.
- After each connection, the result and available portfolio preview offer **Add more** and **Continue to chat**, so the user can keep adding accounts.
- If a provider is unavailable, the user can retry, choose another source, or continue and add it later.
- If the signed-up user skips, they can ask general financial questions in a linked channel and return to connections later.

### 3.3 US-ONB-03 — Verify and connect an EVM wallet

**Status: accepted flow; supported wallet types and networks remain open.**

**As a user, I want to connect my EVM wallet and sign a readable message so that MyStacks can verify my control before saving and tracking the wallet.**

- On the companion website, the user connects a supported wallet, confirms the selected address and network, and signs a readable message for wallet-control verification. Connecting the wallet alone does not complete verification.
- The product explains that this off-chain signature establishes a read-only connection and grants no transaction or token-approval authority. MyStacks identity and attached-wallet control are separate bindings.
- Only successful wallet-control verification creates a verified EVM connection and starts portfolio reads or monitoring. Typing an arbitrary address does not create a tracked connection.
- A cancelled, expired, invalid, or unsupported pending connection attempt creates no verified EVM connection and starts no portfolio reads or monitoring for that attempt. Existing verified EVM connections remain active, and the user sees a clear correction or retry path.
- The same verification rule applies when setup starts through web, chat, a tool, a task, or an import. Uploaded evidence alone does not create a verified EVM connection or start tracking.
- After verification, routine reads and monitoring can continue without daily signatures or an open wallet. Expiry of the verification attempt does not expire the completed connection.
- Disconnecting on the website stops new reads and excludes that source from the current portfolio. Connecting a new address or reconnecting a disconnected wallet requires fresh wallet-control verification. Completed EVM tracking has no periodic expiry.

The [wallet connection decision](../ADRS/0007-verified-evm-wallet-connections.md) owns the accepted rationale. The [technical design](../design/onboarding.md#42-evm-wallet-control-verification) owns the verification mechanism.

### 3.4 US-ONB-04 — Connect Binance with read-only access

**Status: accepted experience; the connection mechanism belongs to technical design.**

**As a Binance user, I want clear connection instructions and visible permissions so that I can share supported account information without granting financial action authority.**

- The user chooses **Connect Binance** and follows a guided secure connection on the companion website.
- Before confirmation, the user reviews the available account coverage and required read-only access. The connection grants no trading or withdrawal authority.
- Chat does not ask the user to share API secrets or other connection secrets.
- After confirmation, the user sees import progress and which supported accounts are included.
- If setup or import fails, the product explains the problem and offers a clear correction or retry path without claiming that assets were loaded.

### 3.5 US-ONB-05 — Understand the first read

**As a user, I want progress and results for each source so that I know what is ready and what still needs attention.**

- Each source shows whether it is waiting, reading, ready, or needs attention, with a useful next action when one is available.
- Ready information identifies its source, coverage, and as-of time or unknown freshness.
- If one source is slow or fails, available information from other sources remains usable and the missing coverage is visible.
- An unread or failed source is never shown as a zero balance or evidence that no risk exists.
- Interrupted or failed setup preserves completed connections and returns the user to the dashboard with an explanation and options to retry, choose another source, or continue to chat.

### 3.6 US-ONB-06 — See the first portfolio snapshot

**Status: accepted experience; detailed financial definitions remain open.**

**As a user, I want a useful portfolio snapshot from available information so that I can understand my portfolio before every connected source finishes loading.**

- After each connection, the website shows its result and a preview of available portfolio value, holdings, positions, and included accounts, with **Add more** and **Continue to chat**.
- Useful results remain available while other sources load or need attention. The website shows source availability, and unavailable data is never presented as a zero balance.
- Values use USD by default while preserving native asset quantities. Totals and conclusions use the available supported coverage; portfolio-value changes and investment gains or losses are distinct, and deposits are not presented as profit. A change appears only when its required comparison evidence exists.
- The user can request portfolio answers in chat and follow up on the snapshot within Phase 1 informational scope. Answers highlight available results without routine missing-data warnings or unsupported claims of completeness.

### 3.7 US-ONB-07 — Choose what happens after first value

**As a user, I want optional next steps after the first useful result so that I can shape the experience without delaying access to it.**

- The user can choose **Add more** on the website, share a useful preference in chat, or continue without either step.
- The morning digest offer explains its informational purpose, delivery destination, and best-effort timing before the user chooses an available option.
- **Proactive controls:** proactive insights are on by default and have one account-wide on/off control in chat. The first linked channel becomes preferred, and linking another does not switch it. The user changes the preferred channel on the website. If it disconnects, proactive delivery switches to another remaining linked channel and the website shows the change; with no linked channel, delivery pauses while the on/off preference is retained.
- **Task controls:** explicitly requested summaries and other scheduled tasks belong to the channel that creates them. Chat can inspect, change, pause, resume, or cancel only that channel's jobs and tasks, with no alternative destination in Phase 1. Proactive fallback does not reroute scheduled tasks; the [task stories](tasks.md) own their lifecycle.
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
- Only the website can add or disconnect messaging channels and change delivery-routing settings. Chat can explain the controls and link to settings. A channel link does not replace the account's primary login number.
- Disconnecting a channel pauses its scheduled tasks, including future runs and pending deliveries, while retaining their history and results. Relinking the original channel does not resume them automatically; the user resumes from that channel. Already-started sends cannot be recalled. One-off jobs and active attempts retain the cancellation and outcome rules in the [task stories](tasks.md).
- Proactive insights follow their separate fallback rule in `US-ONB-07`; scheduled tasks remain with their originating channel.

### 3.10 US-ONB-10 — Understand and control account data

**Status: review and export remain proposed with scope open; account deletion is deferred.**

**As a user, I want to understand what MyStacks stores and how to remove it so that I can make informed choices about my information.**

- The product distinguishes disconnecting a financial source, forgetting personal memory, deleting retained data, and closing the MyStacks account.
- Proposed review and export controls need agreement on which records they cover and any retention limits. Account deletion remains deferred.
- A request reports its actual progress or outcome and does not imply that data outside the product's control has been erased.
- The detailed scope, identity checks, retention, and completion behavior remain open product decisions; memory-specific controls belong to the [memory stories](memory.md).

### 3.11 US-ONB-11 — Connect a Hyperliquid account

**Status: accepted experience; low priority.** Wallet eligibility remains open, and supported coverage depends on the provider or connector.

**As a Hyperliquid user, I want to connect my own account so that its supported balances and positions appear in my portfolio.**

- The user chooses **Connect Hyperliquid** and can select an eligible wallet they have already verified with MyStacks, or connect and verify another supported wallet.
- When an already verified wallet is eligible, the user can reuse it without signing another wallet-control message.
- If a wallet cannot be used for the connection, the product explains why and offers another wallet or a supported correction. When no eligible verified wallet is available, the user can connect and verify one.
- Before confirmation, the product identifies the user's supported accounts and the available asset, balance, and position coverage. The user confirms the connection with its visible coverage limits.
- The connection includes only the user's own supported account information verified through the selected wallet. Supported account types and products depend on the provider or connector.
- After confirmation, the user sees connection progress and the available portfolio data. A successful connection with no balances or positions shows an empty result; a failed or incomplete read is not shown as zero.
- A cancelled or failed setup attempt creates no new connection, preserves existing connections, and offers a clear retry or correction path.
- Public availability of an address alone does not make it eligible for connection or monitoring.

## 4. Open product decisions

| Decision | What needs agreement |
| --- | --- |
| Account entry and continuity | Authentication provider, supported channel sender types, and exact recovery evidence and policy. Phone-number changes, lost-number recovery, and email recovery are low priority. |
| Launch coverage | Supported wallet networks and types, EVM cross-chain proof policy, and how provider-dependent coverage limits are shown to users. |
| Hyperliquid account connection | Which verified wallets qualify and how supported coverage and connection limits are explained. |
| First portfolio snapshot | The useful minimum for each source, valuation sources, formulas, and supported metrics for portfolio-value changes and investment gains or losses. USD is the default display currency; alternate currencies are low priority. |
| Personalization | Which optional preferences to ask for after first value and how the automatic-memory experience is introduced. |
| Notifications | How to explain best-effort monitoring limits, pending proactive delivery after routing changes, and exact daylight-saving mechanics within the accepted timezone rules. |
| Data policy | Retention after disconnect, review and export scope, and how previously read information is presented. Account deletion is deferred. |

These decisions need agreement before the affected stories become implementation acceptance criteria.
