# Composable agent capabilities

## 1. Status and scope

**Status: ACCEPTED capability model.** MyStacks combines reusable backend tools, public web search and page reading, and an E2B workspace with real shell, files, Python, and JavaScript. Model reasoning, skills, context, and memory guide how the agent composes them. Programmatic tool calling provides broad financial SDK or API access through credential brokering or a user-bound backend read bridge. Raw provider credentials stay outside sandbox code; the shared Mastra backend retains the agent loop.

The [Phase 1 requirements](../requirements.md) limit financial access to reads and outputs to information and analysis, excluding financial execution and specific investment recommendations. Memory, informational task management, and message delivery retain their own authorized operations. This decision selects the capability boundaries; exact interfaces remain open.

## 2. Decision

### 2.1 Reusable tools provide authorized capabilities

Trusted backend tools provide reusable building blocks such as selected financial evidence, public web search, page reading, and artifact access. Their supported filters and outputs should allow composition across useful questions. Provider SDKs and a broad read operations interface can cover many reads without requiring a separate model-facing tool for every endpoint or analysis.

The agent sees tool descriptions, input schemas, and authorized results. Tools can materialize selected data as run files and return compact metadata and paths rather than sending every raw row to the model. The [financial credentials ADR](0002-backend-owned-financial-credentials.md) owns trusted user binding, credential brokering, and authorization on protected operations. A tool's availability or a hidden credential does not replace those checks.

The [Mastra framework ADR](0005-mastra-runtime-framework.md) owns tool registration and skill loading. Skills may provide provider API or SDK documentation and analysis guidance. Permissions must be enforced outside prompts and skills; loading guidance cannot grant authority or install trusted backend code.

### 2.2 Programmatic tool calling supplies flexible work

**Programmatic tool calling** means generated code calls tools or APIs and composes their results using ordinary control flow, avoiding a model sampling step between each call. [Anthropic's documentation](https://platform.claude.com/docs/en/agents-and-tools/tool-use/programmatic-tool-calling) describes loops, filtering, and aggregation and identifies this as a general pattern that can run on application-owned infrastructure. MyStacks selects this architecture pattern, not Anthropic's or OpenAI's model-native feature. Mastra integration and compatibility with the selected model remain implementation work.

The agent may inspect files, run shell commands, and combine authorized data with Python or JavaScript for calculations, comparisons, hypothetical scenarios, and reports. Prefer native Mastra E2B workspace tools and supported SDKs when they meet the required contract. The [code execution ADR](0003-sandboxed-code-execution.md) owns one lazily created sandbox per run, reuse within that run, data access, restricted egress, output persistence, and destruction. The shared Mastra API or worker retains the agent loop and checks results before presenting them; E2B runs code and commands rather than a complete agent or nested subagent loop.

For example, one script can paginate an authorized provider's read API, fetch independent reads concurrently, save observations to run files, and calculate a hypothetical portfolio result without intermediate model sampling. Alternatively, backend tools can supply selected holdings and price evidence. Both paths must preserve the shared financial evidence contract and its coverage and freshness limits. Personalization memory guides the answer but does not establish current balances or permissions.

### 2.3 Credential brokering and a backend read bridge provide access

**Credential brokering** keeps raw provider credentials outside generated code and applies them to admitted provider requests through an external **egress proxy**. Use it when native provider authentication fits proxy injection, preserving broad provider SDK or API access. The trusted backend chooses the correct user's credential and permitted destination, validates account and object ownership, and enforces read authority. A hidden application-wide key or a permitted domain alone does not authorize the sandbox's requested operation.

**User-bound backend read bridge:** providers that need request-dependent application signing or other proxy-incompatible authentication use a trusted API that authorizes and performs the read for the current user. For SnapTrade Commercial, the backend retains the official signing SDK and application and per-user credentials. The bridge binds the authenticated run to the user, checks account and object ownership, and admits supported read operations and destinations. It must not expose application-wide user listing, arbitrary signing, or an unrestricted forwarding proxy. A broad SDK or operations interface can serve programmatic reads without a tool for every endpoint or analysis.

SnapTrade Personal OAuth may supply a user-scoped read token for external injection, but users must manage the relevant SnapTrade Personal account and connection lifecycle. Commercial versus Personal OAuth remains an open product decision under the credential ADR. Provider scope and product lifecycle must meet MyStacks' requirements in either case; raw access tokens and Personal API keys do not enter sandbox code.

Model-facing tools and programmatic calls from E2B to the bridge are distinct interfaces. Sandbox code may receive narrow run-bound bridge authentication or an opaque SDK placeholder; the mechanism remains open. Provider integration, permission enforcement, and evidence validation remain MyStacks responsibilities for both access paths. Authorization must remain outside model judgment, consistent with [OWASP's guidance on excessive agency](https://genai.owasp.org/llmrisk/llm062025-excessive-agency/).

## 3. Rationale and alternatives

**Broad tools, SDK access, and generated analysis** let the agent fetch, inspect, and analyze data without a fixed catalog of workflows or bespoke tools for every read. Programmatic tool calling handles loops, pagination, concurrency, and filtering without repeated model sampling. Skills can explain existing provider capabilities instead of requiring application code for every analysis. This improves reach and reduces custom interface maintenance, while preserving provider integration and evidence validation as explicit application work.

**Only backend tools and predefined calculations** simplify supported methods, but restrict provider access and require more custom interfaces. E2B supports broader analysis; result quality still depends on evidence and the method.

**Credential brokering** preserves broad SDK access while keeping raw provider credentials outside the execution environment. The cost is an external proxy integration, supported authentication limits, and trust in any operator that processes secrets there. Sandbox code still receives the user's authorized financial data for analysis; credential isolation does not hide that data or prevent every disclosure.

**A user-bound backend read bridge** supplies authentication and authorization that native proxy injection cannot provide. It adds request admission, caller binding, provider authentication, and ownership checks. Reusing a broad read interface limits that work without pretending that a generic proxy removes integration responsibilities. An unrestricted proxy or raw application key in sandbox code would break the cross-user boundary.

## 4. Consequences and open decisions

- **Capability coverage:** tools and data must cover the requested work. Add or improve capabilities for demonstrated needs; tool count alone is not a measure of agent quality.
- **Answer quality:** reasoning, relevant context, memory, evidence, and calculation checks remain necessary even when all required capabilities exist.
- **Execution boundary:** real shell access is bounded by data, credentials, network policy, and runtime resources rather than a command-word allowlist. General public research uses backend web tools; provider calls use restricted sandbox egress.
- **Data privacy:** models and E2B may process supplied financial data, and an external brokering operator may process provider secrets. Domain restrictions and tool separation do not guarantee that sensitive data cannot leave, including through a web query or permitted destination. A destination can also reflect injected credentials to sandbox code.
- **Open interfaces:** SnapTrade Commercial versus Personal OAuth, provider scopes, brokering integration, bridge operations, request and response contracts, narrow run-bound authentication, Mastra integration and model compatibility, and operating limits remain undecided. Broader access must preserve current product authority and financial evidence requirements.
