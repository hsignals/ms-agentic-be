# Onboarding and account connection design

## 1. Status and scope

**Status: accepted website phone signup → persistent dashboard, financial connections and channel linking in either order, channel linking through QR codes or direct buttons, separate channel conversations with shared personal memory, verified EVM and Solana wallet connections, and website portfolio previews.** This document defines identity, messaging handoff, account connection, and access controls for the full Phase 1 experience. All technical mappings and mechanisms remain **TENTATIVE pending the overall architecture round**; accepted product behavior and security boundaries remain requirements. Recovery policy, other provider integrations, and data-control policies remain open. Phone changes and recovery are low priority; account deletion is deferred.

The [onboarding stories](../user-stories/onboarding.md) own observable behavior. The [requirements](../requirements.md) own product scope, and the [architecture](../architecture.md) owns accepted runtime and security boundaries. Financial observations and connector reads belong to the [portfolio design](portfolio.md); conversation and memory belong to the [runtime design](runtime.md); ongoing work and delivery belong to the [task design](tasks.md).

Phase 1 provides financial information with read-only account access. Specific buy, sell, or rebalance recommendations and financial execution remain outside its authority. Onboarding establishes access to information without granting trading or money-movement authority.

Wallet addresses, Binance, and Hyperliquid remain required connection categories, with Hyperliquid at low priority. EVM and Solana wallets are supported source categories, with wallet-control verification required before tracking. The EVM mechanism is defined below; the Solana mechanism and exact network, wallet, and provider coverage remain open. The dashboard lists selectable supported providers, including exchanges or brokerages where available.

## 2. Progressive connection flow

Website signup and channel linking precede assistant chat. The primary signup and login method is a phone number verified by an SMS code. Only phone verification is required for MyStacks signup; name, goals, and preferences are optional and learned through chat. Providers may have their own setup requirements. Financial connections are optional, so a signed-up user with a linked channel can ask general financial questions without connecting a source.

After successful phone verification, the user lands on the persistent website dashboard and can connect financial sources or link messaging channels in either order. The dashboard manages financial connections, messaging-channel links, proactive insight delivery channels, and the immediate post-connection portfolio preview. Chat can change the same proactive insight delivery channels setting. New and returning users use the same **Add account** flow: search supported sources, **Connect a wallet**, or **Skip for now**. Chat requests to add or manage connections link to this dashboard.

**TENTATIVE architecture flow:** the sequence and user choices below express accepted behavior; backend boundaries and handoff mechanics require joint architecture finalization.

```mermaid
flowchart TD
    U["Website signup or login"] --> A["Verify primary phone with SMS code"]
    A --> M["Stable MyStacks account"]
    M --> D["Persistent website dashboard"]
    D --> C["Add account: optional supported financial source"]
    D --> L["Scan channel QR or use direct button; send linking message"]
    L --> K["Backend verifies channel link; Connected"]
    K --> D
    C --> V["Backend verifies the source connection"]
    V --> F["Persist the connection and read a snapshot"]
    F --> P["Connection result and available website preview"]
    P -->|Add more| C
    P -->|Return| D
    D -->|Continue to chat| G{"Verified channel linked?"}
    P -->|Continue to chat| G
    G -->|No| L
    G -->|Yes| N["Assistant chat in linked channel"]
```

These logical responsibilities may share a backend deployment. Signup, source authorization, and messaging verification are separate: completing one does not prove another. The website offers iMessage and WhatsApp QR codes and direct channel-link buttons on phone and desktop, with copyable recipient/message fallback. Displaying or scanning a QR code does not verify a channel. WhatsApp login is deferred; signup uses website phone verification. Preferences, channel-scoped tasks, and ongoing portfolio questions use chat.

If a user messages before signup, the onboarding reply links to signup/sign-in in this same website flow. It does not grant assistant access. Interrupted or failed setup preserves completed connections and returns to the dashboard with an explanation and options to retry, choose another source, or continue to chat.

The website detects and saves the device timezone once during onboarding. Users explicitly change their personal default in the web app or chat; automatic re-detection on later visits is deferred. Task-specific timezone requests override only that task, while existing schedules keep their assigned zone unless edited. The [task design](tasks.md) owns timing confirmations, unknown-timezone clarification, and open recurrence/daylight-saving mechanics. The capture and persistence mapping remains tentative.

## 3. Identity, messaging, and financial authority

### 3.1 Separate bindings

**TENTATIVE architecture mapping:** these bindings express the agreed identity boundaries; their records and provider mappings remain for joint architecture finalization.

