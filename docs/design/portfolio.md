# Portfolio technical design

## 1. Status, scope, and ownership

**Status: TENTATIVE — architecture discussion draft.** The portfolio product direction is agreed; the technical mappings below remain tentative pending the overall architecture round. Durable application records use the shared [PostgreSQL database](../ADRS/0013-shared-postgresql-storage.md). Exact interfaces, schemas, retention, and financial methods remain open.

The [product requirements](../requirements.md) govern behavior, and the [portfolio user stories](../user-stories/portfolio.md) describe observable outcomes. The [architecture](../architecture.md) is authoritative for the Mastra runtime, shared workers, durable state, and trusted financial tools API. The [provider-backed calculation decision](../ADRS/0015-provider-backed-portfolio-calculations.md) owns the trade-off between initial provider coverage and dedicated indexing or history infrastructure.

The **financial tools API** owns authorized provider reads and the evidence used by the persistent website dashboard's portfolio preview, chat, reports, and background work. The portfolio boundary normalizes that evidence and performs supported calculations. Personalization memory cannot supply current holdings, prices, positions, or permissions. Portfolio answers and reports use concise, precise text in chat, with deeper detail through follow-ups. Image replies are low priority; extensive deep-research reports and polished website report artifacts are deferred.

Financial connections and portfolio evidence belong to the account and are available from its linked channels. Conversation history, jobs, scheduled tasks, and their results remain within their originating channel; access to shared evidence does not grant access to another channel's work.

[Onboarding design](onboarding.md) owns connection setup, credential intake, account binding, reconnect, and disconnect. This document owns the connector read boundary and financial evidence contract after a connection has been established.

## 2. Connector read boundary

### 2.1 Supported capabilities and provider adapters

Phase 1 includes supported EVM and Solana wallet reads, Binance account reads, and Hyperliquid position reads. **Hyperliquid remains low priority and in scope.** Exact networks, protocols, account types, instruments, endpoints, and SDKs require confirmation before implementation.

Phase 1 aggregates current supported provider data and metrics with best-effort calculations in code, without a MyStacks indexer. Suitable provider-supplied historical metrics and calculations supported by available provider inputs remain eligible. Historical P&L or reconstruction requiring MyStacks to build its own indexer or dedicated history infrastructure is **deferred and low priority**. A read requests the supported data needed for the question, preview, or task rather than collecting every available account or historical record.

Provider adapters must:

- Read only the capabilities supported for the selected account or address; an established connection does not imply every provider capability is available.
- Translate provider data into shared evidence while retaining its source identity, native quantities and units, timestamps, and relevant provider meaning.
- Distinguish a successful empty result from unsupported coverage, permission failure, incomplete results, unavailable data, and unknown freshness.
- Return available evidence with explicit gaps when only part of a read succeeds; a provider failure cannot become a zero balance or absence of risk.

Capability coverage must accompany adapter results so consumers can explain which accounts, networks, assets, and position details were considered.

### 2.2 Public reads and private accounts

Public blockchain data may be available without private financial credentials, but MyStacks portfolio tracking requires a connection established through the source's setup flow. For EVM and Solana wallets, the backend must resolve an active **verified wallet connection** belonging to the current user before importing holdings or starting tracking. A raw address, wallet-connect event, uploaded file, model argument, or queued input cannot substitute for wallet-control verification. The [onboarding design](onboarding.md) owns verification for each wallet family, accepted reuse of eligible verified wallets for Hyperliquid setup, and remaining source-connection mechanics.

Before a connection-scoped read, the backend must authorize the current user, connected account or wallet, requested object, and read operation. Private account reads use backend-held credentials after those checks. Chat, website, jobs, and predefined monitoring use the same authorization boundary. A public address cannot authorize access to another user's saved connection or private data.

Reads must respect current connection access. Financial connections can be removed only on the website; chat links to the same dashboard for connection management. Once a source is disconnected, new reads stop and the source is excluded from the current portfolio while other sources continue. Scheduled work may continue only when remaining authorized evidence fulfills its request; otherwise the task pauses and explains why once, with manual resume after restoration. The [task design](tasks.md) owns that lifecycle. Past reports are retained under the separate data policy owned by onboarding and the architecture's state boundary.

