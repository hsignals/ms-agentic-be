# Sandboxed code execution

## 1. Status and scope

**Status: ACCEPTED architecture decision.** MyStacks uses on-demand E2B sandboxes for real shell and file tools and generated Python or JavaScript execution, including programmatic tool calling. The shared Mastra API or worker retains the agent loop; E2B supplies a remote execution workspace for one run. Sandbox code may receive the current user's authorized financial data for analysis. Deployment configuration and provider data-processing terms remain open.

This capability supports in-scope work such as uploaded CSV analysis, custom calculations, hypothetical simulations, and reports. It preserves the [Phase 1 informational limits](../requirements.md), including the exclusion of specific investment recommendations and financial execution.

## 2. Decision

### 2.1 Execution responsibility

The runtime uses registered **shell, file, and code execution tools** backed by an E2B workspace. The agent may read and write working files, run commands such as `sed`, `grep`, and `jq`, and execute Python or JavaScript. Trusted backend code creates and binds the workspace, supplies authorized inputs and access, and returns results, errors, and artifacts. The runtime checks those results, iterates when needed, and produces the user-facing answer.

Inputs may arrive throughout a run. The worker can fetch more authorized data, write additional files through the E2B SDK, and continue execution in the same workspace; admitted provider or bridge calls can also fetch data from inside the sandbox. Large datasets need not pass through model context in full. Programmatic tool calling lets a script compose reads, loops, pagination, concurrency, and filtering without sampling the model between each call. The shared runtime retains the reasoning loop and receives useful previews, file references, and evidence metadata. Adding data for that run's work does not enable steering by subsequent main-chat messages. [E2B file transfer](https://docs.e2b.dev/filesystem/upload)

Prefer Mastra's native [`@mastra/e2b` workspace integration](https://mastra.ai/integrations/sandboxes/e2b), tools, and E2B SDKs when they meet the run-scoping, execution, and artifact requirements. The exact adapter remains an implementation choice; reuse does not relax the user boundary.

E2B supplies isolated execution environments and SDK lifecycle controls; it does not supply MyStacks' reasoning, memory policy, financial authorization, or answer validation. See the [E2B documentation](https://docs.e2b.dev/).

A **skill** can supply analysis guidance and provider SDK or API documentation, but execution requires an enabled capability. Permissions must be enforced outside prompts and skills. Trusted, predefined calculations may run in the shared backend. Model-generated code, model-directed shell commands or `eval`, and untrusted plugins must not run in shared API or worker processes.

### 2.2 User and run boundary

Each independent execution run owns **one sandbox, created only when shell or code execution is needed and reused across successive calls in that run**. A foreground main-agent invocation and each background job attempt are separate runs. Concurrent runs must not share a live workspace, even for the same user.

Working files persist across calls within the run. Native interpreter contexts may be reused within that run, but shared files do not guarantee that shell and Python contexts share in-memory variables. Before the run ends, the adapter must **save useful retained files outside E2B, persist required results and metadata, then destroy the sandbox** under the [analysis retention decision](0023-analysis-data-retention-and-object-storage.md). A later authorized run may restore selected saved files into its fresh sandbox. Pause is not destruction; the required cleanup must use the provider's destruction operation rather than relying on a pause default.

A whole-job retry starts a fresh run and sandbox, without interpreter checkpoint recovery. A main-agent continuation is a new invocation that reads persisted child results; it does not inherit a child's live processes or workspace. These ownership rules preserve the limit of two total attempts and the best-effort cancellation policy.

Trusted backend code must bind sandbox identity and access to the current user and run. A common Mastra `Agent` must not hold one static live sandbox shared by its users or concurrent runs. Sandbox selection and file export must preserve the same binding on every protected operation.

