# Product and delivery TODOs

## 1. Apple messaging

### 1.1 Bird integration and proactive delivery scope

The [Apple messaging decision](ADRS/0021-apple-messages-with-bird.md) selects **Bird** as the primary MSP for our Apple Messages for Business account. Photon remains a backup integration plan. WhatsApp scheduling, proactive insights, and template messaging are deferred; its chat and one-off requested work remain in scope.

- [ ] Validate the Bird account/product, API and webhook integration, Apple business approval and Experience Review, and verified linking through the Apple opaque customer identity.
- [ ] Confirm permitted scheduled financial updates and proactive notification scope with Bird and Apple. Provider selection alone does not establish approval for the intended finance use cases.
- [ ] Validate current conversation eligibility, opt-outs and deletion events, and supported message status/idempotency behavior against the existing delivery policy.

### 1.2 Minimum required controls

**TBD:** the exact Apple-specific notification notice and preference controls. Meet applicable requirements with the minimum channel-specific behavior while preserving the simple **proactive insights** on/off setting where permitted.

- [ ] Identify and document required Apple controls and acceptance evidence with Bird; confirm how permissions apply to the product's default-enabled setting.

The [task stories](user-stories/tasks.md) own user control. This selection does not claim a deployed integration or approved notification permission.

## 2. Human support

### 2.1 Availability and staffing