### 2.3 Untrusted inputs and informational authority

The backend must validate external identifiers, networks, account selectors, and supported operation values at their owning boundary. Unknown or unauthorized input must be rejected rather than routed to a default account or network.

Provider responses, asset labels, user text, and supplied documents are untrusted data. They cannot change tool permissions, choose an authenticated user, supply executable instructions, or grant access to credentials. Provider values must be checked before entering normalized evidence; malformed values must remain an explicit gap or read failure.

Financial adapters expose read operations only. Their credentials remain in trusted backend code and must not enter model context, results, job inputs, traces, or generated-code execution. Evidence supports information and analysis; it does not authorize financial actions or specific buy, sell, or rebalance recommendations.

## 3. Shared financial evidence contract

### 3.1 Evidence needed by every consumer

Each financial observation or derived result must carry enough context to establish:

| Evidence | Required meaning |
| --- | --- |
| Source and scope | Provider, connection-bound account or wallet address, network where relevant, and supported coverage included in the read. |
| Financial identity | Asset, holding, or position identity, with provider distinctions retained until an approved mapping establishes equivalence. |
| Native values and units | Original financial quantities, currencies, price units, position direction, and other semantics needed to interpret the value. |
| Time | Provider as-of time when available, collection time, and explicit unknown freshness when an as-of time cannot be established. |
| Availability and gaps | Successful empty coverage, unavailable or unsupported portions, partial reads, and any limits affecting the claim. |
| Derivation | Contributing observations, conversion or calculation basis, assumptions, and the method used for a derived result. |

These are semantic requirements, not a selected record schema. Financial values must retain required precision in their native domain representation; transport and storage encodings belong at those boundaries.

Collection time cannot substitute for a missing provider as-of time. A successfully retrieved response may still contain earlier observations. Consumers must retain that distinction when describing freshness.

### 3.2 Normalization and valuation

Normalization must preserve source-level detail while giving consumers one meaning for each shared concept. Account balances, collateral, position size, liabilities, and valuation are different concepts; equal numeric values do not make them interchangeable.

Asset and position identity mappings must prevent unsupported merging across networks, instruments, or representations. The aggregation must avoid counting the same represented value twice when the provider exposes overlapping views. Exact mappings and accounting treatment remain open.

Totals and concentration calculations may combine only values compatible with the approved measure and valuation basis. Derived values must retain the contributing evidence and identify excluded or unpriced portions. Native amounts remain available even when a conversion or aggregate cannot be produced.

Display values default to USD while native asset quantities and units remain available. Alternate display currencies are low priority. Price sources, position valuation, liability treatment, conversion rules, supported exposure measures, and rounding policy require explicit decisions. Supported provider metrics, including supplied cost basis or performance values, must retain their meaning and evidence limits.

### 3.3 Partial information and freshness

Every portfolio result must state the coverage actually included. A connected source that was not successfully read remains a gap, even when other sources have valid evidence. A known zero requires evidence of a successful read for the relevant scope.

Earlier observations may support a useful partial answer only when their age and coverage are visible and the selected claim permits their use. Unknown freshness must remain unknown. Claim-specific freshness policies and refresh behavior remain open.

Consumers must describe the scope actually covered. A partial holdings total cannot establish total wealth; missing position risk inputs cannot establish that no risk exists. Conversational answers use available information without routine missing-data warnings and explain unavailable information when the user explicitly asks for it. Useful supported information remains available without waiting for every source to become current.

## 4. Provider metrics, comparisons, and consumer flow

### 4.1 Current views and supported comparisons

A portfolio snapshot is a view assembled from identified observations; it must not imply that all providers were observed at the same instant. Its included source coverage, observation times, and calculation basis must remain inspectable.

A comparison calculated by MyStacks must retain the contributing observations, their periods, coverage, units, and method. A provider-calculated comparison must retain the provider's stated meaning, period, coverage, units, and observation time; using it does not require MyStacks to reconstruct its underlying history. Consumers must identify changes in connection scope or supported coverage instead of treating newly observed assets as investment gains or disappeared coverage as losses.

