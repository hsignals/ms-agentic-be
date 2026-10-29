# Provider-backed portfolio calculations

## 1. Status and scope

**Status: ACCEPTED Phase 1 portfolio calculation direction.** MyStacks uses available provider evidence, suitable provider-calculated values, and best-effort code-based calculations without operating its own indexer. Financial methods, provider coverage, and the overall architecture remain tentative.

The [requirements](../requirements.md#32-portfolio-understanding), [portfolio stories](../user-stories/portfolio.md), and [portfolio design](../design/portfolio.md) own supported outcomes, evidence boundaries, and unresolved financial definitions.

## 2. Decision

### 2.1 Provider evidence and reusable calculations

Fetch the available provider data needed for the requested portfolio view, comparison, or analysis. Reuse suitable provider-calculated values when their meaning, period, units, scope, and observation time support the requested claim. Use common financial definitions and reusable calculation code across website previews, chat, reports, and tasks. E2B supports flexible analysis of authorized selected evidence within the existing execution boundary.

Provider-supplied history and historical metrics remain usable when their coverage and inputs support the answer. Phase 1 does not operate a MyStacks indexer; historical P&L or reconstruction requiring MyStacks to collect its own history or build dedicated infrastructure is deferred at low priority. Keeping the evidence needed to explain a result remains required and does not itself establish a history-reconstruction service.

### 2.2 Evidence limits

Available inputs determine which aggregate and historical claims are supported. Missing information is unavailable or partial, never zero assets or no risk. Supported current holdings and positions remain useful when historical measures are unavailable.

Balance change, cash flows, investment return, and profit remain distinct. Separate deposits and withdrawals from gains or losses when evidence supports it; when only balance change is supported, label it as balance change. This decision selects neither a provider nor valuation or performance formulas.

## 3. Rationale and alternatives

**Provider-backed reads establish the complete assistant flow first.** Modular connectors and shared calculations let supported evidence serve the dashboard, chat, and background work without making dedicated financial-history infrastructure a prerequisite.

**The trade-off is limited historical and aggregated coverage.** Operating an indexer and reconstructing history could support additional measures, but would add infrastructure and financial-method work beyond the accepted Phase 1 scope. MyStacks accepts provider-dependent coverage and best-effort calculations while preserving the meaning and limits of every supported claim.

## 4. Consequences and open choices

- **Consistency:** consumers reuse the financial evidence boundary and common definitions; they retain sources, times, coverage, assumptions, and calculation basis.
- **Partial answers:** unavailable history or one failed source must not block other supported findings or imply complete portfolio coverage.
- **Financial design:** provider selection, supported metrics and periods, valuation, cash-flow treatment, performance formulas, freshness, and retention remain open. Implementation must settle each method before presenting the corresponding measure as supported.
