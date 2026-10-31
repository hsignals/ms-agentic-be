# Backend scaffolding delivery

## 1. Outcome and authority

**Delivery:** a runnable, tested backend foundation with project-owned staging resources, so subsequent changes can focus on product behavior. The implementer delivers repository setup, full runtime integrations, the authorized cloud resources, repeatable local/CI evidence, and the staging evidence available under the current prerequisite boundary.

**Current authority:** implementation, the three new stacked draft PRs above existing PR #1, GCP staging provisioning/configuration, and bootstrap deployment are authorized. Dedicated database creation and its URL, the E2B key, and dependent live tests are deferred. Full E2B code remains in scope. Configuration alone does not prove deployment, and bootstrap health does not prove full runtime acceptance. Section 8 defines the remaining access and delivery limits.

The [requirements](../requirements.md) own product behavior. The [runtime design](runtime.md), [task design](tasks.md), and [architecture decisions](../ADRS/README.md) own product execution and security contracts. This document owns the scaffold boundary, initial staging configuration, verification, and handoff. Its selected staging settings do not settle production capacity or the remaining product design.

### 1.1 Included work

- Adapt repository conventions, developer tooling, contribution guidance, project skills, and the full GitHub workflow from [hsignals/mystacks-be](https://github.com/hsignals/mystacks-be).
- Build the Hono API and a separate BullMQ worker using Bun and TypeScript, with validated configuration, shared infrastructure clients, structured logging, health checks, and graceful shutdown.
- Integrate Drizzle application migrations, native Mastra PostgreSQL storage, private GCS retained-file storage, Valkey-backed jobs, and E2B execution through the selected framework and SDKs.
- Supply local development, disposable integration tests, container builds, CI checks, provisioning commands, deployment automation, and an operating runbook.
- Prove real foreground model execution, queued model-and-sandbox execution, retained result/file persistence and authorized restoration, and redeployment on this project's staging resources.

### 1.2 Product work outside this delivery

Customer signup, Privy/Twilio onboarding, wallet verification, channel linking and messaging adapters, financial providers, portfolio calculations, user task rules, proactive investigations, human-support integration, and user-facing memory behavior remain business implementation work. Production deployment, financial execution, and paid provider subscriptions for those features are outside the scaffold.

Smoke tests use synthetic identities and data. They exercise real application boundaries and installed SDKs without requiring customer accounts or live financial records. Test-only fixtures and helpers belong under `tests/`; operational verification scripts belong under `scripts/`. Add application records only where the delivered runtime needs them, such as durable job outcomes. Do not invent future business tables or expose an unauthenticated demonstration agent.

The foundation must preserve these product boundaries without implementing the excluded workflows:

- **Channel capabilities:** Bird is the primary Apple Messages for Business provider. iMessage supports chat, one-off analysis, schedules, and eligible proactive reports. WhatsApp supports chat and one-off requested analysis; its schedules, proactive reports, and templates remain deferred. Photon is a backup integration plan, not a second scaffold adapter or automatic failover path. The [Apple messaging decision](../ADRS/0021-apple-messages-with-bird.md) owns this scope.
- **Human support:** Bird Conversations is the Apple staff interface. Backend-enforced human ownership pauses automated replies and reports while requested computation and schedules continue saving results; proactive starts are suppressed. Staff explicitly return control, and the main agent handles pending results under current permissions. The [support ownership decision](../ADRS/0022-human-support-conversation-ownership.md) owns this contract; a completed background job must not be treated as unconditional permission to send a message.

## 2. Selected application foundation

### 2.1 Runtime and libraries

| Concern | Selected approach |
| --- | --- |
| Runtime and package management | Bun, TypeScript, and `bun.lock`; frozen installs for a pinned dependency set. |
| HTTP | Hono, with app construction separate from listener startup and feature work separate from route handling. |
| Agent execution | Mastra's regular `Agent`, explicitly registered tools, and fresh trusted context per run. |
| Model | OpenAI `gpt-6-luna` through the Responses API, `service_tier: "fast"`, and `reasoning.effort: "xhigh"`. |
| Background execution | BullMQ using the dedicated Valkey store; foreground requests invoke Mastra directly. |
| Application persistence | Drizzle schemas and checked-in migrations for application-owned PostgreSQL tables. |
| Framework persistence | Mastra's native PostgreSQL storage adapter, with separately owned ordinary tables in the same database. |
| Retained analysis files | Private Google Cloud Storage for useful datasets and workspace files; PostgreSQL owns small structured results, metadata, and file references. |
| Generated code | E2B workspaces through native Mastra integration or the direct SDK where required by the accepted boundary. |
| Logging | Structured Pino logs with request, run, and job correlation, safe errors, and credential redaction. |

Pin and validate compatible package versions during implementation. The source repository's package manifest, lockfile, domain types, and import graph are references, not a dependency set to copy wholesale. Keep database and transport encodings at their boundaries and use native SDK types where they meet the contract.

The [framework decision](../ADRS/0005-mastra-runtime-framework.md#24-initial-application-runtime-and-model) owns runtime/model selection and its trade-off. One Luna configuration keeps the initial runtime simple; a small staging comparison against `high` informs later tuning. Luna supports the selected settings and requires Responses for reasoning with tools. [Luna model](https://developers.openai.com/api/docs/models/gpt-6-luna)

### 2.2 Execution and storage boundaries

The API and worker share one codebase and may use one image with distinct entrypoints. The API owns foreground execution; the worker claims background jobs and saves their outcomes before reporting completion. Instance count and worker job concurrency are separate settings. Small results and file metadata/references persist in PostgreSQL, while retained files persist in private GCS. The smoke result and its retained files must remain retrievable after their worker process and E2B sandbox end.

Application migrations must not claim ownership of Mastra-managed tables. Document and verify both initialization paths, their database permissions, and their behavior on an existing database. Reuse shared infrastructure clients when configuration and lifetime are shared; keep user-scoped credentials out of process-wide mutable clients.

The [analysis storage decision](../ADRS/0023-analysis-data-retention-and-object-storage.md) owns retention and file access. Keep useful inputs, intermediate calculations, final results, and supporting evidence when their provider terms permit. Retention metadata must identify the owning account, originating channel, run, data type, applicable provider/connection, saved and retrieval times, source as-of time or explicitly unknown freshness, size, and storage reference. Exact record fields and object organization remain implementation choices. Retained financial observations support follow-ups; saving or restoring them does not establish current freshness or create a portfolio-history indexer.

Automatic pruning is deferred. Do not configure age-based GCS expiry or discard retained outputs merely because a run or sandbox ends. Record enough metadata and usage to support later cleanup decisions. Disposable test-container cleanup remains separate from retention of the outputs used as staging acceptance evidence.

BullMQ owns whole-job retry and stalled-job recovery. The [scheduling decision](../ADRS/0004-durable-scheduling-and-queued-execution.md) limits requested background work to two total attempts, including temporary failures and interrupted/stalled recovery. Implemented recovery paths must preserve that ceiling; `attempts=2` alone is not evidence. A deployment must not require an empty queue or reconstruct all queued work from a separate deployment state machine.

The product's ordered channel handler, pending-completion recovery, main-agent-owned replies, and cancellation rules remain owned by the [channel-turn decision](../ADRS/0009-channel-turns-and-background-subagents.md); human takeover and explicit handback follow the [support ownership decision](../ADRS/0022-human-support-conversation-ownership.md). A smoke test that submits a job and retrieves its result proves the foundation, not the complete messaging or task lifecycle. Any part of that lifecycle implemented in the scaffold must follow its owning contract.

### 2.3 Credentials and sandbox execution

Application-wide credentials belong in the trusted backend: ignored local `.env` files for development and this project's Secret Manager secrets for staging. The user has approved reusing only the `OPENAI_API_KEY` value from the local `mystacks-be` environment. Copy that value without displaying it, committing it, or copying the entire source environment. Other credentials require their own approved source.

Each independent run needing shell or code owns one lazily created E2B workspace, reused across its calls. Persist useful retained files in GCS and required results, metadata, and references in PostgreSQL before destroying it; retries use fresh workspaces. Later authorized runs may restore selected files into a fresh workspace through a backend-controlled transfer. Generated code must not execute in the shared API or worker process. The synthetic calculation smoke needs no financial-provider credentials and must use the default-deny network policy.

Raw provider and infrastructure credentials must stay out of prompts, logs, traces, results, and sandbox files or environment variables. The current [credential decision](../ADRS/0002-backend-owned-financial-credentials.md) uses credential brokering outside the sandbox through native egress-proxy injection or a user-bound backend read bridge. Financial-provider brokering is later integration work; the scaffold must not bypass that boundary to demonstrate E2B.

Trusted backend code must authorize the account and applicable channel/run scope before saving, retrieving, or restoring files. Account-owned financial evidence may support authorized follow-ups from linked channels; retained files do not grant access to another channel's conversations, jobs, scheduled tasks, or results. A stored object reference alone grants no access. Use the native GCS and E2B SDKs for the selected transfer mechanism; agents and sandbox code must not receive broad bucket access or storage credentials.

## 3. Repository standards and local development

### 3.1 Imports to adapt

| Area | Required delivery |
| --- | --- |
| Repository instructions | Shared `AGENTS.md`, a `CLAUDE.md` pointer, and an accurate map of document owners. |
| Conventions | Canonical naming, code and comment rules, dependency boundaries, validation ownership, failures, testing, and documentation practices. Retain accepted obligations while replacing the old product glossary and architecture-specific rules. |
| Code style | Source conventions include arrow functions, braced control flow, three-line ternaries, immutable sorting, narrow dependency arguments, and explicit contracts rather than utility-type inference. |
| Comments | Source conventions include responsibility headers, TSDoc for exports, and exception behavior for production functions, including private functions. |
| Tools | Strict TypeScript, Biome linting and applicable custom rules, dprint formatting, Lefthook staged-file hooks, and Vitest suite separation. |
| Repository checks | Local Markdown links plus import, naming, and log checks grounded in this repository's actual owners and code. Omit old domain-specific assertions rather than inventing targets for them. |
| Contributor workflow | `CONTRIBUTING.md`, a PR template, documented check commands, and readiness evidence. |
| Project skills | Adapt `review`, `sync-docs`, `create-pr`, and `staging` under `.claude/skills/`, with `.agents/skills/` links to the same instructions. |
| Environment hygiene | Merge relevant ignore rules, document configuration in `.env.example`, and exclude secrets, local artifacts, and test data from images and commits. |

The imported skills must point to documents included in this repository. The staging skill must use this project's deployment contract. Trading E2E skills, the old chat engine, signing code, financial workers, and historical migrations are outside the import scope.

### 3.2 Local checks and integration resources

A clean checkout must have documented commands to install the pinned dependencies, start local infrastructure, initialize storage, run the API and worker, format and lint, check types, and run the relevant test suites. Routine unit and process tests use synthetic environment values and do not load developer credential files.

The integration runner owns disposable PostgreSQL and Valkey resources, storage initialization, test execution, and cleanup. It must isolate concurrent runs, preserve failures in its exit status, and clean up its own resources after success, failure, or interruption. It must not infer a live test target from a developer's production or staging database URL.

Use unit and local integration tests for boundary and failure coverage, including file ownership, metadata, and persistence failures. Keep live staging tests to a few short foreground, background/file-restoration, and redeployment checks; the deployed test must exercise real private GCS and E2B transfers. Docker availability is a prerequisite for the disposable local PostgreSQL/Valkey suites; CI must exercise those suites too. Missing local evidence must remain visible rather than being reported as a pass.

## 4. Staging resources and access

### 4.1 Initial configuration

| Resource | Agreed starting configuration |
| --- | --- |
| GCP project | Dedicated `ms-agentic-staging`, under the same organization and billing account as the reference staging project, subject to access and project-ID availability. |
| GCP region | `us-east4` for the API, worker, and Valkey. |
| API | One warm Cloud Run Service instance, 1 vCPU and 1 GiB RAM, with instance-based billing and CPU available after HTTP acknowledgement. |
| Worker | One Cloud Run worker-pool instance, 1 vCPU and 1 GiB RAM, with manual scaling and no HTTP ingress. |
| Queue store | One `custom-pico` Valkey node; cluster mode disabled, one shard, zero replicas, AOF every second, `noeviction`, private VPC connectivity, and TLS. |
| Database | Selected target: dedicated TimescaleDB-enabled Tiger Cloud Performance service in AWS `us-east-1`, starting at 0.5 vCPU and 2 GB RAM, with ordinary application and Mastra tables. Creation and the database URL are deferred; confirm paid configuration and backups before a separately authorized creation. |
| Retained-file storage | Project-owned private GCS bucket with backend-controlled access. Bucket location, storage class, object organization, and backup/recovery details remain implementation choices; automatic pruning and age-based expiry are deferred. |
| Sandbox account | E2B Hobby for short scaffold tests using its default sandbox resources and session limits. |
| Images and credentials | Project-owned Artifact Registry, runtime and deployment identities, Secret Manager secrets, and GitHub federation/configuration. |

**Project rationale:** a dedicated staging project separates this application's permissions, resource ownership, and GCP cost reporting while retaining the existing organization and billing relationship. **Region rationale:** GCP `us-east4` and Tiger's AWS `us-east-1` place the application and database in Northern Virginia. They still cross a cloud boundary; verification must measure actual connectivity and latency. [GCP resource hierarchy](https://docs.cloud.google.com/billing/docs/onboarding-checklist?hl=en), [Cloud Run regions](https://docs.cloud.google.com/run/docs/deploy-worker-pools), [Tiger regions](https://www.tigerdata.com/docs/get-started/supported-regions)

These sizes are initial staging allocations, not evidence of production capacity. Record memory use, duration, model usage, outcomes, retained-file growth, and queue delay before increasing capacity. Preserve the [Valkey decision's](../ADRS/0020-managed-valkey-queue-storage.md) accepted maintenance downtime and possible loss of recent unflushed writes; ordinary application redeployment must leave PostgreSQL, Valkey, and retained GCS files intact.

### 4.2 Public ingress and protected operations

Follow the reference service's public Cloud Run invocation model, with application authentication and authorization on protected routes. Public health may report safe status and deployment identity. Model invocation, sandbox execution, job submission, result retrieval, and retained-file access must require a verified staging identity and appropriate scope. Public ingress does not make these operations public or make the GCS bucket public.

The implementer must document the staging smoke authentication mechanism and supply a usable identity to the test runner. Use existing identity-verification capabilities; do not build customer signup merely to run the scaffold tests. Later private product routes and provider webhooks use their selected authentication contracts.

### 4.3 Provisioning and release ownership

The implementer provisions the GCP project, billing linkage, enabled APIs, private networking, IAM, GitHub Workload Identity Federation, available secrets, registry, queue, and private GCS bucket using documented provider commands and small scripts where they remove repeated work. Database provisioning and E2B credentials remain deferred. Grant API/worker identities only the storage access their approved transfers require. Use each provider's CLI when it supports the operation; document the fallback and any required user interaction where it does not.

GitHub Actions owns application releases: build and verify the image, run storage initialization/migration gates, deploy the API and worker, and verify the serving result. Infrastructure changes remain explicit provisioning work. Provisioning must use this project's resources and must not alter sibling services or their IAM to make this deployment work.

## 5. Full GitHub delivery workflow

### 5.1 Delivery across four pull requests

| PR | Scope | Review and completion evidence |
| --- | --- | --- |
| **1. Existing product design** | Existing PR #1 owns the product requirements, architecture, ADRs, and designs. Preserve its accepted product scope. | Keep its evidence and readiness separate from the new scaffold deliverables. |
| **2. Documentation and conventions** | Repository instructions, contributor/branch rules, conventions, PR template, four project skills, this delivery contract, and initial testing/staging contracts. Exclude temporary research. | Review contracts and working practices; verify document structure, links, and skills. Describe command/deployment contracts without claiming execution. The documentation-only live-test exemption applies, while the requested PR remains draft. |
| **3. Runnable local foundation** | Bun/TypeScript tooling, Hono API and worker, PostgreSQL/Drizzle and native Mastra storage, BullMQ/Valkey, Luna/E2B integration, retained-file storage integration, configuration/logging/health/shutdown, Docker, tests, and CI. | Verify local execution, storage boundaries, meaningful unit/integration tests, and container checks. Include full E2B code without requiring a live key for routine tests. Keep the runtime-changing PR draft while dependent live proof and personal acceptance remain pending. |
| **4. Staging infrastructure and deployment** | Authorized GCP provisioning, IAM/federation, secrets, queue/private storage, manual release workflow, migration gates, recovery, and available bootstrap deployment evidence. | Verify actual resources, permissions, immutable deployment identity, safe health, and costs. Database creation/URL, E2B key, and dependent full live acceptance are explicitly deferred; keep the PR draft. |

The three new PRs form a chain above existing PR #1: conventions target its branch, local foundation targets conventions, and staging targets local foundation. Each includes its parent and receives independent review. If a parent merges or its head changes, reassess the comparison and affected evidence. Staging evidence identifies the exact combined candidate and which foundation behavior it covers; do not report the foundation head as independently deployed when only the combined candidate was tested.

The foundation and staging PRs keep documentation accurate as executable commands and verified behavior arrive. Enable required runtime checks only when their workflows exist; do not introduce passing placeholders or make the docs PR depend on an unimplemented container check. The handoff identifies all four PRs, their bases, and draft/readiness states.

### 5.2 Branches, review, and draft PRs

1. Use an explicit PR base when supplied. Otherwise, select the head branch of the most recently created open PR across all authors, including drafts; use `main` if none exists. An existing PR retains its base unless a change is requested.
2. Integrate the selected parent's current head within the granted Git authority, preferring merges to rewriting published history. Changing the PR base alone does not integrate its code. Recheck the parent before creating or updating the PR and reassess affected evidence when it changes.
3. Implement the scoped change, run independent read-only review, fix accepted findings, and update affected documentation. Review must cover the complete change and affected consumers against identified revisions.
4. Before a code push or PR, run the full required local checks. Create or update a draft PR with its parent, behavior, review dispositions, checks, and any missing evidence. Keep unrelated existing work out of commits and stage only named paths.

### 5.3 CI and manual staging deployment

CI runs on PRs and updates to `main`, covering types, lint/format checks, applicable repository checks, unit and integration suites, and the built container. Keep the required check names `typecheck`, `test`, and `container-smoke`, adapting their implementation to this backend.

Staging deployment is manually triggered and serialized. Bind the selected remote commit to an immutable image digest, run migration gates with appropriate separate credentials, deploy both entrypoints, and verify their identities and health. Preserve an explicit supported recovery procedure and report partial deployment or migration failures. Do not copy the reference's financial-worker pause protocol or traffic controller as this project's lifecycle contract.

The design accepts stop/start downtime and interrupted foreground requests. **The implementer must resolve and verify single-coordinator ownership during Cloud Run replacement before claiming deployment acceptance.** A configured instance limit alone does not prove that old and new processes cannot overlap. Use the simplest provider-supported mechanism that satisfies the accepted contract; a stronger recovery guarantee or distributed ownership design requires a separate decision.

### 5.4 Readiness and repository settings

Bind acceptance evidence to the tested commit, workflow run, image digest, API revision, and worker revision. Required independent review, checks, documentation, staging verification, and personal acceptance must cover the candidate before it becomes ready. The contributor supplies their own expected/observed staging results; automated smoke tests cannot supply that personal confirmation. Mark ready and request owner review only within explicit authority. A scaffold that changes runtime and deployment behavior requires live acceptance.

The reference merge policy uses squash merge, automatic deletion of merged feature branches, and one classic protection rule for `main`: one eligible approval, passing `typecheck`, `test`, and `container-smoke`, enforcement for administrators, and no force pushes or deletion of `main`. Preserve approvals after new commits; leave code-owner and latest-push approval requirements disabled. The reference's named PR-review bypass is `shunjizhan`, while required status checks still apply. Apply and verify these settings only when repository-setting changes are authorized. Protection of `main` does not protect a stacked PR targeting another feature branch.

The full flow is the reference, not a claim that its documented protections are currently enforced. Verify the target repository's actual settings and check behavior. Merge and production promotion remain separate actions from delivering the scaffold on staging.

## 6. Acceptance evidence

### 6.1 Required checks

| Check | Required observation |
| --- | --- |
| Clean checkout | Frozen dependency installation and documented startup/check commands work without files from a sibling checkout. |
| Local and CI | Configured formatting, linting, types, repository checks, unit tests, disposable PostgreSQL/Valkey integration tests, and container smoke checks pass. |
| Foreground | An authenticated request reaches Hono, creates trusted Mastra context, invokes real `gpt-6-luna` with the selected options, and returns a response. |
| Background | An authenticated submission reaches BullMQ; the deployed worker invokes Luna and uses E2B for a small synthetic calculation with a known expected answer. The test observes actual tool execution, a useful file saved in GCS, PostgreSQL results and file metadata/references, authorized retrieval, and sandbox termination. A model-written answer alone is insufficient. |
| File restoration and retention | After the first sandbox ends, a fresh authorized sandbox restores the saved file through the protected transfer path and verifies its contents. Account/channel/run bindings and original timestamps remain associated with it. The bucket remains private and no age-based expiry removes retained evidence. |
| Framework storage | The native Mastra adapter can write and read its owned state alongside Drizzle-managed application records without migration-ownership conflicts. |
| Authorization and isolation | Unauthenticated or wrong-scope requests cannot invoke paid work or read/restore another account's data or another channel's scoped jobs, results, and files. Account-owned evidence follows account authorization and may support authorized linked-channel follow-ups. Separate runs do not share private mutable context or E2B workspaces; backend storage credentials do not enter the sandbox. |
| Redeployment | A second image deploys successfully; existing PostgreSQL records, retained GCS files, and a waiting job survive application replacement, results and files remain retrievable, and both foreground and background smoke paths pass again. |
| Lifecycle | Process shutdown and sandbox cleanup follow their owners; required-output persistence failure is reported rather than presented as successful completion. Implemented interrupted-job recovery respects the attempt ceiling. Coordinator handoff evidence establishes the claimed single-active-coordinator behavior. |
| Operations | Health and correlated logs identify the running revisions, dependencies, run outcomes, and failures without secret values or full private inputs. |

Use focused local tests for failure paths and a few quick live checks for real integration. Live verification must not send customer messages, perform trades, or use customer financial data. Foreground interruption remains an accepted limit; do not claim exactly-once replies, checkpoint resume, or production scale from these tests.

### 6.2 Model comparison and handoff

Compare `fast` + `xhigh` with `fast` + `high` on a small set of short conversational and research/calculation examples. Record correctness, response time, and billed token usage, including reasoning. Keep `xhigh` as the selected setting unless the user approves a change based on that evidence.

The handoff includes all four PRs and their dependency/readiness states, available CI links, deployment workflow, commit, digest, and revisions; executed smoke commands and observed results; configuration/secret names without values; provisioning/recovery instructions; actual resource and private-bucket inventory; measured resource use and stored bytes where available; cost assumptions; and unresolved product work. Identify deferred database/E2B proof separately from failures and passes. The current authorized delivery may finish with those named dependencies deferred; full runtime acceptance and readiness remain pending.

## 7. Cost and resource guardrails

The agreed **planning allowance is USD 250 per month** for initial staging. It is an estimate, not an automatically enforced billing cap. Use the selected small allocations and confirm actual regional quotes and recurring charges before provisioning; seek a new decision before selecting a materially larger recurring commitment.

| Item | Planning estimate for 730 hours per month |
| --- | ---: |
| API, 1 vCPU / 1 GiB, instance-based billing | USD 52.56 |
| Worker pool, 1 vCPU / 1 GiB | USD 32.79 |
| Valkey, one `custom-pico` node plus one-second AOF | USD 22.98 |
| Tiger Cloud small paid compute | From USD 30, plus storage |
| Approximate always-on base | USD 138, plus storage and other usage |

These estimates use published list rates, before tax, credits, discounts, network traffic, image storage, GCS storage/operations/data transfer, secrets, logs, and CI overages. Include a bounded staging file workload and the selected bucket's current charges in the provisioning estimate; do not assume automatic expiry or pruning will bound storage growth. The USD 250 allowance remains a planning estimate, not a verified total including retained files. Cloud Run free tiers may already be consumed by other projects on the shared billing account. Tiger's advertised starting compute price is not an exact regional quote, and its advertised effective storage rate assumes compression that ordinary application and Mastra tables must not be assumed to achieve. [Cloud Run pricing](https://cloud.google.com/run/pricing), [Valkey pricing](https://cloud.google.com/memorystore/valkey/pricing), [Tiger pricing](https://www.tigerdata.com/pricing)

Luna Fast short-context list rates are USD 0.20 per million input tokens and USD 1 per million output tokens; reasoning is billed as output, while caching and long contexts have separate rates. At 2 vCPUs and 4 GiB, E2B usage is approximately USD 0.1656 per sandbox-hour. Hobby has no monthly subscription fee and limits sessions to one hour. Use it for bounded scaffold tests; a paid plan or longer-session requirement needs an explicit decision. [OpenAI pricing](https://developers.openai.com/api/docs/pricing), [reasoning usage](https://developers.openai.com/api/docs/guides/reasoning), [E2B pricing](https://e2b.dev/pricing)

Report accumulated live-test usage and the expected ongoing resource bill at handoff. Do not create a product-level per-user spending system merely to deliver the scaffold.

## 8. Prerequisites and autonomous execution handoff

### 8.1 User-supplied access

| Need | What the user must supply or enable | What the implementer can discover or do |
| --- | --- | --- |
| GCP | A working `gcloud auth login` session with access to the intended organization, billing account, and project provisioning/IAM operations, including private GCS bucket access. | Discover the organization and billing account from `mystacks-staging`, verify permissions and quotas, and report any missing grants. Configure backend storage identity access without introducing a separate storage API key. Ask for IDs only when they cannot be read or the intended account is ambiguous. |
| Tiger Cloud | Deferred: a dedicated database and its URL, supplied through an approved local secret file or secret store. | Deliver migrations, native storage initialization, and documented configuration now. Service creation and dependent live database tests require the deferred input and creation authority. |
| E2B | Deferred: an API key for the intended organization, supplied through a local secret file or secret store. | Deliver full E2B integration and local tests now. Configure the actual secret and run live sandbox acceptance after the key is supplied within approved test authority. |
| OpenAI | The already-authorized source `OPENAI_API_KEY`; no key needs to be pasted into chat. | Copy only that value securely, create the target secret once authorized, and verify Luna/Fast access without changing shared OpenAI project defaults. |
| GitHub | An authenticated CLI identity with target-repository and required settings permissions. | Inspect the repository, open PRs, CI access, environments, and protection settings; configure the approved workflow. |
| Local containers | A usable Docker-compatible runtime; handle any interactive OS prompts that require the user. | Start the installed Docker Desktop when implementation is authorized, run disposable integration suites, and clean up their owned resources. |
| Human acceptance | The contributor's personal results on the deployed candidate and permission for ready/review actions. | Supply exact test instructions and deployment identity; preserve draft status until the source workflow's personal acceptance requirement is met. |

Credentials must be supplied through local files or provider secret stores, not the document, PR, or chat. The user need not choose ordinary package pins, file layout, resource names beyond the project, or every SDK option. The implementer should resolve those from current official contracts and this specification, asking only when evidence requires a change to an accepted decision or access is unavailable.

### 8.2 Technical decisions for the implementer

Before claiming the associated acceptance checks, the implementer must resolve compatible package pins; native Mastra initialization and table ownership; authenticated smoke identity and scope; minimum job/result and retained-file metadata records; native BullMQ attempt accounting; private Valkey networking/TLS/authentication; cross-cloud database connectivity; private GCS location/IAM and native upload/restore integration; required-output persistence failure behavior; sandbox timeout/cleanup; and single-coordinator handoff. Record material trade-offs in their owning ADRs. These details are implementation work within the chosen contracts, not invitations to reopen the selected platform or product scope.

If a native integration cannot meet a required boundary, report the concrete conflict and smallest alternatives before weakening the requirement. Financial-provider credential brokering and retention rights, Bird account approval and provider integration, messaging delivery and human ownership, complete task lifecycle, and product memory behavior remain with their later feature designs. Bird/Apple setup, a WhatsApp provider, and support staffing are not prerequisites for the synthetic scaffold tests.

### 8.3 Authorized actions and delivery boundary

The current task authorizes:

- Implement this scaffold and its docs/tests, including installing the selected tools and configuring local development.
- Create three new delivery branches or isolated worktrees above existing PR #1, make named-path commits, push them, and create/update three stacked draft PRs in `hsignals/ms-agentic-be`, preserving unrelated work.
- Configure this repository's CI, staging environment, deployment variables/secrets, and the merge/protection settings in section 5.
- Create and bill `ms-agentic-staging` and its agreed GCP resources, IAM/federation, networking, private GCS bucket/backend grants, registry, and available secrets; securely copy only the approved OpenAI key. Dedicated Tiger creation/URL and the E2B key are deferred.
- Deploy the bootstrap candidate and verify the available health/deployment boundary. Deliver full migration, model, E2B, storage, and restoration paths in code; dependent live execution remains deferred.
- Complete review corrections and applicable checks, then leave all three new PRs in draft. Keep personal acceptance pending. Ready/review actions, merging, production deployment, destructive replacement, and customer-facing messages are outside this delivery authority.

Routine implementation decisions and in-scope corrections need no fresh approval. Stop affected work for missing access, a required change to the agreed contract, materially higher recurring costs, or the personal acceptance boundary; continue independent authorized work. Report the evidence actually obtained and preserve deferred tests as pending.
