# Onboarding user stories

## 1. Status and scope

**Status: proposed detailed stories.** Progressive onboarding is accepted. These stories propose its detailed experience and account controls; open choices require agreement before they become implementation acceptance criteria.

The governing [product requirements](../requirements.md) define Phase 1 as read-only financial information, analysis, and monitoring. Onboarding must not grant trading authority or promise specific buy, sell, or rebalance recommendations.

Messaging is the primary interaction surface, with a companion website for connecting accounts and viewing portfolios. The proposal covers launch connections for wallet addresses, Binance, and Hyperliquid; exact supported networks and account types remain open.

The [technical design](../design/onboarding.md) owns implementation choices. Authentication methods, the authentication provider, and messaging channels remain open product decisions.

## 2. Proposed journey

1. Enter through a phone-friendly website or supported messaging channel and reach the same authenticated account.
2. Connect one useful source or skip connections and explore available informational work.
3. See connection progress, coverage, and freshness for each source.
4. Receive useful portfolio information as soon as evidence is available, including a clearly labeled partial view.
5. After first value, consider another connection, personalization, or the morning digest.
6. Return to manage connections and notification preferences.

Connecting every account is not a prerequisite for value. A skipped or failed connection does not imply a zero balance.

## 3. Proposed user stories

### 3.1 US-ONB-01 — Continue across chat and web

**As a new user, I want to start on my phone in chat or on the website so that I can continue onboarding through one account.**

- Both entry points explain the read-only informational purpose before requesting a connection.
- The user can authenticate and continue an account-connection step on the companion website.
- After the user links the supported messaging identity to their account, chat and web show the same connection status and portfolio coverage.
- When a handoff cannot continue, the user sees a clear way to retry without unknowingly creating a second account.

### 3.2 US-ONB-02 — Choose a useful starting point

**As a new user, I want to choose one supported source or skip connections so that I can begin without collecting every account first.**

- The source chooser presents wallet addresses, Binance, and Hyperliquid with their supported coverage and required access.
- The user can choose the supported accounts or addresses they want to include and leave others for later.
- If a provider is unavailable, the user can retry, choose another source, or continue and add it later.
- If the user skips, the product explains that no portfolio is connected and offers useful financial research or a path back to connections.

### 3.3 US-ONB-03 — Follow a public address

**As a user, I want to add a wallet or Hyperliquid account address so that I can understand the public assets and positions available for that address.**

- For a wallet, the user supplies a public address and selects a supported network; the product shows the address and network before adding it.
- For Hyperliquid, the user supplies the actual account address whose supported public positions they want to follow.
- The product explains that following public data does not prove ownership or grant control of the address.
- Unsupported or invalid input produces a clear correction prompt without recording a successful connection.

### 3.4 US-ONB-04 — Connect Binance with read-only access

**As a Binance user, I want clear connection instructions and visible permissions so that I can share supported account information without granting financial action authority.**

- Before connecting, the user sees supported account coverage and the read-only permissions required.
- The user completes a guided read-only API-key form on the companion website or a verified provider authorization flow; chat does not ask for API secrets.
- If the supplied permissions do not meet the supported read-only connection requirements, the product explains what the user needs to correct.
- The result identifies which supported accounts are included, and a failed attempt offers correction or retry without claiming that assets were loaded.

### 3.5 US-ONB-05 — Understand the first read

**As a user, I want progress and results for each source so that I know what is ready and what still needs attention.**

- Each source shows whether it is waiting, reading, ready, or needs attention, with a useful next action when one is available.
- Ready information identifies its source, coverage, and as-of time or unknown freshness.
- If one source is slow or fails, available information from other sources remains usable and the missing coverage is visible.
- An unread or failed source is never shown as a zero balance or evidence that no risk exists.

### 3.6 US-ONB-06 — Receive a useful first portfolio answer

**As a user, I want an understandable first answer from available evidence so that I can see value before completing every setup step.**

- Once useful data is available, the product presents supported holdings or positions and names the sources included.
- A partial view states what is missing and limits totals and conclusions to the available coverage.
- A change such as a 24-hour gain or loss appears only when the required comparison evidence exists; otherwise the product explains that it is unavailable.
- The user can ask a natural-language financial question, and the answer stays within Phase 1 informational scope.

### 3.7 US-ONB-07 — Choose what happens after first value

**As a user, I want optional next steps after the first useful result so that I can shape the experience without delaying access to it.**

- The user can add another source, share a useful preference, or continue without either step.
- The morning digest offer explains its informational purpose, delivery destination, and best-effort timing before the user chooses an available option.
- Notification consent, default behavior, timing, and timezone rules remain subject to the product decisions below. Monitoring checks run every couple of hours or daily under the product's best-effort limits.
- The user can find controls to change or pause proactive notifications and ongoing informational tasks.

### 3.8 US-ONB-08 — Manage connected sources

**As a returning user, I want to review and manage my connections so that portfolio coverage reflects what I intend to share.**

- The connections view identifies each source, its included accounts or addresses, status, coverage, and freshness.
- When access expires or a source needs attention, the user can reconnect or retry and see the resulting status.
- The user can disconnect a source; disconnecting stops new reads and the current portfolio view reflects the changed coverage.
- The product distinguishes disconnecting from deleting retained information and explains the applicable deletion policy once it is decided.

### 3.9 US-ONB-09 — Return to the same account or recover access

**As a returning user, I want to recover access to my existing account so that I can continue with my connections, preferences, and ongoing work.**

- Successful sign-in returns the user to their own saved state without creating a duplicate account.
- If sign-in expires, the user sees how to authenticate again and retains completed setup.
- A changed phone number or messaging identity has a clear verification and recovery route before existing financial information becomes accessible.
- The user can identify and change the messaging destination linked to their account through a verified flow; the effect on pending notifications is explained.

### 3.10 US-ONB-10 — Understand and control account data

**As a user, I want to understand what MyStacks stores and how to remove it so that I can make informed choices about my information.**

- The product distinguishes disconnecting a financial source, forgetting personal memory, deleting retained data, and closing the MyStacks account.
- Proposed review, export, and deletion controls explain which records they cover and any stated retention limits before the user proceeds.
- A request reports its actual progress or outcome and does not imply that data outside the product's control has been erased.
- The detailed scope, identity checks, retention, and completion behavior remain open product decisions; memory-specific controls belong to the [memory stories](memory.md).

## 4. Open product decisions

| Decision | What needs agreement |
| --- | --- |
| Account entry and continuity | Authentication method and provider, messaging channels, identity-linking experience, and recovery behavior. |
| Launch coverage | Supported wallet networks, Binance account types, Hyperliquid position coverage, and user-facing exclusions. |
| Binance connection route | Whether launch uses a guided read-only API-key form or an available, verified provider authorization flow. |
| First portfolio answer | The useful minimum for each source, valuation currency, and definitions for portfolio changes. |
| Personalization | Which optional preferences to ask for after first value and what users can inspect, correct, or forget. |
| Notifications | Consent and defaults, digest timing and timezone, delivery destination, alert controls, and how best-effort monitoring limits are explained. |
| Data policy | Retention after disconnect, deletion behavior, and how previously read information is presented. |

These decisions need agreement before the affected stories become implementation acceptance criteria.