E2B describes its execution boundary as a [microVM per session](https://e2b.dev/). Using that boundary for generated code does not require placing every user's complete agent in a dedicated VM or maintaining an always-on environment per user.

### 2.3 Data and authority boundary

Trusted tools can fetch selected data and materialize it as run files, returning compact metadata and paths to the model instead of requiring every raw row in model context. Generated code may also obtain authorized reads through a provider SDK with credential brokering or the user-bound backend read bridge. Both paths must preserve the portfolio evidence contract, including source as-of times, retrieval times, coverage, units, and gaps. **Processing the current user's authorized financial data in sandbox code is accepted and necessary for analysis.**

Retained datasets and workspace files use private Google Cloud Storage; PostgreSQL keeps normal application and Mastra records, small structured results, metadata, and file references. Trusted backend code authorizes account/channel-scoped export and restoration. Prefer native SDK capabilities that meet the boundary; the exact run-scoped transfer mechanism remains open. Agents and sandboxes receive neither broad cloud-storage credentials nor unrestricted bucket access. The [analysis retention decision](0023-analysis-data-retention-and-object-storage.md) owns retention, access, and storage responsibilities.

The [credential decision](0002-backend-owned-financial-credentials.md) keeps raw provider credentials outside the E2B execution environment. **Credential brokering** injects authentication into admitted outgoing requests through an external **egress proxy**; the trusted backend selects the current user's credential and destination and enforces account/object ownership and read authority. A user-bound backend read bridge performs application signing or other authentication that proxy injection cannot supply. Narrow run-bound bridge authentication or an opaque SDK placeholder may enter the sandbox; the mechanism remains open. Application-wide keys, OAuth client secrets and refresh tokens, database credentials, model keys, and the E2B management key remain outside model-directed execution. Token refresh is a backend operation.

[E2B Secrets](https://docs.e2b.dev/secrets) supports external HTTPS-header injection, and its [implementation description](https://e2b.dev/resources/introducing-e2b-secrets) makes clear that E2B stores and processes the secret outside the sandbox. The brokering integration must preserve MyStacks' durable Secret Manager and KMS-encrypted PostgreSQL storage split. Credential isolation does not authorize a request, hide supplied financial data, or prevent an allowed destination from reflecting a credential to sandbox code.

**MyStacks configures default-deny outbound access with backend-controlled access to required provider or bridge destinations.** Runs that only analyze supplied data can remain offline. [E2B enables outbound internet by default](https://docs.e2b.dev/network/internet-access), so the application must configure its intended restrictions explicitly. Provider access must not expose private infrastructure or another user's objects. General public web search and page reading use separate backend tools rather than unrestricted sandbox internet access.

Data, credential scope, network policy, and runtime resource limits constrain the sandbox. A command-word allowlist is not the security boundary. A domain allowlist alone does not guarantee that sensitive data cannot leave: permitted destinations may receive supplied data, and backend web queries can also disclose sensitive content.

Sandboxing contains untrusted code execution; MyStacks must separately enforce account/object authorization and product scope. It does not make generated calculations correct or hide supplied data from that code or the provider operating its environment.

## 3. Rationale and alternatives

Shell, files, and generated code let the assistant inspect data, use SDKs, paginate provider reads, calculate, and build reports without a bespoke tool for every API read or analysis. Programmatic composition avoids intermediate model sampling while preserving broad provider access. Isolated execution protects shared backend code while credential brokering and the backend read bridge keep raw provider secrets outside generated code. The cost is provider trust, resource and lifecycle management, brokering integration, and exposure of authorized financial data to the execution environment.

One sandbox per run retains files and execution context across iterations without paying for an always-on workspace. Independent runs and fresh retry attempts avoid shared live state, while required persisted outputs let later turns use results after cleanup. This does not preserve arbitrary processes or interpreter state across turns or retries.

Another managed or self-hosted sandbox is a viable alternative if it meets the required isolation, language, lifecycle, and data-policy needs. MyStacks would then take on the corresponding integration and operational work. A persistent per-user runtime can also provide a workspace, but adds idle resources and lifecycle responsibilities that the execution capability does not require.

Limiting the assistant to predefined calculations avoids generated execution but narrows the supported analysis and adds custom tool maintenance. Unrestricted sandbox internet access would simplify arbitrary fetching but exceed the selected data-access boundary. Backend web tools and controlled provider access supply the required capability within that boundary.

## 4. Consequences and open decisions

- **Runtime responsibility:** the agent loop must inspect execution failures, evidence, assumptions, and results before using them in an answer. Successful execution alone does not validate the method.
- **Lifecycle:** run deadlines, interruption cleanup, and provider retention and deletion need concrete policies within the persist-then-destroy rule. Useful analysis inputs, intermediates, results, and evidence follow the analysis retention decision; automatic pruning is deferred.
- **Configuration:** templates, packages, provider egress enforcement, trusted sandbox-to-bridge authentication, resource-budget limits, and execution deadlines remain undecided.
- **Brokering implementation:** credential brokering is the selected provider-access pattern where native authentication fits; the exact E2B proxy integration, SDK compatibility, and narrow run-bound bridge authentication remain open. This does not select a model provider's native programmatic tool calling feature or establish compatibility between Mastra, the E2B integration, and the selected model provider.
- **Provider trust:** current data-processing terms, regions, operator access, deletion behavior, and applicable security evidence must be verified for customer financial data. A provider security claim does not establish that it cannot access supplied plaintext or secrets handled by its external proxy. The [sandbox and credential-broker data-handling TODO](../TODO.md#7-sandbox-and-credential-broker-data-handling) tracks the customer agreement and DPA, use restrictions, and retention of logs, snapshots, and backups. Run-bound bridge access must end with the run; destroying the sandbox does not revoke the provider's durable credential.
- **Analysis limits:** supported inputs, dataset sizes, calculation methods, and controls for enforcing informational scope remain open.