The accepted [human-support story](user-stories/assistant.md#27-us-chat-07--reach-human-support-during-support-hours) requires access to a real person during published support hours. The [ownership decision](ADRS/0022-human-support-conversation-ownership.md) selects Bird Conversations for Apple-channel staff replies and backend-enforced ownership.

- [ ] Assign the support team and publish working days, hours, and timezone.
- [ ] Define response expectations and out-of-hours handling.

### 2.2 Staff integration and handoff

- [ ] Map Bird assignment and ownership events into backend enforcement: pause automated delivery during human ownership and resume only on explicit staff handback. A new message or repeated webhook must not silently restart the assistant.
- [ ] Validate handoff while an AI reply or background result is becoming ready. Requested analyses and schedules continue and save results; automated reports wait, and proactive investigations do not start while delivery is unavailable.
- [ ] Define staff access to authorized originating-channel context, retained support records, and pending-result handling on handback without conflicting replies.
- [ ] Validate WhatsApp staff tooling and transport integration for its existing human-support experience; selecting Bird for Apple does not settle WhatsApp integration.

The [runtime design](design/runtime.md) owns the common handoff behavior. These tasks do not add handoff-specific cancellation or execution restart.

## 3. Financial provider integration

### 3.1 Connection and credential contract

The [provider decision](ADRS/0018-managed-financial-data-providers.md) selects SnapTrade for Binance, Coinbase, IBKR, moomoo, and Robinhood; Zerion for supported EVM and Solana wallets; and direct Hyperliquid reads through Webshare at low priority. **Connection and credential details remain provider-dependent.** The [credential decision](ADRS/0002-backend-owned-financial-credentials.md) owns credential persistence and the runtime access boundary, and the [onboarding design](design/onboarding.md#45-provider-credentials-and-persistence) applies it to account connection.

- [ ] Validate each selected provider's supported connection method, required approval, account coverage, and read-only scopes or permissions. Keep Binance API-key setup distinct from OAuth.
- [ ] Choose SnapTrade Commercial or Personal OAuth from the required user and connection lifecycle. Commercial requires backend application signing; Personal OAuth can provide a standalone read token for compatible egress-proxy injection but requires the Personal lifecycle. Authentication convenience alone does not select OAuth; validate any Personal API key's actual read-only authority.
- [ ] Define the exact retained credentials, token types, and provider connection identifiers, including whether access tokens or refresh tokens exist. Treat OAuth authorization codes as temporary inputs exchanged under the provider's contract.
- [ ] Define provider-dependent expiry, supported renewal, rotation, revocation, and user-required reconnect behavior.

### 3.2 Credential persistence and brokering

**Accepted:** application-wide keys use GCP Secret Manager, and per-user provider credentials are encrypted in PostgreSQL using GCP KMS. **Credential brokering** keeps raw provider secrets outside sandbox environments, files, and prompts through native egress-proxy injection outside the VM or a user-bound backend read bridge. The [credential decision](ADRS/0002-backend-owned-financial-credentials.md) owns persistence and brokering; the [capability decision](ADRS/0006-composable-agent-capabilities.md) owns **programmatic tool calling** through broad SDK/API access and scripts.

- [ ] Define exact credential schemas, IAM, key granularity, rotation, and encryption integration, including direct versus envelope encryption, within the accepted backend ownership, authenticated account binding, and read-only permission boundaries. Use the selected providers' SDKs and documented contracts; no custom cryptographic primitive is selected.
- [ ] Define service permissions for trusted API and background-worker provider integration. Both may resolve and decrypt credentials after account/connection authorization for the selected external secret/proxy layer or backend read bridge. Preserve GCP Secret Manager and KMS-encrypted PostgreSQL as the durable credential owners; use native facilities before adding a custom service.
- [ ] Map each provider to native egress-proxy injection for compatible authentication or a user-bound backend read bridge for application signing or proxy-incompatible authentication. Validate the exact E2B/Mastra integration, SDK support, beta status, authentication formats, and provider limits; keep raw provider secrets outside the VM. OAuth client secrets and refresh handling remain backend-owned.
- [ ] Select narrow run-bound authorization for programmatic reads, including any opaque placeholder or bridge authorization. The trusted backend must bind the user, destination, read scope, and object authority without arbitrary signing or unrestricted forwarding. Distinguish the backend read interface from model-facing tool calls.
- [ ] Configure default-deny E2B networking with backend-controlled required-provider egress and intended trace exclusions. Preserve authorized current-user financial-data access under the accepted exposure trade-off; generated code must not receive raw provider secrets, application-wide keys, or other users' private data or credentials.

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

- [ ] Pin and validate integration packages and versions, then define trace payloads, configuration, sampling, access, and retention before enabling export. Exclude credentials from intended trace payloads and apply the selected handling policy for private financial data.

## 5. Phone authentication

### 5.1 Privy and Twilio Verify integration

The [account identity decision](ADRS/0014-stable-account-and-independent-channel-links.md) selects Privy with Twilio Verify, a stable internal UUID mapped through unique `privy_user_id`, native access-JWT verification, and idempotent account creation on the first authenticated request. Phone login requires no embedded wallet, and usable accounts do not wait for a webhook.

- [ ] Configure dedicated project Privy and Twilio resources and validate production plan, contract, and country eligibility; BYO Twilio availability does not establish the existing contract or universal SMS coverage.
- [ ] Select the native SDK version and trusted verified-phone retrieval through a user-profile API or verified identity token. Never take verified phone status from request-body fields.
- [ ] Define account records and exercise native token checks for the expected app, issuer, signature, and expiry, plus concurrent first-request creation resolving to one UUID.
- [ ] Validate the working reference against official provider contracts and MyStacks account/channel boundaries; browser connection mocks and timers do not establish production behavior.

Phone changes and recovery remain low priority; account deletion remains deferred. The [onboarding design](design/onboarding.md) owns independent financial and channel verification.

## 6. PostgreSQL hosting

### 6.1 Dedicated Tiger Cloud service

The [storage decision](ADRS/0013-shared-postgresql-storage.md) selects a dedicated TimescaleDB-enabled Tiger Cloud service. Application and Mastra tables remain ordinary PostgreSQL tables; when deferred portfolio-history infrastructure is built, its history tables start as hypertables before their first write.

- [ ] When database setup is resumed, validate and provision the [selected staging service](design/scaffolding.md), including actual price/availability, GCP-to-Tiger connectivity, backup/recovery, and permissions. Service creation and its URL are deferred for the current scaffold; production capacity remains a separate decision.
- [ ] Define ordinary application and Mastra schemas and migration ownership. Keep portfolio-history collection and reconstruction deferred; any future populated-table conversion must account for migration, locking, and constraint requirements.

## 7. Sandbox and credential-broker data handling

### 7.1 E2B and external secret/proxy terms and retention

The [sandbox decision](ADRS/0003-sandboxed-code-execution.md) gives generated code authorized current-user financial data under the accepted exposure trade-off. Raw provider secrets remain outside the VM, while the selected external secret/proxy layer may process credentials. E2B publishes microVM isolation, encryption, and SOC 2 Type II control claims and offers its report and data-processing agreement on request. Those public claims do not establish zero operator access or workload-specific retention and use rights. [E2B security](https://e2b.dev/security)

- [ ] Review the applicable customer agreement and DPA for sandbox financial records and credentials processed by the selected external secret/proxy layer, including permitted use, model-training or other reuse restrictions, operator access, subprocessors, and processing region. Clarify whether the public Terms' broad Submissions license applies to sandbox workloads; its model/website wording does not establish that scope. The website Privacy Policy is not a complete sandbox data-processing contract. [Terms](https://e2b.dev/terms), [Privacy Policy](https://e2b.dev/privacy)
- [ ] Establish retention and deletion for sandbox state, logs, snapshots, and backups, plus secret/proxy storage and logs. Killing a sandbox ends its live state but does not establish removal of every retained copy or revocation of external authorization; pausing preserves state. [Sandbox persistence](https://docs.e2b.dev/sandbox/persistence)
- [ ] Review the available SOC 2 report, access-control evidence, and subprocessor list before admitting customer financial data or credentials to the selected external processing layer. Any change to the confirmed access model requires a separate design decision; this validation does not select an Enterprise plan, BYOC deployment, or replacement provider.

## 8. Retained analysis data and object storage

### 8.1 Private GCS files and PostgreSQL records

The [analysis storage decision](ADRS/0023-analysis-data-retention-and-object-storage.md) retains useful inputs, reusable calculations, and results for follow-ups. Private GCS stores retained datasets and workspace files; PostgreSQL stores ordinary records, small results, metadata, and references. Automatic pruning is deferred.

- [ ] Configure the dedicated private bucket and backend access, preserving account/channel/run authorization without exposing broad storage credentials to generated code.
- [x] Define retained-file metadata and references for ownership, data type, saved/retrieval/source times, provider/connection, size, and explicitly unknown source freshness.
- [x] Implement native GCS/E2B transfers, required-output persistence before cleanup, and authorized restoration with pinned packages and local failure tests. Live transfer acceptance remains in section 9.
- [ ] Confirm provider-specific retention rights and operating controls for saved financial inputs. Saved data does not replace fresh evidence for current claims.

Future pruning rules can use this metadata when measured growth or an explicit data-policy requirement justifies them; no automatic age-based cleanup is selected now. Conversation/profile retention and account deletion retain their separate decisions.

## 9. Scaffold live acceptance

### 9.1 Deferred inputs and evidence

The implementer owns these checks when the deferred inputs become available. The [delivery specification](design/scaffolding.md) owns their scope; the [staging runbook](operations/staging.md) owns commands and recovery.

- [ ] Supply the dedicated database URL through a local secret file or Secret Manager, initialize application and native Mastra storage, and verify cross-cloud connectivity without exposing credentials.
- [ ] Supply the E2B key securely and verify real queued calculation, private GCS persistence, authorized retrieval/restoration, and sandbox cleanup with the complete integration code.
- [ ] Verify full foreground/background and redeployment behavior on identified commit/digest/API/worker revisions, including retained state and the attempt ceiling.
- [ ] Record model comparison, measured resource/usage costs, and the author's personal expected/observed acceptance before readiness.

Bootstrap deployment health is available evidence only for its exercised scope. Keep missing live proof visible and the runtime/cloud PRs draft until required acceptance or an explicitly accepted exception.
