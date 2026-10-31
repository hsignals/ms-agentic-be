# Backend-owned financial credentials

## 1. Status and scope

**Status: ACCEPTED security, credential-storage, and financial access boundaries.** MyStacks retains durable connected-account secrets in trusted backend storage. Programmatic provider reads use credential brokering through an egress proxy where native provider authentication fits, or a user-bound backend read bridge where signing or other authentication requires it. Raw provider credentials stay outside the E2B execution environment; trusted backend code controls user, account, object, and read authority.

This boundary applies to the [shared custom runtime](0001-custom-runtime-and-orchestration.md), including conversations, scheduled work, proactive investigations, and sandboxed analysis. Financial access remains read-only and outputs remain informational under the [Phase 1 requirements](../requirements.md). The [provider decision](0018-managed-financial-data-providers.md) selects SnapTrade for the target exchange and brokerage connections, Zerion for EVM and Solana wallets, and direct Hyperliquid reads at low priority.

## 2. Decision

### 2.1 Account authority and trusted code

The backend must establish user identity from **authenticated server context**, never from a model-asserted `userId`. For each protected action, it must authorize access to the requested account or object using the current user binding and permissions.

MyStacks must populate the identity, resource, and thread bindings in Mastra `RequestContext` from trusted server code. User-supplied JSON and model arguments must not set or override those bindings. A context or tool schema validates input shape; it does not grant account access. Mastra's [request-context documentation](https://mastra.ai/docs/server/request-context) describes server-bound resource and thread keys.

Trusted financial access code authorizes connections, supplies selected evidence, and selects the credential, destination, and permitted read operations for programmatic access. It configures credential brokering or performs provider requests through the backend bridge. Backend tools and programmatic reads must preserve the architecture's shared financial evidence contract. A tool may call an internal backend function or an HTTP API; transport does not change the authorization requirement.

Financial permission checks must execute in the protected tool handler or owning financial API. Agent hooks may apply additional policy, but must not be the only authorization gate because other callers can reach the same protected operation.

The API and background worker processes are part of the trusted backend. Each may resolve and decrypt per-user provider credentials through shared financial access code **after trusted authorization of the user, connection, and account**. Trusted backend code may hold the application secrets required for its operations, including an E2B SDK management key; model-directed code must not receive that application authority.

### 2.2 Credential brokering and sandbox exposure