| Binding | Purpose |
| --- | --- |
| MyStacks account | Stable internal account ID that owns connections, conversations, memory, preferences, and tasks. Mutable phone and channel bindings do not replace this account. Account ownership does not grant a chat access to another channel's history, jobs, tasks, or results. |
| Primary login phone | One verified phone per account, with one account per phone at a time. SMS-code signup and login establish phone control; account continuity must also respect reassigned phone numbers. |
| Messaging channel | A separately verified channel and sender bound to the authenticated MyStacks account. It determines which channel conversation can receive that account's information. |
| Financial connection | A source bound to that account, with its address or protected credential reference, supported coverage, and current access state. An EVM or Solana wallet requires wallet-control verification before it becomes a verified connection. |

The stable account preserves continuity when a phone number or channel changes. A new holder of a recycled phone number must not be treated as the original account owner. Phone-number changes, lost-number recovery, and email recovery are low priority; exact recovery evidence and reassignment policy remain open. The ordinary number-change flow verifies both the current and new phone. The authentication provider remains open.

iMessage and WhatsApp are the launch channels. Each must be verified and linked separately, even when it uses the primary login phone. SMS and additional future channels are bindings too. A channel sender may differ from the primary login phone, such as an iMessage email address; exact supported sender types and provider mappings remain open. Matching phone numbers or email addresses must not silently merge accounts or channel bindings.

MyStacks authentication and attached-wallet proof are separate bindings. Signing the wallet-control message does not select a login provider, replace the authenticated MyStacks identity, or grant financial execution authority.

### 3.2 Connection and channel handoff

An account-connection link opens an authenticated companion-web flow. The backend binds the pending operation to the current user and browser session; a URL parameter or model-provided user identifier cannot establish authority. Link previews must not complete sign-in, attach an account, or consume an authorization action.

On phone and desktop, the signed-in website shows a QR code for each of iMessage and WhatsApp alongside **Open iMessage** and **Open WhatsApp**. Scanning a QR code or using a button opens a prepared linking message that the user sends; a copyable recipient and message provide a fallback. The website shows **Connected** only after separate verification succeeds. Displaying or scanning a QR code, or opening the messaging app, does not verify or link a channel. Only the website adds or disconnects messaging channels. The website and chat can change the same proactive insight delivery channels setting.

**TENTATIVE channel handoff:** bind a short-lived, one-use linking challenge to the signed-in account and intended channel-link operation, then verify the challenge and inbound sender before linking that sender and reporting **Connected**. Matching a phone number is insufficient. Exact challenge lifetime, supported sender formats, provider adapters, confirmation details, and polling or server-sent-event choices remain open.

When a provider uses OAuth or a hosted connection portal, use its supported SDK flow and validate callback state against the initiating session. Credentials and authorization codes must stay out of chat, model context, E2B, analytics, and traces. Financial adapters retain the credential boundary described in the [credential ADR](../ADRS/0002-backend-owned-financial-credentials.md).

### 3.3 Channel conversations and proactive delivery

iMessage and WhatsApp keep separate conversation history, current context, compaction, independent jobs, scheduled tasks, and results under the same MyStacks account. Chat accesses and controls only its own channel's work. Financial connections, portfolio evidence, and durable personal facts, goals, and preferences are account-wide; useful personal facts learned in one channel may inform another, and corrections or forgetting apply across linked channels. Shared personal memory must not copy channel transcripts, task records, or results. The [runtime design](runtime.md) owns the tentative Mastra mapping and memory selection, conflict, deletion, and concurrent-write requirements.

**TENTATIVE access mapping:** trusted backend account and current-channel bindings constrain task/result access and agent capabilities. Protected handlers enforce both bindings rather than accepting a model-selected channel ID. A chat may explain other linked channels and change proactive insight delivery channels without loading another channel's transcripts or task logs. Phase 1 has no scheduled-task destination selector, task transfer, or cross-channel history lookup. The runtime design owns the shared regular Agent and per-run context, without requiring a separate deployment for each channel.

Proactive insights are distinct from user-created scheduled tasks. **Proactive insight delivery channels** is one account-wide setting shared by the website and chat. The dashboard lets the user select one, both, or none of their linked messaging channels. Every newly linked channel is selected by default, including when the previous selection was empty. Disconnecting a channel removes that destination from the selection and never selects another unselected channel. With none selected, proactive investigations and unsent proactive delivery stop.

Each proactive investigation runs once account-wide, and each qualifying insight goes to all selected, verified, currently eligible destinations. Delivery respects the current proactive insight delivery channels selection and each destination's current eligibility. This fan-out preserves separate channel history, context, and tasks. Exact proactive context assembly and pending-dispatch mechanics remain tentative within these boundaries.

