# Sandboxed code execution

## 1. Status and scope

**Status: ACCEPTED architecture decision.** MyStacks uses on-demand E2B sandboxes, exposed through a Mastra tool, for generated-code execution. The shared Mastra runtime retains the agent loop; the sandbox owns execution and its working files. Deployment configuration and customer-data handling remain open provider and data-policy decisions.

This capability supports in-scope work such as uploaded CSV analysis, custom calculations, hypothetical simulations, and reports. It preserves the [Phase 1 informational limits](../requirements.md), including the exclusion of specific investment recommendations and financial execution.

## 2. Decision

### 2.1 Execution responsibility

The runtime calls the **E2B execution tool**, a registered Mastra tool backed by trusted backend code, with generated Python or JavaScript and selected data for the user's analysis. The adapter creates or selects an E2B sandbox, supplies those inputs, and returns results, errors, and artifacts. The runtime checks those results, iterates when needed, and produces the user-facing answer.

Prefer Mastra's native [`@mastra/e2b` integration](https://mastra.ai/integrations/sandboxes/e2b) when it meets the task-scoping, execution, and artifact requirements. The exact workspace or tool adapter remains an implementation choice; reuse does not relax the user boundary.

E2B supplies isolated execution environments and SDK lifecycle controls; it does not supply MyStacks' reasoning, memory policy, financial authorization, or answer validation. See the [E2B documentation](https://docs.e2b.dev/).

A **skill** can instruct the runtime to analyze data, but execution requires an enabled tool. Trusted, predefined calculations may run in the shared backend. Model-generated code, model-directed shell commands or `eval`, and untrusted plugins must not run in shared workers.

### 2.2 User and session boundary

Each sandbox must be scoped to **one user's task or analysis session**. The runtime may reuse it for iterations within that analysis, without sharing a live environment across users. When analysis ends, the adapter must **persist required artifacts outside the sandbox, then terminate the disposable sandbox**. Sandbox pause is not a deletion action; sandbox lifetime must not determine whether a required report survives.

Trusted backend code must bind sandbox identity and access to the current user and task. A common Mastra `Agent` must not hold one static live sandbox shared by its users. Sandbox selection and file export must preserve the same binding on every run.

E2B describes its execution boundary as a [microVM per session](https://e2b.dev/). Using that boundary for generated code does not require placing every user's complete agent in a dedicated VM or maintaining an always-on environment per user.

### 2.3 Data and authority boundary

Trusted backend adapters retrieve financial information and supply only the data needed for the analysis. Provider credentials, database credentials, and the E2B management key remain outside model-visible inputs and sandbox environments, as required by the [credential decision](0002-backend-owned-financial-credentials.md).

**Outbound internet is disabled by default for financial analysis.** Trusted backend tools supply required financial and research data, reducing the sandbox's direct data-access and exfiltration paths. Any task-specific network exception must be explicit in backend policy.

Sandboxing contains untrusted code execution; MyStacks must separately enforce account/object authorization and product scope. It does not make generated calculations correct or hide supplied data from that code or the provider operating its environment.

## 3. Rationale and alternatives

Generated code lets the assistant answer custom analysis requests without adding a predefined tool for every calculation. Isolating that execution protects shared backend code and its credentials while keeping the common runtime and durable state outside short-lived analysis environments.

Another managed or self-hosted sandbox is a viable alternative if it meets the required isolation, language, lifecycle, and data-policy needs. MyStacks would then take on the corresponding integration and operational work. A persistent per-user runtime can also provide a workspace, but adds idle resources and lifecycle responsibilities that the execution capability does not require.

Limiting the assistant to predefined calculations avoids generated execution but narrows the supported analysis. The selected design retains curated tools for common work and uses the sandbox when custom code is needed.

## 4. Consequences and open decisions

- **Runtime responsibility:** the agent loop must inspect execution failures, evidence, assumptions, and results before using them in an answer. Successful execution alone does not validate the method.
- **Lifecycle:** session limits, interruption cleanup, permitted pause/resume use, and provider retention and deletion need concrete policies within the persist-then-terminate default. Required user state remains durable outside execution environments.
- **Configuration:** templates, packages, enforcement of default network isolation and any permitted exceptions, resource-budget limits, and execution deadlines remain undecided.
- **Provider trust:** current data-processing terms, regions, operator access, deletion behavior, and applicable security evidence must be verified before customer financial data is admitted. A provider security claim does not establish that it cannot access supplied plaintext.
- **Analysis limits:** supported inputs, dataset sizes, calculation methods, and controls for enforcing informational scope remain open.
