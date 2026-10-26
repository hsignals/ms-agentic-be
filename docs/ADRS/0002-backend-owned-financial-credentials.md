# Backend-owned financial credentials

## 1. Status and scope

**Status: ACCEPTED security boundary.** MyStacks retains connected-account secrets in trusted backend code. Models and generated-code sandboxes receive authorized data and capabilities, without receiving the original secrets.

This boundary applies to the [shared custom runtime](0001-custom-runtime-and-orchestration.md), including conversations, scheduled work, and sandboxed analysis. Financial access remains read-only and outputs remain informational under the [Phase 1 requirements](../requirements.md).

## 2. Decision

### 2.1 Account authority and trusted code

The backend must establish user identity from **authenticated server context**, never from a model-asserted `userId`. For each protected action, it must authorize access to the requested account or object using the current user binding and permissions.

MyStacks must populate the identity, resource, and thread bindings in Mastra `RequestContext` from trusted server code. User-supplied JSON and model arguments must not set or override those bindings. A context or tool schema validates input shape; it does not grant account access. Mastra's [request-context documentation](https://mastra.ai/docs/server/request-context) describes server-bound resource and thread keys.

Trusted financial adapters retrieve provider credentials, perform authenticated provider requests, and return authorized results through the architecture's shared financial evidence contract. A tool may call an internal backend function or an HTTP API; transport does not change the authorization requirement. For example, `check_binance_balance` calling `GET /agentic/binance/balance` is illustrative, not a fixed or implemented API contract.

Financial permission checks must execute in the protected tool handler or owning financial API. Agent hooks may apply additional policy, but must not be the only authorization gate because other callers can reach the same protected operation.

The shared runtime process is part of the trusted backend. A trusted adapter may therefore hold the secret required for its operation, including an E2B SDK management key. This permission belongs to backend application code, not to the model or code it generates.

### 2.2 Model and sandbox exposure

Financial-provider and model API keys, OAuth refresh tokens, database credentials, and sandbox-management keys must not enter model prompts, model-visible tool arguments or results, sandbox environments or files, generated code, durable context, or traces. Backend adapters resolve secrets when needed, while financial tools supply only the data required for the authorized analysis.

If a service boundary requires a runtime access credential, it must grant only the intended user-scoped operations. That credential is itself sensitive and must not be exposed to generated code. Its protocol, lifetime, and revocation behavior remain open.

## 3. Rationale and alternatives

Keeping provider authority in backend adapters gives MyStacks a place to enforce account permissions and prevents model-directed work from obtaining reusable provider secrets. It also allows the same protected financial operations to serve chat, queued work, and analysis.

The alternative is to give account secrets to each user's execution environment and let model-directed code contact providers directly. A compromise of that environment would then expose the original credentials, while distributing financial authorization across runtime tooling. The accepted boundary keeps that authority with trusted backend code.

A deployment may place financial access behind a separate service identity and deny shared workers direct credential-store access. This provides a stronger process and credential boundary, with additional deployment, permissions, and service-authentication work. The service topology remains open.

**Sandbox isolation and account authorization protect different boundaries.** A sandbox contains untrusted execution; it cannot repair an API that authorizes the wrong account or hide supplied data from code allowed to read it. The two boundaries are not interchangeable security mechanisms.

## 4. Consequences and open decisions

- **Backend responsibility:** MyStacks must implement authenticated user binding, account/object authorization, and provider authentication, including signing where required.
- **Shared-process trust:** trusted adapters may need secrets in the backend process. Model-generated code, model-directed shell commands or `eval`, and untrusted plugins must not execute there.
- **Sensitive data:** balances, history, memory, and reports remain sensitive after secrets are removed. Models, sandbox code, and hosting providers can still process data MyStacks supplies to them.
- **Open details:** financial interfaces, authorization-context propagation for queued work, runtime access credentials where needed, and applicable data-processing terms remain undecided.
- **Product authority:** this boundary does not approve financial execution or specific investment recommendations.