Scheduled tasks remain bound to their creating channel. Disconnecting that channel pauses its future scheduled runs and pending deliveries rather than rerouting them. History and tasks remain, and relinking the original channel does not auto-resume them; the user resumes from that channel. Already-started sends cannot be recalled. The [task design](tasks.md) owns active-attempt and one-off-job cancellation and outcome semantics.

## 4. Source setup and connector boundary

### 4.1 Source connection experiences

**TENTATIVE connector mechanisms:** the table preserves accepted user experiences and authority limits; provider integration, SDK, and adapter choices require architecture finalization.

| Source | User action | Backend responsibility and limits |
| --- | --- | --- |
| EVM wallet — accepted flow | Connect a supported wallet on the companion website, confirm the address and network, and sign a readable off-chain wallet-control message. | Complete EVM wallet-control verification before persisting a verified connection or starting portfolio reads and monitoring. Native balance access does not establish token or DeFi coverage. |
| Solana wallet — accepted support; mechanism open | Connect a supported wallet on the companion website, confirm the address and network, and sign a readable off-chain wallet-control message. | Complete Solana wallet-control verification before persisting a verified connection or starting portfolio reads and monitoring. The verification mechanism, SDK, provider, and exact coverage remain open. |
| Hyperliquid — low priority; proposed mechanics | Choose an eligible wallet already verified in MyStacks, or connect and verify another supported wallet, then confirm the account information to include. | Reuse the verified wallet without another wallet-control signature. Define the mapping from the controlling wallet to supported master accounts, subaccounts, vaults, and account modes before accepting connections. Public-read availability alone does not authorize attachment or monitoring; an agent-wallet signing identity is distinct from the account being read. |
| Binance | The user completes the supported provider’s secure authorization flow and returns to the dashboard with connection status and coverage. | Prefer a supported provider-hosted flow. Validate read-only permissions and supported coverage through the provider, reject broader authority, and keep any credentials in the backend credential boundary. Successful balance retrieval alone does not prove read-only permission. |

Source coverage depends on the provider and integration. Each source needs explicit account, network, and asset coverage before it is offered to a user. EVM or Solana address entry alone cannot create a tracked connection. Provider integration and existing-code reuse require validation; a design reference does not establish that a connector is implemented.

The Binance integration must use the selected provider’s supported authorization and permission model. Provider approval or KYB does not by itself establish OAuth availability, a keyless connection, or a one-click experience. Exact provider eligibility, authorization steps, account coverage, and permissions require validation before the integration is offered.

