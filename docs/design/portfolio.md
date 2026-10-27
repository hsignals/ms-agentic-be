# Portfolio technical design

## 1. Status, scope, and ownership

**Status: PROPOSED — discussion draft.** This design refines Phase 1 portfolio behavior; exact interfaces, schemas, storage, and financial methods remain open.

The [product requirements](../requirements.md) govern behavior, and the [portfolio user stories](../user-stories/portfolio.md) describe observable outcomes. The [architecture](../architecture.md) is authoritative for the Mastra runtime, shared workers, durable state, and trusted financial tools API.

The **financial tools API** owns authorized provider reads and the evidence used by the website, chat, reports, and background work. The portfolio boundary normalizes that evidence and performs supported calculations. Personalization memory cannot supply current holdings, prices, positions, or permissions.

[Onboarding design](onboarding.md) owns connection setup, credential intake, account binding, reconnect, and disconnect. This document owns the connector read boundary and financial evidence contract after a connection has been established.

## 2. Connector read boundary

### 2.1 Supported capabilities and provider adapters

Phase 1 includes supported on-chain wallet reads, Binance account reads, and Hyperliquid position reads. Exact networks, protocols, account types, instruments, endpoints, and SDKs require confirmation before implementation.

Provider adapters must:

- Read only the capabilities supported for the selected account or address; an established connection does not imply every provider capability is available.
- Translate provider data into shared evidence while retaining its source identity, native quantities and units, timestamps, and relevant provider meaning.
- Distinguish a successful empty result from unsupported coverage, permission failure, incomplete results, unavailable data, and unknown freshness.
- Return available evidence with explicit gaps when only part of a read succeeds; a provider failure cannot become a zero balance or absence of risk.

Capability coverage must accompany adapter results so consumers can explain which accounts, networks, assets, and position details were considered.

### 2.2 Public reads and private accounts

Public wallet or position data may be read for a supported address without private financial credentials. Following an address does not prove ownership or grant control. The connection boundary determines the user's selected address and network; a public address cannot authorize access to another user's saved connections or private data.

For private account reads, the backend must authorize the current user, connected account, requested object, and read operation before using backend-held credentials. Chat, website, jobs, and predefined monitoring use the same authorization boundary. Model-supplied account IDs and queued inputs do not establish authority.

Reads must respect current connection access. Once a source is disconnected, new reads through that connection stop. Presentation and retention of observations obtained before disconnection follow the data policy owned by onboarding and the architecture's state boundary.

### 2.3 Untrusted inputs and informational authority

The backend must validate external identifiers, networks, account selectors, and supported operation values at their owning boundary. Unknown or unauthorized input must be rejected rather than routed to a default account or network.

Provider responses, asset labels, user text, and supplied documents are untrusted data. They cannot change tool permissions, choose an authenticated user, supply executable instructions, or grant access to credentials. Provider values must be checked before entering normalized evidence; malformed values must remain an explicit gap or read failure.

Financial adapters expose read operations only. Their credentials remain in trusted backend code and must not enter model context, results, job inputs, traces, or generated-code execution. Evidence supports information and analysis; it does not authorize financial actions or specific buy, sell, or rebalance recommendations.

## 3. Shared financial evidence contract

### 3.1 Evidence needed by every consumer

Each financial observation or derived result must carry enough context to establish:

| Evidence | Required meaning |
| --- | --- |
| Source and scope | Provider, authorized account or selected public address, network where relevant, and supported coverage included in the read. |
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

Display currency, price sources, position valuation, liability treatment, conversion rules, exposure measures, and rounding policy require explicit decisions. This design does not select a financial method by default.

### 3.3 Partial information and freshness

Every portfolio result must state the coverage actually included. A connected source that was not successfully read remains a gap, even when other sources have valid evidence. A known zero requires evidence of a successful read for the relevant scope.

Earlier observations may support a useful partial answer only when their age and coverage are visible and the selected claim permits their use. Unknown freshness must remain unknown. Claim-specific freshness policies and refresh behavior remain open.

Consumers must explain what a gap limits. A partial holdings total cannot establish total wealth; missing position risk inputs cannot establish that no risk exists. Useful supported information remains available without waiting for every source to become current.

## 4. Snapshots, comparison, and consumer flow

### 4.1 Comparable observations

A portfolio snapshot is a view assembled from identified observations; it must not imply that all providers were observed at the same instant. Its included source coverage, observation times, and calculation basis must remain inspectable.

A comparison must retain both observations, their periods, coverage, units, and method. It must identify changes in connection scope or supported coverage instead of treating newly observed assets as investment gains or disappeared coverage as losses.

The historical baseline, availability of provider history, definition of a 24-hour interval, acceptable comparison times, and handling of missing baseline evidence remain open. Until the required comparison exists, the affected measure is unavailable or explicitly partial.

Changes in value, cash flows, investment return, and profit must remain distinct claims. Deposits, withdrawals, internal transfers, fees, and position accounting require agreed treatment before performance can be computed. No return formula or historical reconstruction policy is selected here.

### 4.2 Shared use across product surfaces

The authorized consumer requests the required supported scope, the financial boundary obtains or selects permitted evidence, and the portfolio boundary produces the requested view or calculation. The response carries its sources, times, coverage, and derivation through to presentation.

The website, chat, reports, digests, and monitoring must reuse this boundary and the same approved calculation meanings. They may select different views or observation times; they cannot silently redefine a measure. Generated-code analysis receives authorized selected evidence through the architecture's execution boundary.

Evidence needed to explain a retained result must remain associated with that result under the agreed data policy. Exact persistence, history collection, refresh ownership, reusable public data, private-data reuse, and retention remain open.

## 5. Acceptance evidence and open decisions

### 5.1 Required design checks

- With supported wallet, Binance, and Hyperliquid evidence, a combined view preserves source contributions and does not merge incompatible holdings or positions.
- With a successful empty read, a failed read, and an unknown as-of time, consumers distinguish zero, unavailable coverage, and unknown freshness.
- With matching observations and methods, website, chat, and digest calculations agree; changed times or coverage remain visible.
- With missing historical evidence or changed connection coverage, a 24-hour explanation does not invent investment performance.
- With unauthorized account input or disconnected access, every entry path denies new private reads without exposing another user's evidence or credentials.

### 5.2 Decisions required before implementation

Coverage, provider APIs and SDKs, evidence schemas, identity mappings, valuation and risk methods, freshness policies, comparison and cash-flow semantics, persistence, data reuse, retention, and operational metrics remain open. These decisions must preserve the requirements' read-only authority, useful partial answers, and accepted best-effort monitoring limits.