Provider metrics, history, and available inputs determine which comparisons are possible. The meaning of supported metrics, definition of a 24-hour interval, acceptable comparison times, and handling of missing inputs remain open. Until the required evidence exists, the affected measure is unavailable or explicitly partial; a connection does not itself guarantee historical analytics. Missing comparison evidence does not prevent a current portfolio view from using supported holdings, positions, or other metrics.

Changes in value, cash flows, investment return, and profit must remain distinct claims. When provider data supports the distinction, calculations separate deposits and withdrawals from investment gains or losses. If the available inputs support only balance change, consumers label it as balance change. Exact treatment of internal transfers, fees, cash flows, position accounting, and return formulas remains open for supported measures; reconstruction requiring MyStacks history infrastructure remains deferred.

### 4.2 Shared use across product surfaces

The authorized consumer requests the required supported scope, the financial boundary obtains or selects permitted evidence, and the portfolio boundary produces the requested view or calculation. The response carries its sources, times, coverage, and derivation through to presentation.

After each connection, the website dashboard shows the connection result and available portfolio preview, with **Add more** and **Continue to chat**. New and returning users use the same **Add account** flow. Chat requests to add or manage financial connections link to this dashboard.

The preview, chat, reports, digests, and monitoring must reuse this boundary, common financial definitions, and reusable calculation code. Suitable provider-calculated values may be reused when their meaning, units, scope, and observation time support the requested claim; code computes additional supported results. Consumers may select different views or observation times, but cannot silently redefine a measure. E2B supports flexible analysis of authorized selected evidence through the architecture's execution boundary.

Backend access to a job, scheduled task, or result must bind both the account and its originating channel. Shared portfolio evidence can support a new request in either linked channel without loading another channel's conversation, task records, or results.

Evidence needed to explain a retained result must remain associated with that result under the agreed data policy. The provider-based calculation approach preserves the architecture's required durable data, results, and generated artifacts. Retaining that evidence does not require a dedicated history collection or reconstruction service. Exact persistence mappings, refresh ownership, reusable public data, private-data reuse, and retention remain open.

## 5. Acceptance evidence and open decisions

### 5.1 Required design checks

- With supported EVM wallet, Solana wallet, Binance, and Hyperliquid evidence, a combined view preserves source contributions and does not merge incompatible holdings or positions.
- After a new or returning user adds a source, the dashboard shows the result and available preview and allows another source through the same flow or continuation to chat.
- With supported valuation data, USD display values preserve the native quantities and units used to explain holdings and positions.
- With a successful empty read, a failed read, and an unknown as-of time, consumers distinguish zero, unavailable coverage, and unknown freshness.
- With matching observations and methods, calculations in the preview, chat, scheduled tasks, and digests agree; changed times or coverage remain visible.
- With a supported provider-calculated metric, consumers preserve its meaning, period, coverage, freshness, and source without requiring MyStacks to reconstruct history.
- With missing inputs for a calculated comparison or changed connection coverage, an explanation does not invent investment performance; current supported information remains usable.
- With provider-supported cash-flow data, an explanation separates deposits and withdrawals from investment gains or losses; balance-only inputs produce a balance-change claim.
- With the same linked account in two channels, each can use shared financial evidence, while job, scheduled-task, and result access remains restricted to its originating channel.
- With unverified EVM or Solana input, every entry path refuses wallet import or tracking until wallet-control verification succeeds. Supplying an address through chat, a file, or a scheduled task cannot bypass the connection flow.
- With unauthorized account input or disconnected access, every entry path denies new reads through that connection without exposing another user's evidence or credentials.

### 5.2 Decisions required before implementation

Decisions for current provider aggregation include exact coverage, provider APIs and SDKs, evidence schemas, identity mappings, supported provider metrics and calculation formulas, valuation and risk methods, freshness policies, supported comparison and cash-flow semantics, persistence mappings, data reuse, retention, and operational metrics. These decisions must preserve the requirements' read-only authority, useful partial answers, and accepted best-effort monitoring limits. Historical P&L or reconstruction requiring MyStacks to build its own indexer or dedicated history infrastructure remains deferred and low priority.
