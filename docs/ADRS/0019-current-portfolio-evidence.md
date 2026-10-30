# Current portfolio evidence

## 1. Status and scope

**Status: ACCEPTED freshness and claim boundary.** Current portfolio analysis and account-specific proactive conclusions require fresh or near-fresh relevant account state. Exact maximum ages, service-level targets, and cache durations remain open; the decision does not claim that every selected provider meets the requirement.

The [requirements](../requirements.md) own product behavior. The [portfolio design](../design/portfolio.md) owns the evidence contract and calculations. The [managed-provider decision](0018-managed-financial-data-providers.md) owns vendor selection and validation, including delayed IBKR state and unresolved polling and licensing constraints. The [calculation decision](0015-provider-backed-portfolio-calculations.md) accepts provider-bounded analysis without a MyStacks indexer.

## 2. Decision

### 2.1 Obtain relevant account state at analysis time

When a claim depends on the user's present holdings, balances, positions, collateral, or account risk, obtain the latest available relevant state through the trusted backend connector at analysis time. Brief reuse is allowed only while the evidence remains suitable for that claim. Website previews, requested answers, scheduled work, and proactive investigations share this boundary.

**Fresh prices do not make old holdings current.** A current-exposure claim needs suitable account state as well as suitable price or market evidence. A new retrieval, successful refresh request, provider plan name, personalization memory, or earlier report does not establish current account state by itself.

### 2.2 Keep source time, retrieval time, and price time distinct

Retain source as-of time where established, backend retrieval time, relevant coverage, native values and units, and explicit unknown freshness. Track account-state and price freshness separately. Interpret provider update fields only after confirming what the fields mean for the selected endpoint and claim.

Select maximum evidence ages, refresh behavior, and brief cache durations by provider, evidence type, and supported claim before presenting that claim as current. A successful fetch may still return delayed upstream evidence. Reuse does not change its source age, coverage, or permitted use.

### 2.3 Use delayed evidence only for supported claims

Delayed or earlier observations may support a bounded historical statement or report when the answer identifies the relevant period and material limits. They must not silently support a current-exposure conclusion. If fresh relevant evidence is unavailable, omit that account-specific proactive current-exposure claim; other supported findings remain eligible.

For user-requested answers, use available information and state concise material limitations that affect the answer. A delayed source does not block analysis of fresh sources, useful historical reporting, or independent market information. Missing evidence cannot become zero assets or absence of risk, and a partial current view cannot imply complete portfolio coverage.

## 3. Rationale and alternatives

**Account state is part of a current financial claim.** Repricing an earlier position can produce a valid conditional calculation, but cannot establish that the user still holds it. Preserving account-state and price times avoids unsupported exposure or risk messages while retaining useful partial answers.

**The trade-off is fewer eligible current claims when a provider is delayed.** Treating the most recently retrieved response as current would increase apparent coverage by hiding upstream delay. Requiring all sources to be current before answering would unnecessarily withhold supported information. MyStacks instead matches each claim to its evidence and reports material limits concisely.

Approximately five daily periodic proactive investigations remain best effort under the accepted scheduling policy. This freshness boundary does not add continuous monitoring, an indexer, or a stronger event-detection guarantee.

## 4. Remaining choices and acceptance evidence

- **Freshness policy:** settle numeric maximum ages, appropriate brief reuse, refresh ownership, provider timestamp semantics, and service-level targets for each supported claim.
- **Vendor compatibility:** validate that account reads, polling allowances, permitted proactive use, and retained evidence can meet the product contract. Provider constraints do not authorize lower accepted investigation frequency or stale substitutes for current state.
- **Evidence checks:** exercise fresh account state with fresh and delayed prices, old holdings with new prices, a new retrieval of delayed state, unknown source times, a fresh subset of accounts, and unavailable relevant evidence. Current claims must remain bounded while supported requested answers remain useful.
