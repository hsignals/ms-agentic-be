# Provider-backed portfolio calculations

## 1. Status and scope

**Status: ACCEPTED Phase 1 portfolio calculation direction.** MyStacks uses available provider evidence, suitable provider-calculated values, and best-effort code-based calculations without operating its own indexer. The [managed-provider decision](0018-managed-financial-data-providers.md) selects the initial provider direction; validated coverage, financial methods, and the overall architecture remain tentative.

The [requirements](../requirements.md#32-portfolio-understanding), [portfolio stories](../user-stories/portfolio.md), and [portfolio design](../design/portfolio.md) own supported outcomes, evidence boundaries, and unresolved financial definitions.

## 2. Decision

### 2.1 Provider evidence and reusable calculations

Fetch the provider data needed for the requested portfolio view, comparison, or analysis through backend-authorized reads. The [capability decision](0006-composable-agent-capabilities.md) uses **programmatic tool calling** to compose supported SDK or provider API calls in E2B, with **credential brokering** through native egress-proxy injection outside the VM or a user-bound backend read bridge for application signing or proxy-incompatible authentication. Raw provider secrets stay outside sandbox environments, files, and prompts; authorized current-user financial data remains available for analysis under the accepted exposure trade-off.

Current portfolio analysis and account-specific proactive conclusions require the fresh or near-fresh relevant account state defined in the [current-evidence decision](0019-current-portfolio-evidence.md); a new price cannot make old holdings current. Reuse suitable provider-calculated values when their meaning, period, units, scope, and observation time support the requested claim. Use common financial definitions and reusable calculation code across website previews, chat, reports, and tasks.

E2B supports flexible Python, JavaScript, shell, and file-based analysis within the execution boundary. A script may fetch, paginate, and analyze permitted provider data in one run; provider integration and financial evidence validation remain MyStacks responsibilities. Tools may materialize selected data as run files and give the model compact metadata and paths instead of every raw row.

Provider-supplied history and historical metrics remain usable when their coverage and inputs support the answer. Retain useful provider inputs actually used, reusable intermediate calculations, final results, and supporting evidence under the [analysis retention decision](0023-analysis-data-retention-and-object-storage.md), subject to provider data rights. Saved evidence can support follow-ups without establishing current account state. Phase 1 does not operate a MyStacks indexer; historical P&L or reconstruction requiring MyStacks to collect its own history or build dedicated infrastructure is deferred at low priority.

### 2.2 Evidence limits

Available inputs determine which aggregate and historical claims are supported. Missing information is unavailable or partial, never zero assets or no risk. Delayed observations may support bounded historical or reporting claims, but cannot silently establish current exposure. Supported current holdings and positions remain useful when another source or a historical measure is unavailable; requested answers explain material limitations concisely.

Balance change, cash flows, investment return, and profit remain distinct. Separate deposits and withdrawals from gains or losses when evidence supports it; when only balance change is supported, label it as balance change. Provider selection belongs to the managed-provider decision; valuation and performance formulas remain open.

## 3. Rationale and alternatives

**Provider-backed reads establish the complete assistant flow first.** Backend-authorized provider capabilities and shared calculations let supported evidence serve the dashboard, chat, and background work without making dedicated financial-history infrastructure a prerequisite.

**The trade-off is limited historical and aggregated coverage.** Operating an indexer and reconstructing history could support additional measures, but would add infrastructure and financial-method work beyond the accepted Phase 1 scope. MyStacks accepts provider-dependent coverage and best-effort calculations while preserving the meaning and limits of every supported claim.

## 4. Consequences and open choices

- **Consistency:** consumers reuse the financial evidence boundary and common definitions across direct reads and backend APIs; they retain sources, times, coverage, assumptions, and calculation basis.
- **Partial answers:** unavailable history or one failed source must not block other supported findings or imply complete portfolio coverage.
- **Financial design:** validated provider coverage, supported metrics and periods, valuation, cash-flow treatment, performance formulas, exact freshness limits, and provider-specific retention permissions remain open. Implementation must settle each method before presenting the corresponding measure as supported.
