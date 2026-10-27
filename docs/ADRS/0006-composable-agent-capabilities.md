# Composable agent capabilities

## 1. Status and scope

**Status: ACCEPTED capability model.** MyStacks prioritizes reusable backend tools and isolated generated-code execution as the agent's means of doing work. Model reasoning, skills, context, and memory guide how the agent composes those capabilities. A credential-injecting API proxy remains a **future option**, justified only when actual requests reveal gaps that the existing tools cannot handle well.

The [Phase 1 requirements](../requirements.md) limit financial access to reads and outputs to information and analysis, excluding financial execution and specific investment recommendations. Memory, informational task management, and message delivery retain their own authorized operations. This decision selects a design direction, not an implemented capability or a proxy implementation.

## 2. Decision

### 2.1 Reusable tools provide authorized capabilities

Trusted backend tools provide building blocks such as holdings, positions, transaction history, and market data. Their supported filters and outputs should allow composition across useful questions, without requiring a separate tool or fixed workflow for every analysis.

The agent sees tool descriptions, input schemas, and authorized results. Credentials belong in trusted backend storage and adapter execution, not in model-visible tool definitions. The [financial credentials ADR](0002-backend-owned-financial-credentials.md) owns credential handling, trusted user binding, and authorization on every protected operation. A tool's availability does not replace those checks.

The [Mastra framework ADR](0005-mastra-runtime-framework.md) owns tool registration and skill loading. Skills explain how to use capabilities; loading a skill cannot grant authority or install trusted executable code.

### 2.2 Generated code supplies flexible analysis

The agent may combine authorized tool results and selected user data with generated code for calculations, comparisons, hypothetical scenarios, and reports. The [code execution ADR](0003-sandboxed-code-execution.md) owns E2B isolation, data access, network policy, and artifact lifecycle. The shared Mastra runtime retains the agent loop and checks results before presenting them.

For example, holdings and price tools can supply inputs for a hypothetical portfolio calculation in E2B without a dedicated tool for that exact scenario. Code cannot obtain missing account data or provider functionality unless an authorized capability supplies it. Personalization memory guides the answer but does not establish current balances or permissions.

### 2.3 A future API proxy can broaden provider access

If useful requests require a broader set of provider operations, MyStacks may expose a credential-injecting API proxy through a registered backend tool. The agent could select from admitted provider endpoints and parameters instead of relying on a bespoke high-level tool for each operation. Provider integration, authorization policy, and interpretation of returned data would still require trusted application work.

The proxy would resolve the user from trusted server context, authorize the connected account and requested operation, validate the destination and request parameters, and then add provider credentials or sign and send the request. It must return authorized data without exposing credentials or authenticated request material. An arbitrary URL or an HTTP method alone cannot establish that a request is permitted or read-only. Requests and redirects must remain within the approved provider destinations and operations.

Authorization must remain outside model judgment. This follows [OWASP's guidance on excessive agency](https://genai.owasp.org/llmrisk/llm062025-excessive-agency/), which distinguishes functionality from permissions and requires downstream authorization for each request.

The simplest extension would keep proxy calls in the trusted backend tool path and supply selected results to E2B. Direct calls from generated code would require a separate design for trusted caller binding and permitted network access under the credential and code execution ADRs. Giving sandbox code a scoped bearer token or secret URL would still expose a runtime access credential and would conflict with the current credential boundary. No direct sandbox-to-proxy mechanism is selected.

## 3. Rationale and alternatives

**Reusable tools plus generated analysis** support broad work while keeping account authority in trusted backend code. They avoid a fixed catalog of complete workflows while preserving explicit boundaries around data access and execution.

**Only predefined calculations** simplify execution and validation but restrict the questions the agent can answer. E2B allows custom calculations over authorized data; result quality still depends on the available evidence and method.

**Direct provider credentials in model-directed execution** allow code to use more provider functionality immediately, but expose reusable secrets and let requests bypass backend operation checks. Raw credentials expand authority, not reasoning quality. The accepted credential boundary rejects that trade-off.

**A broader API proxy** can reduce the need for bespoke tool implementations, but moves work into endpoint admission, request validation, provider authentication, and response interpretation. It does not eliminate integration work or make every provider feature safe to expose. Demonstrated tool gaps must justify that additional surface.

## 4. Consequences and open decisions

- **Capability coverage:** tools and data must cover the requested work. Add or improve capabilities for demonstrated needs; tool count alone is not a measure of agent quality.
- **Answer quality:** reasoning, relevant context, memory, evidence, and calculation checks remain necessary even when all required capabilities exist.
- **Deployment independence:** shared workers and isolated runtimes can both enforce this credential boundary. A dedicated VM does not require giving model-directed code the user's provider secrets.
- **Data privacy:** removing credentials does not remove the sensitivity of holdings, history, or reports. Model providers and E2B may process the selected data supplied to them under the existing data-policy decisions.
- **Open proxy choices:** the need for a proxy, admitted providers and operations, request and response contracts, caller binding, and operating limits remain undecided. Broader access must preserve current product authority and financial evidence requirements.