Public reads and account addressing are documented in [Ethereum JSON-RPC](https://ethereum.org/developers/docs/apis/json-rpc/#eth_getbalance) and the [Hyperliquid Info API](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint). These capabilities do not imply complete portfolio coverage or establish MyStacks connection authority.

### 4.2 EVM wallet-control verification

Use [Sign-In with Ethereum (SIWE), ERC-4361](https://eips.ethereum.org/EIPS/eip-4361), for a readable off-chain proof that attaches a wallet to an already authenticated MyStacks user. The [wallet connection decision](../ADRS/0007-verified-evm-wallet-connections.md) owns the rationale. Reuse maintained SIWE and wallet SDK primitives for message construction, parsing, and signature verification; the SDK vendor remains open.

1. The companion website connects to a supported wallet and selects its address and chain. This establishes the proposed signer, not a verified EVM connection.
2. The backend issues a challenge with a cryptographically random, single-use, short-lived nonce. It binds the challenge to the authenticated MyStacks user, the initiating browser connection attempt, and the selected address. The backend records the expected domain, URI, chain ID, wallet-control purpose, issue time, and expiry.
3. The wallet presents the SIWE message for signing. Its readable statement explains that the purpose is to verify wallet control and attach a read-only connection; this flow grants no transaction or token-approval authority.
4. The backend validates the signature and the signed message against the issued challenge, including the expected address, domain, URI, chain ID, nonce, purpose, and time limits. It must also match the authenticated user and initiating browser connection attempt. A valid signature alone is insufficient.
5. After successful validation, the backend consumes the nonce once and persists the verified EVM connection. Completion must prevent reuse of the nonce, including concurrent submissions. Portfolio reads and monitoring start only after this succeeds.

For a supported externally owned account, verify the SIWE signature using [ERC-191](https://eips.ethereum.org/EIPS/eip-191). When smart contract wallets are supported, verify through [ERC-1271](https://eips.ethereum.org/EIPS/eip-1271) on the chain specified by the challenge. Supported wallet types and networks, and the cross-chain proof policy, remain open.

Cancelled, expired, invalid, mismatched, or already-used challenges must not complete the pending connection or trigger its portfolio reads and monitoring. These failures leave existing verified EVM connections unchanged. A retry requires a fresh challenge. The challenge TTL remains an implementation choice; challenge expiry does not expire a completed connection.

Every path that can create an EVM connection must use this backend verification boundary, including web, chat, tools, tasks, and imports. An address or uploaded evidence may support analysis within the applicable evidence rules, but cannot establish a verified EVM connection or start wallet tracking.

The verified EVM connection records proof of control at verification time. Routine reads and monitoring use its current connection state without daily signatures or an open wallet; EVM tracking itself has no periodic expiry. A new address or reattachment after disconnect requires fresh wallet-control verification.

### 4.3 Solana wallet-control verification

Solana wallet support must meet the same product boundary: a readable off-chain signature proves control before MyStacks persists a verified connection or starts portfolio reads and monitoring, and grants no transaction, token-approval, trading, or money-movement authority. MyStacks authentication remains separate from attached-wallet proof. An address, wallet connection, or uploaded evidence alone cannot establish verification.

Every Solana connection path, including web, chat, tools, tasks, and imports, must use the owning backend verification boundary. Cancelled, expired, invalid, or unsupported attempts create no verified connection and start no reads or monitoring; existing verified connections remain active. A new address or reattachment after disconnect requires fresh wallet-control verification. The Solana signing protocol, SDK, provider, challenge validation, supported wallet types and networks, and exact portfolio coverage remain open for architecture design. The EVM SIWE and ERC mechanisms in section 4.2 apply only to EVM wallets.

### 4.4 Small shared connector contract

Each connector owns its setup validation and provider-specific permission checks. The portfolio design owns provider reads and their conversion into the shared financial evidence contract. The connection preview, agent tools, and scheduled jobs consume that contract instead of containing separate provider-specific financial logic.

The minimum contract covers connection status, supported accounts and asset coverage, financial observations with native values and units, source and as-of information, and explicit gaps or errors. Setup remains provider-specific: wallet-control verification and an exchange credential do not need identical authentication flows. Schemas and method signatures belong to implementation design.

Adding a connector should require its setup experience and adapter, with any necessary capability exposure. It should reuse account binding, evidence presentation, task creation, scheduling, memory, and notification delivery. A connector marketplace or dynamic plugin loader would require a separate product need.

## 5. First synchronization and portfolio evidence

After successful source setup, the backend persists the authorized connection and starts its first read. For EVM and Solana wallets, successful wallet-control verification is required before either action. Connection authorization and data readiness are distinct: an attached account may still be syncing, partially available, or in need of repair. Required progress survives the browser session.

The immediate website preview and Mastra tools read the same backend evidence. After each connection, the dashboard shows its result and available value, holdings, positions, and included accounts without waiting for every source, with **Add more** and **Continue to chat**. If no messaging channel is linked, **Continue to chat** prompts channel linking before assistant access. Portfolio answers in chat follow user requests. An unconnected or unavailable source displays a clear empty or unavailable state, not a zero balance. One successful source can produce a useful partial snapshot while another is unavailable.

The current portfolio uses supported provider data. USD is the default display value while native asset quantities remain intact. Portfolio-value changes are distinct from investment gains or losses, with deposits and withdrawals separated when evidence supports it. Changes calculated by MyStacks require adequate comparison evidence; a first snapshot alone cannot establish a 24-hour gain or loss. Suitable provider-calculated historical metrics may be reused with their meaning, period, coverage, and observation time, without reconstructing the underlying history. A MyStacks indexer and historical reconstruction or P&L requiring MyStacks infrastructure are deferred at low priority. The [portfolio design](portfolio.md) owns common calculation definitions and the use of supported provider data. Exact formulas, cost basis, valuation sources, and supported metrics remain open and provider-dependent.

Mastra receives only authorized evidence and user context. The backend owns source permissions and current financial truth. Personal memory may retain goals or preferences, but it cannot replace current balances, prices, or authorization.

## 6. Account lifecycle and data controls

### 6.1 Connection removal and incomplete work

Only the website dashboard can remove a financial connection; chat explains the action and links to the dashboard. Disconnecting stops future reads through that connection and excludes the source from the current portfolio while other sources continue. New jobs and protected reads respect current connection state. Affected tasks continue only when remaining authorized evidence fulfills their request; otherwise pause them and explain why once in their originating channel. Restoring the source leaves them paused until the user resumes them from that channel at the next scheduled time without a backlog. Temporary provider outages follow failure recovery rather than explicit-disconnection behavior. The [task design](tasks.md) owns the tentative enforcement mechanism. Past reports remain under the separate retention policy. Provider revocation depends on the integration; a directly created exchange key may also need removal in the provider's own settings.

Supported renewal without user action is automatic. Request reconnect only when the provider requires user action; temporary outages mark the source unavailable rather than implying expired authorization. Exact provider renewal and retry mechanisms remain tentative.

For an EVM or Solana wallet, disconnecting ends the connection used for reads and monitoring. Reconnecting that wallet requires fresh wallet-control verification. An expired sign-in session requires MyStacks reauthentication, while an expired wallet challenge only ends that incomplete verification attempt.

Disconnecting, deleting imported data, and deleting the MyStacks account are separate operations. Their retention and deletion policies remain open, and account deletion is deferred. Onboarding interruption preserves completed connections and returns to the same dashboard so the user can retry, choose another source, or continue to chat without reconnecting successful sources.

### 6.2 Returning users and recovery

After successful authentication, returning users resume the same MyStacks account and its dashboard, using the same **Add account** flow as new users. Session expiry requires reauthentication; it does not create a replacement portfolio. The low-priority ordinary phone-number change flow verifies the current and new numbers, updates the primary-phone binding, and preserves the stable account ID, financial connections, channel conversations, shared personal memory, preferences, tasks, results, and separately linked messaging channels. Recovery and changes to login or messaging identities must preserve the established account binding and require evidence appropriate to the sensitive data being exposed. Lost-number and email recovery are low priority, with exact evidence and policy open.

Only website settings add or disconnect messaging channels. The website and chat change the same proactive insight delivery channels setting, and notification destinations must use confirmed channel bindings. Scheduled tasks keep their originating channel and pause on its disconnect; proactive insights use the selected proactive insight delivery channels in section 3.3. The [task design](tasks.md) owns task delivery and cancellation behavior, while pending proactive dispatch mechanics remain tentative. Access from another user's browser, conversation, or connection identifier, or another channel's task/result identifiers, must be rejected at the owning backend boundary.

### 6.3 Export and deletion proposals

User-facing data review and export remain proposed capabilities whose exact scope and retention policy need agreement. Account deletion is deferred. Any offered data control must distinguish stopping source access, deleting stored evidence, forgetting derived memory, removing reports, and closing the account. The runtime design owns cleanup of enabled memory layers; the task design owns suppression of future work and notifications.

The product must state what an operation covers and report its outcome accurately. It must not claim deletion from a financial provider, messaging history, backups, or legally retained records unless the applicable contract supports that claim. Exact retained records, recovery windows, and deletion timing remain open.

## 7. Open decisions

- **Source coverage:** supported EVM and Solana wallet networks and types, provider coverage, EVM cross-chain proof policy, Binance account types, and supported assets and positions.
- **Wallet implementation:** maintained SIWE and wallet SDK choice and short-lived challenge TTL for EVM; signing protocol, SDK, provider, and challenge validation for Solana.
- **Hyperliquid connection:** mapping of the verified controlling wallet to supported master accounts, subaccounts, vaults, and account modes, and other connection mechanics. Verified-wallet reuse is accepted; Hyperliquid remains low priority.
- **Identity and recovery:** authentication provider and exact recovery evidence and reassignment policy. Phone-number changes, lost-number recovery, and email recovery are low priority; ordinary number changes verify the current and new phones.
- **Channel linking:** short-lived one-use challenge lifetime, supported sender formats, adapters, confirmation mechanics, and polling or server-sent-event updates. QR codes, direct buttons, and the copyable fallback are accepted; verification remains separate from the QR display or scan.
- **Proactive delivery:** context assembly and pending-dispatch mechanics within the accepted proactive insight delivery channels selection and current destination eligibility. Scheduled tasks remain channel-bound; their lifecycle belongs to the task design.
- **Apple messaging controls:** the [Apple messaging TODO](../TODO.md) owns unresolved service-specific controls; use only the minimum controls required by the selected service.
- **Other connection lifecycle details:** provider authorization and permission checks, supported renewal mechanisms, revocation, and first-read progress. Only provider-required user action prompts reconnect; EVM challenge expiry does not expire completed tracking.
- **Data controls:** account review and export scope, retained records, and completion reporting across storage owners and providers. Account deletion is deferred.

The overall architecture round must jointly finalize the tentative mappings and flow mechanics. These decisions refine the complete onboarding and account lifecycle. Observable acceptance belongs to the companion user stories.
