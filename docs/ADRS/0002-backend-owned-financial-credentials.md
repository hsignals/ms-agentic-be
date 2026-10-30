# Backend-owned financial credentials

## 1. Status and scope

**Status: ACCEPTED security, credential-storage, and trusted backend access boundaries.** MyStacks retains connected-account secrets in trusted backend code. Models and generated-code sandboxes receive authorized data and capabilities, without receiving the original secrets.

This boundary applies to the [shared custom runtime](0001-custom-runtime-and-orchestration.md), including conversations, scheduled work, proactive investigations, and sandboxed analysis. Financial access remains read-only and outputs remain informational under the [Phase 1 requirements](../requirements.md). The [provider decision](0018-managed-financial-data-providers.md) selects SnapTrade for the target exchange and brokerage connections, Zerion for EVM and Solana wallets, and direct Hyperliquid reads at low priority.

## 2. Decision

### 2.1 Account authority and trusted code

The backend must establish user identity from **authenticated server context**, never from a model-asserted `userId`. For each protected action, it must authorize access to the requested account or object using the current user binding and permissions.

MyStacks must populate the identity, resource, and thread bindings in Mastra `RequestContext` from trusted server code. User-supplied JSON and model arguments must not set or override those bindings. A context or tool schema validates input shape; it does not grant account access. Mastra's [request-context documentation](https://mastra.ai/docs/server/request-context) describes server-bound resource and thread keys.

Trusted financial adapters retrieve required provider credentials, perform provider requests, and return authorized results through the architecture's shared financial evidence contract. A tool may call an internal backend function or an HTTP API; transport does not change the authorization requirement. For example, `check_binance_balance` calling `GET /agentic/binance/balance` is illustrative, not a fixed or implemented API contract.

Financial permission checks must execute in the protected tool handler or owning financial API. Agent hooks may apply additional policy, but must not be the only authorization gate because other callers can reach the same protected operation.

The API and background worker processes are part of the trusted backend. Each may resolve and decrypt per-user provider credentials through shared financial adapter code **after trusted authorization of the user, connection, and account**. Trusted backend code may hold the secrets required for its operations, including an E2B SDK management key. This permission belongs to backend application code, not to the model or code it generates.

### 2.2 Model and sandbox exposure

Financial-provider credentials, including retained OAuth tokens where applicable, proxy authentication, model API keys, database credentials, and sandbox-management keys must not enter model prompts, model-visible tool arguments or results, job payloads, sandbox environments or files, generated code, durable context, or traces. Backend adapters resolve secrets when needed, while financial tools supply only the data required for the authorized analysis. A connection UI may receive a temporary client-link token when the selected provider SDK requires it for that connection operation.

### 2.3 Provider-dependent credentials and persistence

**TBD per selected provider:** backend ownership does not prescribe a universal access-token and refresh-token schema. The provider integration must settle:

- **Connection contract:** direct-exchange OAuth, an aggregator connection, or an API-key flow, including required provider approval, supported account coverage, and read-only scopes or permissions.
- **Retained values:** the exact credential or token types and connection identifiers MyStacks saves, including whether access tokens or refresh tokens exist. OAuth authorization codes are temporary inputs exchanged as the provider requires.
- **Credential lifecycle:** expiry, supported renewal, rotation, revocation, and when the user must reconnect.

Provider approval, a successful connection, or a successful balance read does not establish read-only authority or complete account coverage. Trusted adapters must validate the selected provider's contract and enforce the account binding and permission boundary above.

The choice between SnapTrade Commercial and Personal OAuth remains **open**. If Commercial is selected, its [documented authentication](https://docs.snaptrade.com/docs/authentication-methods) uses application `clientId` and `consumerKey` credentials and per-user `userId` and `userSecret` values. The [Personal OAuth model](https://docs.snaptrade.com/docs/personal-vs-commercial) instead lets users authorize access to their own SnapTrade-connected accounts. This customer integration choice is separate from each institution's connection method: SnapTrade's [Binance flow](https://support.snaptrade.com/Binance-de2feaa69a1c8362af15015d31eefd1f?pvs=21) requires the end user's API key and secret. The exact provider fields and persistence schema remain open within the storage decision below.

Direct Hyperliquid reads use its documented [public Info endpoints](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint) with the actual user account address and require no user private key, OAuth credential, or trading key. The backend must still authorize the verified, active connection before reading for the user's portfolio. Webshare supplies backend outbound transport for these reads; its proxy authentication remains inside this same credential boundary.

### 2.4 Credential storage and key management

Store **application-wide credentials in GCP Secret Manager**, including SnapTrade application credentials, Zerion API keys, and Webshare proxy authentication. Store **per-user provider credentials encrypted in PostgreSQL using GCP KMS**. Only authorized trusted backend code may obtain plaintext, subject to the account-authority and exposure boundaries above.

Use maintained SDKs and supported encryption libraries rather than custom cryptographic primitives. Google's [Secret Manager guidance](https://docs.cloud.google.com/secret-manager/docs/best-practices) covers managed secret access, and its [Cloud KMS guidance](https://docs.cloud.google.com/kms/docs/envelope-encryption) describes direct and envelope encryption. Exact provider fields, schema, IAM permissions, key granularity, rotation, and encryption mechanism, including direct versus envelope encryption, remain open.

## 3. Rationale and alternatives

Keeping provider authority in backend adapters gives MyStacks a place to enforce account permissions and prevents model-directed work from obtaining reusable provider secrets. It also allows the same protected financial operations to serve chat, scheduled work, proactive investigations, and analysis. Address-based public APIs remove the need for user API credentials without removing MyStacks' connection authorization.

The storage split keeps application-wide secrets in managed secret storage and per-user credential updates with account records, avoiding a separate Secret Manager secret for each user's provider credentials. The trade-off is that MyStacks owns the database encryption integration and KMS access needed to use those credentials. Storing per-user credentials in Secret Manager would move more of that storage lifecycle to the managed service while adding a separate secret inventory alongside connection records.

The alternative is to give account secrets to each user's execution environment and let model-directed code contact providers directly. A compromise of that environment would then expose the original credentials, while distributing financial authorization across runtime tooling. The accepted boundary keeps that authority with trusted backend code.

Running shared financial adapters in trusted API and background worker processes avoids an additional financial service deployment and interface. The trade-off is that a compromised backend process may expose credentials within that service's permission scope. A separate financial access service is deferred until a concrete need for a stronger process boundary justifies its added deployment and integration work.

**Sandbox isolation and account authorization protect different boundaries.** A sandbox contains untrusted execution; it cannot repair an API that authorizes the wrong account or hide supplied data from code allowed to read it. The two boundaries are not interchangeable security mechanisms.

## 4. Consequences and open decisions

- **Backend responsibility:** MyStacks must implement authenticated user binding, account/object authorization, and provider authentication, including signing where required.
- **Shared-process trust:** trusted API and background worker adapters may resolve and decrypt credentials after user, connection, and account authorization. Model-generated code, model-directed shell commands or `eval`, and untrusted plugins must not execute there.
- **Sensitive data:** balances, history, memory, and reports remain sensitive after secrets are removed. Models, sandbox code, and hosting providers can still process data MyStacks supplies to them.
- **Open details:** SnapTrade Commercial versus Personal OAuth, exact provider fields and schema, IAM permissions, key granularity, rotation, encryption mechanism, financial interfaces, authorization-context propagation for queued work, and applicable data-processing terms remain undecided.
- **Product authority:** this boundary does not approve financial execution or specific investment recommendations.
