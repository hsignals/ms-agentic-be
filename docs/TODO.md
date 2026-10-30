# Product and delivery TODOs

## 1. Apple messaging

### 1.1 Service and proactive delivery scope

- [ ] Confirm the Apple service/provider and permitted notification scope before committing to Apple proactive delivery.
- [ ] Confirm how the selected provider's delivery eligibility and permissions apply to the product's default channel selection.

### 1.2 Minimum required controls

**TBD:** Apple-specific notification and preference controls. Meet the applicable requirements with the minimum necessary channel-specific behavior; Apple's policies must not guide the general product UX. Select the exact controls after confirming the service and provider.

- [ ] Identify and document the minimum required Apple controls and their acceptance evidence.

The [task stories](user-stories/tasks.md) own proactive channel selection and user control. This TODO does not establish an Apple integration or notification permission.

## 2. Human support

### 2.1 Availability and staffing

The accepted [human-support story](user-stories/assistant.md#27-us-chat-07--reach-human-support-during-support-hours) requires access to a real person during published support hours.

- [ ] Assign the support team and publish working days, hours, and timezone.
- [ ] Define response expectations and how requests received outside support hours are handled.

### 2.2 Staff tooling and handoff

- [ ] Choose the staff-side support tool; Slack is a proposed option. Users must receive support in their originating messaging channel.
- [ ] Define how staff receive the request and necessary context, reply to the correct conversation, and return control to the assistant without conflicting replies.
- [ ] Define staff access and retained support records within the existing account and channel privacy boundaries.

The [runtime design](design/runtime.md) owns the handoff integration once these choices are settled.

## 3. Financial provider integration

### 3.1 Connection and credential contract

The [provider decision](ADRS/0018-managed-financial-data-providers.md) selects SnapTrade for Binance, Coinbase, IBKR, moomoo, and Robinhood; Zerion for supported EVM and Solana wallets; and direct Hyperliquid reads through Webshare at low priority. **Connection and credential details remain provider-dependent.** The [credential decision](ADRS/0002-backend-owned-financial-credentials.md) owns the backend security boundary, and the [onboarding design](design/onboarding.md#45-provider-credentials-and-persistence) applies it to account connection.

- [ ] Validate each selected provider's supported connection method, required approval, account coverage, and read-only scopes or permissions. Keep Binance API-key setup distinct from OAuth and validate the chosen SnapTrade customer integration before selecting retained fields.
- [ ] Define the exact retained credentials, token types, and provider connection identifiers, including whether access tokens or refresh tokens exist. Treat OAuth authorization codes as temporary inputs exchanged under the provider's contract.
- [ ] Define provider-dependent expiry, supported renewal, rotation, revocation, and user-required reconnect behavior.

### 3.2 Credential persistence

**Accepted:** application-wide keys use GCP Secret Manager, and per-user provider credentials are encrypted in PostgreSQL using GCP KMS. The [credential decision](ADRS/0002-backend-owned-financial-credentials.md) owns the storage split and its trade-off.

- [ ] Define exact credential schemas, IAM, key granularity, rotation, and encryption integration, including direct versus envelope encryption, within the accepted backend ownership, authenticated account binding, and read-only permission boundaries. Use the selected providers' SDKs and documented contracts; no custom cryptographic primitive is selected.
- [ ] Define service permissions for the accepted shared financial adapters in trusted API and background-worker processes. Both may resolve and decrypt credentials after account/connection authorization; a separate financial access service is deferred until a concrete need.

### 3.3 Target coverage and current data

The [provider decision](ADRS/0018-managed-financial-data-providers.md) owns vendor evidence and coverage gaps. The [current-evidence decision](ADRS/0019-current-portfolio-evidence.md) requires fresh or near-fresh relevant account evidence for current portfolio analysis; a fresh price alone cannot satisfy that requirement.

- [ ] Validate the mixed, global target audience against each brokerage's actual regions and account capabilities, including Binance/Binance.US eligibility and the unresolved moomoo regional gap. Do not infer full account or product coverage from a connection.
- [ ] Resolve the IBKR Flex freshness gap while retaining IBKR as a target. Its delayed holdings can support bounded historical/reporting claims but cannot silently stand in for current exposure.
- [ ] Validate a SnapTrade plan and contract that can refresh supported holdings for analysis. Keep delayed transactions distinct; no commercial purchase is approved by the provider selection.
- [ ] Confirm Zerion's supported EVM and Solana coverage, source-time semantics, maximum data age, and any refresh controls. Treat transaction webhooks as signals, not refreshed portfolio evidence.
- [ ] Set claim-specific maximum ages and brief reuse windows separately for account state and market prices. Define truthful partial answers when a provider cannot supply timely evidence, without blocking unrelated supported answers.
- [ ] Reconcile SnapTrade's documented background polling guidance and active-user limits with approximately five daily proactive checks, hourly requested schedules, and chat. Preserve the agreed product frequencies unless a separate decision changes them; stale-data substitution is not a resolution.

### 3.4 Provider use and retained evidence

- [ ] Confirm that the selected SnapTrade arrangement permits standing user requests and default-on proactive analysis under its pull-based compliance policy; resolve the distinction from advertised alerts rather than assuming all proactive use is permitted or banned.
- [ ] Confirm how SnapTrade Market Data restrictions and Zerion license terms apply to persisted financial evidence, chat, reports, and licensed end-user use. Preserve result explainability within the permitted data policy; these restrictions do not establish a blanket ban on all user account data.

### 3.5 Hyperliquid and Webshare integration

- [ ] Validate eligible verified EVM-wallet reuse, new readable control challenges, and actual account-address binding for the documented public read endpoints. Keep product authorization even though provider reads are public.
- [ ] Define account-mode interpretation and shared-collateral treatment, including overlap with Zerion evidence, so totals do not double count value. Keep history provider-bounded.
- [ ] Select Webshare pool, proxy type, count, region, rotation, and request routing/limiting from observed requirements. Hyperliquid's limit applies per exit IP, including shared worker use; selecting Webshare does not establish extra capacity or freshness guarantees. Keep proxy authentication in the trusted backend.

DeBank remains an optional future complement for demonstrated EVM coverage gaps. No additional provider or replacement is selected by these validation tasks. Bybit, Upbit, and prediction-market connectors remain deferred.

## 4. Low-priority observability

### 4.1 Additive LangSmith tracing

The [framework decision](ADRS/0005-mastra-runtime-framework.md#23-low-priority-additive-tracing) records LangSmith tracing as low-priority diagnostics for the selected runtime. LangSmith Deployment is not selected; execution, scheduling, authentication, and authorization retain their existing owners.

- [ ] Pin and validate integration packages and versions, then define trace payloads, configuration, sampling, access, and retention before enabling export. Keep credentials out of traces and apply the selected handling policy for private financial data.
