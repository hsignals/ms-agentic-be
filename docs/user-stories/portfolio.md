# Portfolio user stories

## 1. Status and scope

**Status: PROPOSED — discussion draft.** These stories describe the complete Phase 1 portfolio experience; their detailed choices are not approved requirements.

The governing [product requirements](../requirements.md) define read-only financial information, analysis, and monitoring. Portfolio answers must exclude specific buy, sell, or rebalance recommendations and financial actions.

The portfolio combines the **supported, connected portion** of on-chain wallets, Binance accounts, and Hyperliquid positions. It must not imply coverage of accounts, networks, instruments, or assets the user has not connected or the product does not support.

Messaging is the primary interaction surface. The companion website provides a portfolio view. Both must explain the same financial facts, with source coverage and freshness visible.

The [technical design](../design/portfolio.md) owns the shared financial evidence and read boundaries. [Onboarding](onboarding.md) owns connecting, reconnecting, and disconnecting sources.

## 2. Proposed user stories

### 2.1 US-PORT-01 — See the combined portfolio

**As a user with assets across sources, I want one view of my supported holdings and positions so that I can understand their combined scale and composition.**

- The view identifies the included wallet addresses, accounts, and position coverage across supported wallet networks, Binance, and Hyperliquid.
- Holdings and positions remain distinguishable, and the user can see which source contributes each item.
- When supported valuation evidence is available, the view shows a total for the included coverage and identifies its valuation currency and basis.
- When part of the portfolio cannot be valued or read, the view names the gap and labels affected totals as partial rather than implying complete wealth coverage.

### 2.2 US-PORT-02 — Understand composition and concentration

**As a user, I want to understand what makes up my portfolio so that I can see where my exposure is concentrated.**

- The user can ask about the contribution of an asset or source and see the included holdings or positions supporting the answer.
- Each concentration measure states what it measures, the included coverage, and the total used for comparison.
- If holdings or positions cannot be compared under the supported measure, the answer explains the limit instead of combining unlike values.
- Explanations describe exposure and uncertainty without directing the user to buy, sell, or rebalance particular assets.

### 2.3 US-PORT-03 — Understand changes over 24 hours

**As a user, I want to see supported portfolio changes over 24 hours so that I can understand what changed and what remains unexplained.**

- A reported 24-hour change identifies the comparison period and the sources, holdings, or positions included in both observations.
- If the required earlier observation, prices, or comparable coverage is missing, the product marks the affected change as unavailable or partial and explains why.
- When a connection or its supported coverage changes, the explanation distinguishes that change from a supported change in the assets being observed.
- A change in portfolio value is not labeled investment return or profit unless an agreed method supports that claim, including its treatment of deposits and withdrawals.

### 2.4 US-PORT-04 — Inspect an account or position

**As a user, I want to drill into a source, holding, or position so that I can check the facts behind a portfolio answer.**

- From a combined answer or website view, the user can inspect the contributing source and its supported holdings or positions.
- The detail identifies the account or address, network where relevant, native quantity and unit, valuation evidence when available, and as-of time or unknown freshness.
- Supported position details identify their source and limits; risk information such as proximity to liquidation appears only when the required evidence is available.
- If a requested detail is unsupported or unavailable, the product explains the gap without presenting it as a zero value or evidence of safety.

### 2.5 US-PORT-05 — Use useful information despite gaps

**As a user, I want useful portfolio information when one source is stale or unavailable so that I can understand what is known without mistaking it for a complete picture.**

- Available sources remain usable when another source fails, is stale, or needs attention.
- The answer identifies included and missing coverage, with source as-of times or an explicit statement that freshness is unknown.
- Previously observed information is identified as such; it is not presented as a fresh read or silently substituted for an unavailable value.
- When access needs attention, the user can reach the connection controls, and the portfolio reflects the resulting connection status without treating a failed read as zero assets or no risk.

### 2.6 US-PORT-06 — Get consistent facts across surfaces

**As a user, I want the website, chat, reports, and digests to use the same portfolio facts so that I can understand and verify their conclusions.**

- For the same observations and calculation basis, the surfaces report consistent holdings, positions, valuations, and coverage.
- If two outputs use different observation times or coverage, each makes that difference clear enough to explain a changed result.
- A portfolio explanation or digest identifies the underlying sources and distinguishes reported facts, calculations, assumptions, and uncertain conclusions.
- A remembered preference may change presentation, but it cannot replace current financial evidence or expand account access.

## 3. Open product decisions

### 3.1 Coverage and portfolio measures

| Decision | What needs agreement |
| --- | --- |
| Supported coverage | Exact networks, protocols, Binance account types, Hyperliquid position types, instruments, and exclusions. |
| Valuation | Display currency, price sources, valuation basis, treatment of unpriced assets, liabilities, and positions, and any conversion rules. |
| Composition and concentration | Which measures to offer, what constitutes exposure, and which holdings or positions may share a comparison total. |
| Position risk | Supported position details, risk measures, evidence requirements, and language for incomplete risk information. |

### 3.2 Changes and historical evidence

| Decision | What needs agreement |
| --- | --- |
| Comparison periods | Meaning of a 24-hour comparison, acceptable earlier observations, and how changed connection coverage is explained. |
| Historical baseline | When collection starts, whether supported historical data is obtained, and what users see before a baseline exists. |
| Cash flows and performance | Treatment of deposits, withdrawals, transfers, fees, and other external flows; definitions of return, profit, and performance. |
| Freshness | When each claim may use an earlier observation and how stale or unknown freshness is shown. |

These decisions must be settled before the affected measures become implementation acceptance criteria. The stories do not select financial calculation methods or a delivery schedule.
