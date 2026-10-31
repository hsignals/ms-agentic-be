# Managed financial data providers

## 1. Status and scope

**Status: ACCEPTED initial provider direction, subject to vendor validation.** MyStacks targets SnapTrade for supported exchange and brokerage accounts, Zerion for EVM and Solana wallets, and a low-priority direct Hyperliquid connector. Selection does not establish production approval, complete coverage, or freshness guarantees.

The [requirements](../requirements.md) own product outcomes. The [portfolio design](../design/portfolio.md) owns connector and evidence behavior; the [onboarding design](../design/onboarding.md) owns setup, verification, and connection lifecycle. The [calculation decision](0015-provider-backed-portfolio-calculations.md) accepts provider-bounded calculations without a MyStacks indexer; the [current-evidence decision](0019-current-portfolio-evidence.md) governs which claims account observations support.

## 2. Decision

### 2.1 Initial providers and target institutions

| Source | Initial direction | Coverage boundary |
| --- | --- | --- |
| Exchange and brokerage accounts | **SnapTrade**, initially targeting **Binance, Coinbase, Interactive Brokers (IBKR), moomoo, and Robinhood** for a mixed, global audience. | Validate each institution's regions, account types, authorization, read-only permissions, and evidence freshness before offering the integration. A target list does not promise global eligibility. |
| EVM and Solana wallets | **Zerion** as the primary managed wallet data provider. | Offer only validated network, token, transaction, and position capabilities; wallet-control verification remains a MyStacks requirement. |
| Hyperliquid | **Direct REST information reads on demand; low priority.** | Validate supported account scopes, modes, and fields before offering a claim. |
| Further connectors | **DeBank** is an optional future complement for demonstrated EVM gaps; **Bybit, Upbit, and prediction-market connectors are deferred**. | A second wallet provider requires a concrete coverage need and compatible evidence semantics. |