**Credential brokering** applies credentials to admitted outgoing requests outside sandbox code; Vercel documents this pattern as [credentials brokering](https://vercel.com/docs/sandbox/concepts/firewall#credentials-brokering). An **egress proxy** is the external intermediary that handles those outbound requests and injects provider authentication before forwarding them. [E2B Secrets](https://docs.e2b.dev/secrets) uses an egress proxy to inject stored values into matching HTTPS request headers outside the sandbox. Modal documents the analogous pattern as [**sandbox secret injection**](https://modal.com/docs/guide/sandbox-secret-injection).

Use proxy injection when the provider's native authentication fits that mechanism. Use a **user-bound backend read bridge**, a trusted API that authorizes and performs provider reads for the current user, when application signing or other proxy-incompatible authentication is required. Both paths must bind access to the authenticated user and run, authorize the requested account and object, and admit only permitted read operations and destinations. Hiding a credential does not establish those permissions. A URL or HTTP method alone does not establish that a request is an authorized read. Requests and redirects must remain within admitted operations and destinations. Broad provider SDKs or read interfaces must remain usable for loops, pagination, concurrency, and analysis without a separate custom tool for every question.

Trusted backend code must not place raw provider credentials, including per-user access tokens, in sandbox environments or files, generated code, prompts, skills, model-visible tool arguments or results, job payloads, durable model context, or traces. Application-wide provider keys, OAuth client secrets and refresh tokens, transport-proxy authentication, model API keys, database credentials, and E2B management keys also remain outside model-directed execution. Token refresh is a backend operation. Queued work carries trusted identity and connection references; authorized backend code resolves credentials when the run needs them. A connection UI may receive a temporary client-link token when the selected provider SDK requires it for that connection operation.

Sandbox code may receive **narrow run-bound bridge authentication or an opaque placeholder** needed by a supported SDK; neither may grant reusable provider or application-wide authority. The exact mechanism remains open. Credential brokering can require E2B or another operator to process secrets in its external secret/proxy layer: [E2B's implementation](https://e2b.dev/resources/introducing-e2b-secrets) stores secrets and inserts them into headers outside the sandbox. This selects an execution boundary, not a guarantee that secrets remain visible only to MyStacks' backend.

**Sandbox code receiving the current user's authorized financial data is accepted and necessary for analysis.** Code, models, and their providers may process supplied balances, history, memory, and reports. Credential brokering does not guarantee that financial data cannot be disclosed. E2B warns that a destination receiving an injected credential can return it to the sandbox; only trusted destinations may receive credentials. Neither proxy isolation nor a domain allowlist establishes account authorization or prevents every disclosure.

### 2.3 Provider-dependent credentials and persistence

**TBD per selected provider:** backend storage does not prescribe a universal access-token and refresh-token schema. The provider integration must settle:

- **Connection contract:** direct-exchange OAuth, an aggregator connection, or an API-key flow, including required provider approval, supported account coverage, and read-only scopes or permissions.
- **Retained values:** the exact credential or token types and connection identifiers MyStacks saves, including whether access tokens or refresh tokens exist. OAuth authorization codes are temporary inputs exchanged as the provider requires.
- **Credential lifecycle:** expiry, supported renewal, rotation, revocation, and when the user must reconnect.

Provider approval, a successful connection, or a successful balance read does not establish read-only authority or complete account coverage. Trusted integration code must validate the selected provider's contract and enforce the account binding and permission boundary above. Prompts and skills cannot establish those permissions.

The choice between SnapTrade Commercial and Personal OAuth remains **open**:

- **Commercial:** [documented authentication](https://docs.snaptrade.com/docs/authentication-methods) combines application `clientId` and `consumerKey` credentials with per-user `userId` and `userSecret` values. Its [request signatures](https://docs.snaptrade.com/docs/request-signatures) use request-dependent HMAC-SHA256 signing. Keep the official signing SDK and credentials in trusted backend code and expose the user-bound read bridge for generated code. Static header injection does not supply this request-signing flow.
- **Personal OAuth:** [SnapTrade OAuth](https://docs.snaptrade.com/docs/oauth-apps) can provide a user-scoped `read` access token without application request signing, but requires users to manage their accounts and connections through SnapTrade Personal. The product must choose between that lifecycle and Commercial ownership. Where supported, the egress proxy injects the access token outside the sandbox. OAuth client secrets and token refresh remain backend responsibilities; raw Personal API keys also remain outside sandbox code.

The Commercial bridge must bind the authenticated run to the current user, enforce ownership of requested accounts and objects, and admit only read operations. It must not expose application-wide user listing, arbitrary signing, or an unrestricted forwarding proxy. Model-facing tool calls and programmatic sandbox-to-bridge calls are distinct interfaces; the latter needs trusted run-bound authentication under the boundary above.

This customer integration choice is separate from each institution's connection method: SnapTrade's [Binance flow](https://support.snaptrade.com/Binance-de2feaa69a1c8362af15015d31eefd1f?pvs=21) requires the end user's API key and secret. The exact provider fields and persistence schema remain open within the storage decision below.

Direct Hyperliquid reads use its documented [public Info endpoints](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint) with the actual user account address and require no user private key, OAuth credential, or trading key. The backend must still authorize the verified, active connection before reading for the user's portfolio. Webshare supplies backend outbound transport for these reads; its proxy authentication remains inside this same credential boundary.

### 2.4 Credential storage and key management

Store **application-wide credentials in GCP Secret Manager**, including SnapTrade application credentials, Zerion API keys, and Webshare proxy authentication. Store **per-user provider credentials encrypted in PostgreSQL using GCP KMS**. Authorized trusted backend code resolves plaintext for backend provider requests or external credential brokering after authorizing the user, connection, and account. A managed proxy's secret facility does not replace this durable storage split.

Use maintained SDKs and supported encryption libraries rather than custom cryptographic primitives. Google's [Secret Manager guidance](https://docs.cloud.google.com/secret-manager/docs/best-practices) covers managed secret access, and its [Cloud KMS guidance](https://docs.cloud.google.com/kms/docs/envelope-encryption) describes direct and envelope encryption. Exact provider fields, schema, IAM permissions, key granularity, rotation, and encryption mechanism, including direct versus envelope encryption, remain open.

## 3. Rationale and alternatives

Credential brokering lets generated code use broad SDKs and APIs for authorized reads, loops, pagination, and analysis while keeping raw provider credentials outside the execution environment. A backend read bridge covers authentication that a proxy cannot supply. This preserves flexible programmatic access without exposing reusable provider secrets in sandbox files or environment variables. The trade-off is proxy configuration, provider compatibility, authorization work, and trust in any operator that handles secrets outside the sandbox.

Trusted credential selection and user/account/object checks prevent one run from borrowing another user's financial authority. The bridge adds provider integration, authorization, and evidence-validation work, but does not require a separate high-level tool for every analysis. Address-based public APIs remove the need for user API credentials without removing MyStacks' connection authorization.

The storage split keeps application-wide secrets in managed secret storage and per-user credential updates with account records, avoiding a separate Secret Manager secret for each user's provider credentials. The trade-off is that MyStacks owns the database encryption integration and KMS access needed to use those credentials. Storing per-user credentials in Secret Manager would move more of that storage lifecycle to the managed service while adding a separate secret inventory alongside connection records.

Requiring a model step for every provider read adds latency and context, while bespoke tools for every endpoint add interfaces to maintain. Supplying raw credentials to sandboxes would simplify some SDK setup but expose reusable secrets to generated code. Credential brokering and a broad read bridge preserve programmable access within the selected authority boundary.

Running shared financial adapters in trusted API and background worker processes avoids an additional financial service deployment and interface. The trade-off is that a compromised backend process may expose credentials within that service's permission scope. A separate financial access service is deferred until a concrete need for a stronger process boundary justifies its added deployment and integration work.

**Sandbox isolation and account authorization protect different boundaries.** A sandbox contains untrusted execution; it cannot repair an API that authorizes the wrong account or hide supplied data from code allowed to read it. The two boundaries are not interchangeable security mechanisms.

## 4. Consequences and open decisions

- **Backend responsibility:** MyStacks must implement authenticated user binding, account/object authorization, trusted credential and destination selection, read admission, and provider authentication, including signing where required.
- **Shared-process trust:** trusted API and background worker adapters may resolve and decrypt credentials after user, connection, and account authorization. Model-generated code, model-directed shell commands or `eval`, and untrusted plugins must not execute there.
- **Sensitive data and credentials:** models, sandbox code, and hosting providers can process supplied financial data. External brokering operators may process provider secrets, and a permitted destination can disclose a credential or supplied data; no absolute privacy or automatic redaction guarantee is selected.
- **Open details:** SnapTrade Commercial versus Personal OAuth, exact provider fields and schema, IAM permissions, key granularity, rotation, encryption mechanism, brokering implementation, financial interfaces, narrow run-bound bridge authentication, authorization-context propagation for queued work, and applicable data-processing terms remain undecided.
- **Product authority:** this boundary does not approve financial execution or specific investment recommendations.
