# Portfolio user stories

## 1. Status and scope

**Status: Phase 1 discussion draft.** The combined view of current provider data, dashboard flow, shared account evidence, USD display default, and provider-based calculation direction are agreed. Exact coverage, supported metrics, and financial methods remain open.

The governing [product requirements](../requirements.md) define read-only financial information, analysis, and monitoring. Portfolio answers must exclude specific buy, sell, or rebalance recommendations and financial actions.

The portfolio combines the **supported, connected portion** of EVM and Solana wallets, Binance accounts, and Hyperliquid positions, using current data and metrics supplied by the supported providers. It must not imply coverage of accounts, networks, instruments, or assets the user has not connected or the product does not support. Wallet tracking requires proof of wallet control through the connection flow.

Chat is the default for portfolio questions and updates, and portfolio answers in chat follow user requests. The persistent website dashboard manages financial connections and shows the available portfolio preview after each connection. Chat and that preview must explain the same financial facts, with scope and freshness represented accurately.

Portfolio answers and reports must be concise, precise, and readable directly in chat, with key numbers and necessary explanation or evidence. Follow-up questions provide deeper detail. Image replies are low priority; extensive deep-research reports and polished website report artifacts are deferred. The [technical design](../design/portfolio.md) owns shared financial evidence and read boundaries. [Onboarding](onboarding.md) owns connecting, reconnecting, and disconnecting sources.

## 2. User stories

### 2.1 US-PORT-01 — See the combined portfolio

**As a user with assets across sources, I want one view of my supported holdings and positions so that I can understand their combined scale and composition.**

- The view identifies the included wallet addresses, accounts, and position coverage across supported wallet networks, Binance, and Hyperliquid.
- Holdings and positions remain distinguishable, and the user can see which source contributes each item.
- When supported valuation evidence is available, the view shows a total for the included coverage and identifies its valuation basis. Display values default to USD while native asset quantities, such as BTC, ETH, and shares, remain available.
- When part of the portfolio cannot be valued or read, the view names the gap and labels affected totals as partial rather than implying complete wealth coverage.
- After each connection, the dashboard shows the connection result and available preview, with **Add more** and **Continue to chat**. New and returning users use the same **Add account** flow and can keep adding sources.

### 2.2 US-PORT-02 — Understand composition and concentration

**As a user, I want to understand what makes up my portfolio so that I can see where my exposure is concentrated.**

- The user can ask about the contribution of an asset or source and see the included holdings or positions supporting the answer.
- Each concentration measure states what it measures, the included coverage, and the total used for comparison.
- If holdings or positions cannot be compared under the supported measure, the answer explains the limit instead of combining unlike values.
- Explanations describe exposure and uncertainty without directing the user to buy, sell, or rebalance particular assets.

### 2.3 US-PORT-03 — Understand provider-supported changes

**As a user, I want to see supported change and performance measures so that I can understand what the available provider evidence says about my portfolio.**

- A provider-supplied change or performance measure identifies its source, meaning, period, and included coverage. A reported 24-hour change must have evidence supporting that period.
- Suitable provider-calculated values may be reused, and available provider inputs may support additional calculations. Connecting a source does not guarantee earlier observations or every historical measure.
- If inputs needed for a calculation are missing, the product marks the affected measure as unavailable or partial and explains why; current holdings and supported metrics remain usable.
- When a connection or its supported coverage changes, the explanation distinguishes that change from a supported change in the assets being observed.
- When the available data supports it, the answer separates deposits and withdrawals from investment gains or losses. A portfolio-value change is not labeled investment return or profit unless an agreed method supports that claim; if only balance change is supported, the answer labels it as balance change.

### 2.4 US-PORT-04 — Inspect an account or position

**As a user, I want to drill into a source, holding, or position so that I can check the facts behind a portfolio answer.**

- In chat, the user can ask about a source contributing to a combined answer or the connection preview and inspect its supported holdings or positions.
- The detail identifies the account or address, network where relevant, native quantity and unit, valuation evidence when available, and as-of time or unknown freshness.
- Supported position details identify their source and limits; risk information such as proximity to liquidation appears only when the required evidence is available.
- If a requested detail is unsupported or unavailable, the product explains the gap without presenting it as a zero value or evidence of safety.

### 2.5 US-PORT-05 — Use useful information despite gaps

**As a user, I want useful portfolio information when one source is stale or unavailable so that I can understand what is known without mistaking it for a complete picture.**

- Available sources remain usable when another source fails, is stale, or needs attention.
- The portfolio view identifies included and missing coverage, with source as-of times or an explicit statement that freshness is unknown. Conversational answers use the [assistant story's](assistant.md#21-us-chat-01--ask-questions-and-follow-up-naturally) best-effort presentation and describe their actual scope.
- Previously observed information is identified as such; it is not presented as a fresh read or silently substituted for an unavailable value.
- When provider access requires user action, chat links to the same website dashboard for connection controls. Supported renewal is automatic, and temporary outages appear as unavailable; a failed read is not zero assets or no risk.

### 2.6 US-PORT-06 — Get consistent facts across surfaces

**As a user, I want the connection preview, chat, reports, and digests to use the same portfolio facts so that I can understand and verify their conclusions.**

- For the same observations and calculation basis, the surfaces report consistent holdings, positions, valuations, and coverage.
- If two outputs use different observation times or coverage, each makes that difference clear enough to explain a changed result.
- Linked channels can use the same account-wide financial connections and portfolio evidence. Conversation history, jobs, scheduled tasks, and their results remain within their originating channel.
- A portfolio explanation or digest identifies the underlying sources and distinguishes reported facts, calculations, assumptions, and uncertain conclusions.
- A remembered preference may change presentation, but it cannot replace current financial evidence or expand account access.

Phase 1 aggregates current supported provider data and metrics with best-effort calculations in code, without a MyStacks indexer. Correct aggregation requires compatible identities, units, valuation, and treatment of overlapping provider views. Suitable provider-calculated values, including historical metrics, may be reused; additional supported calculations use common definitions across the preview, chat, and tasks. Available inputs limit the answers the product can support. Historical P&L or reconstruction requiring MyStacks to build its own indexer or dedicated history infrastructure is **deferred and low priority**.

## 3. Open product decisions

### 3.1 Coverage and portfolio measures

| Decision | What needs agreement |
| --- | --- |
| Supported coverage | Exact wallet networks and protocol coverage for EVM and Solana, Binance account types, Hyperliquid position types, instruments, and exclusions. |
| Valuation | Price sources, valuation basis, treatment of unpriced assets, liabilities, and positions, and conversion rules. USD is the default display currency; alternate display currencies are low priority. |
| Composition and concentration | Which measures to offer, what constitutes exposure, and which holdings or positions may share a comparison total. |
| Position risk | Supported position details, risk measures, evidence requirements, and language for incomplete risk information. |

### 3.2 Provider metrics and supported comparisons

| Decision | What needs agreement |
| --- | --- |
| Provider metrics | Which supplied change and performance measures are supported, with their meaning, period, coverage, and evidence requirements. |
| Supported comparisons | Which provider history and inputs support additional calculations, acceptable comparison times, and how missing inputs or changed connection coverage are explained. |
| Cash flows and performance | Treatment of deposits, withdrawals, transfers, fees, and other external flows where provider evidence supports it; definitions of return, profit, and performance for the supported measures. |
| Freshness | When each claim may use an earlier observation and how stale or unknown freshness is shown. |

These decisions must be settled before the affected measures become implementation acceptance criteria. The stories do not select financial calculation methods or a delivery schedule.