SnapTrade lists the five target institutions in its [broker access guide](https://docs.snaptrade.com/docs/broker-access-guide). Zerion describes [EVM and Solana wallet data](https://developers.zerion.io/introduction); its [chain capability list](https://zerion.io/api/chains) distinguishes supported Solana tokens and transactions from Solana DeFi marked as coming soon. This does not establish complete Solana position coverage.

### 2.2 Provider-driven coverage through trusted connectors

Let validated provider capabilities define the supported scope. Do not promise a complete product taxonomy across assets, instruments, protocols, or account types. Adapters preserve provider identity, native values, source times, retrieval times, coverage gaps, and financial meaning. A successful connection or empty response cannot establish unsupported coverage or absence of risk.

Website previews, chat, scheduled tasks, and proactive investigations use the same backend-authorized provider capabilities and evidence contract. The backend resolves the current user's active connection and permitted read scope.

E2B may use supported provider SDKs or APIs through **programmatic tool calling** under backend-controlled provider egress. **Credential brokering** supplies supported provider authentication through native egress-proxy injection outside the VM; application signing or proxy-incompatible authentication uses a user-bound backend read bridge. The backend chooses the user, destination, read scope, and object authority. Raw provider secrets stay outside sandbox environments, files, and prompts; read-only access cannot expose other users' private data or keys.

Provider integration and evidence validation remain MyStacks responsibilities; broad SDK/API access does not require a separate bespoke tool for each analysis. The [credential decision](0002-backend-owned-financial-credentials.md) owns persistence and brokering, including processing by the selected external secret/proxy layer. The [capability decision](0006-composable-agent-capabilities.md) owns programmatic composition; the [sandbox decision](0003-sandboxed-code-execution.md) owns the accepted current-user financial-data exposure trade-off. Private connection authority remains separate from public blockchain data.

### 2.3 Hyperliquid account reads and Webshare transport

Hyperliquid setup reuses an eligible verified EVM wallet without another wallet-control signature, or verifies another supported wallet through a readable website challenge, then confirms the supported account scope. The connector queries the **actual account address** after backend connection authorization. Hyperliquid's documented [information reads](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint) take public account addresses without a private key, OAuth token, or trading key; the documentation warns that an agent-wallet address can return an empty result.

Normalize supported [account abstraction modes](https://hyperliquid.gitbook.io/hyperliquid-docs/trading/account-abstraction-modes) before valuation or risk analysis. Unified and portfolio-margin modes change how balances and collateral are represented. Shared collateral and overlapping Zerion evidence must not be counted twice. History remains bounded by documented endpoint coverage and pagination; connection support does not establish complete historical reconstruction.

**Use Webshare for the trusted backend connector's outbound proxy transport.** Webshare documents [multiple connection types](https://help.webshare.io/en/articles/8375305-understanding-proxy-connection-types-direct-rotating-and-backbone); proxy type, count, region, rotation, routing, and rate-limit implementation remain open. Hyperliquid's [per-IP limits](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/rate-limits-and-user-limits), including its shared weighted REST budget, still apply to each exit IP. Workers using the same exit share that budget. Vendor selection establishes neither capacity nor freshness guarantees. Adopt WebSockets only when a concrete need justifies them beyond on-demand REST reads.

### 2.4 SnapTrade product and authentication model

**Commercial versus Personal OAuth remains open.** Commercial reads require backend application signing, so use a user-bound backend read bridge for that model, with no arbitrary-signing or unrestricted-forwarding capability. Personal OAuth can provide a standalone per-user read token for compatible egress-proxy injection, but users own their connections through SnapTrade Personal. The product choice must settle that lifecycle, not follow only from authentication convenience. Personal API keys must independently meet the required read-only authority. [Authentication methods](https://docs.snaptrade.com/docs/authentication-methods), [OAuth lifecycle and tokens](https://docs.snaptrade.com/docs/oauth-apps)

OAuth client secrets and refresh handling remain backend-owned. Exact narrow run-bound authorization for programmatic calls from E2B to the backend read bridge remains open; a model-facing tool call is a different interface.

## 3. Rationale and trade-offs

**Managed providers cover more of the intended audience through fewer integrations.** SnapTrade brings several exchange and brokerage targets into one integration; Zerion supplies a common wallet evidence source across EVM and Solana. The direct Hyperliquid path covers its account-specific information boundary without expanding the initial managed-provider set.

**The trade-off is provider-dependent eligibility, detail, freshness, and permitted use.** Direct integrations or dedicated indexing could address some gaps but add work beyond the accepted initial scope. MyStacks accepts bounded coverage while requiring every supported claim to retain its actual evidence limits. DeBank remains an optional response to a demonstrated EVM gap rather than another default dependency.

## 4. Required vendor validation

### 4.1 SnapTrade freshness, regions, polling, and permitted use

- **Holdings and transactions:** the [Real-time and Daily guide](https://docs.snaptrade.com/docs/realtime-data) says supported Real-time holdings calls fetch the latest brokerage data, while transactions on both plans are cached daily and delayed by one day. Broker availability still determines actual freshness; a plan name does not prove current account state.
- **IBKR:** the [IBKR integration](https://support.snaptrade.com/Interactive-Brokers-f62feaa69a1c822ebb0e01a28b2f195a?pvs=21) uses daily delayed Flex data. Holdings may lag by one or more days; first availability may take 24–48 hours, with longer weekend and holiday gaps. Establish the supported historical/reporting use and visible limitations. A premium or Real-time plan is not an established fix for that upstream delay.
- **moomoo:** the [integration notes](https://support.snaptrade.com/Moomoo-e33feaa69a1c836f891381bb17911594) support US and Canadian accounts and require login again after the 30-day token lifecycle. Validate eligibility for the global audience and reconnect behavior. Canadian-listed market quotes are end-of-day delayed, which is distinct from account-state freshness.
- **Binance:** the [integration notes](https://support.snaptrade.com/Binance-de2feaa69a1c8362af15015d31eefd1f?pvs=21) describe API-key and secret setup, spot accounts, and no subaccounts. Confirm the read-only path and Binance.US support, and reconcile regional listings before promising eligibility. Production access in the broker guide does not imply end-user OAuth or a keyless flow.
- **Polling and capacity:** the [launch guide](https://docs.snaptrade.com/docs/launch-guide) says background balances, positions, and orders calls should occur at most four times per user per day. The Real-time guide recommends at most one active poll per ten minutes per account; [rate limiting](https://docs.snaptrade.com/docs/ratelimiting) defaults to 250 requests per minute globally per client. Validate commercial compatibility with approximately five daily proactive investigations, hourly user schedules, and chat. Keep those accepted product frequencies; delayed evidence cannot satisfy a current-exposure claim to avoid a provider limit.
- **Proactive use:** the [compliance policy](https://snaptrade.com/compliance-policy) requires pull-based portfolio analysis. Obtain vendor confirmation for account-specific proactive insights and user-created scheduled analysis; read-only permissions alone do not settle this use.
- **Retention and market data:** the [developer terms](https://snaptrade.com/developer-terms-of-use) restrict storing or redistributing Market Data and limit its use to the licensed end user. Confirm permitted evidence retention, model processing, chat and report output, and any shared market-data reuse before mapping durable records. Preserve the required explainability and retained-result contract through permitted data or explicit vendor terms.

### 4.2 Zerion freshness, licensing, and optional DeBank use

- **Freshness evidence:** Zerion's introduction describes rapid updates, but a strict maximum age or force-refresh guarantee is not established for the selected endpoints. The [positions response](https://developers.zerion.io/api-reference/wallets/get-wallet-fungible-positions) exposes `updated_at` and `updated_at_block`; validate whether these mean an account refresh, a position change, or another event before treating them as source as-of evidence. [Transaction webhooks](https://developers.zerion.io/webhooks) do not by themselves establish current holdings, prices, or collateral.
- **Permitted retention:** the [API license](https://zerion.io/api-license-agreement) restricts archiving Zerion Data. Confirm permitted short reuse, result evidence, chat and report retention, and model processing under the chosen agreement. Do not assume that provider availability grants archival rights.
- **Optional complement:** DeBank's [user API](https://docs.cloud.debank.com/en/readme/api-pro-reference/user) describes bulk protocol data as usually near real time but permits update delays up to 12 hours. If a demonstrated EVM gap warrants adoption, validate the exact endpoint, source time, licensing, and deduplication; bulk availability alone cannot prove current exposure.

## 5. Acceptance evidence and open choices

- **Provider eligibility:** validate each target's supported regions and account scopes, read-only setup, reconnect behavior, and material exclusions through vendor confirmation and representative integration evidence.
- **Current claims:** establish that selected reads can provide suitable account-state and price evidence for each offered current claim, including delayed-source and unknown-freshness cases.
- **Usage compatibility:** resolve polling, proactive-use, and licensing constraints without reducing accepted product behavior or silently substituting stale account state.
- **Integration:** choose SnapTrade Commercial or Personal OAuth, validate native egress-proxy authentication compatibility or backend signing requirements, and select the run-bound backend read authorization, exact APIs and SDKs, supported fields and mappings, freshness limits, permitted persistence and reuse, and Hyperliquid proxy configuration and shared exit-IP budget handling. The runtime and worker-hosting decisions remain unchanged.
