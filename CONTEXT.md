# MyStacks backend context

## 1. Purpose and current state

`ms-agentic-be` is the canonical repository for the MyStacks personal investing agent backend. The repository contains agreed product requirements, selected architecture components, and a **tentative overall architecture** for joint review, with no runtime implementation or implementation plan.

The design uses **Mastra as the framework for the shared custom runtime**, durable scheduling and queued execution, and **E2B for isolated generated-code execution**. MyStacks reuses Mastra's agent, skill, tool, context, and memory facilities while owning financial logic and authorization. Orchestration and runtime execution remain separate logical responsibilities. **BullMQ + Redis is the provisional queue choice**; worker hosting and detailed operating policies remain open. Documenting this direction does not authorize implementation or provisioning.

## 2. Document ownership

| Document | Owns |
| --- | --- |
| [Requirements](docs/requirements.md) | Agreed product behavior, Phase 1 authority, and business constraints. |
| [Architecture](docs/architecture.md) | Tentative overall responsibilities, terminology, interaction flows, state ownership, and questions for the architecture design round. |
| [Runtime and orchestration ADR](docs/ADRS/0001-custom-runtime-and-orchestration.md) | Why runtime executions share workers while orchestration and user context remain separate. |
| [Financial credentials ADR](docs/ADRS/0002-backend-owned-financial-credentials.md) | The agreed boundary between runtime tools and financial account authority. |
| [Code execution ADR](docs/ADRS/0003-sandboxed-code-execution.md) | Why generated code runs in an E2B sandbox through a trusted backend tool. |
| [Scheduling and execution ADR](docs/ADRS/0004-durable-scheduling-and-queued-execution.md) | Why durable schedules trigger shared workers, with BullMQ + Redis as a provisional implementation choice. |
| [Runtime framework ADR](docs/ADRS/0005-mastra-runtime-framework.md) | Why the custom runtime uses Mastra's framework components, with E2B as its execution sandbox. |
| [Agent capabilities ADR](docs/ADRS/0006-composable-agent-capabilities.md) | Why reusable backend tools and sandboxed analysis provide flexible agent capabilities, with a credential-injecting API proxy as a future option. |
| [Verified EVM connections ADR](docs/ADRS/0007-verified-evm-wallet-connections.md) | Why EVM portfolio tracking requires wallet-control verification through SIWE, with challenge expiry separate from the connection lifetime. |
| [Channel scope ADR](docs/ADRS/0008-channel-scoped-work-and-shared-memory.md) | Why personal memory and financial connections are shared while conversations, jobs, tasks, and results stay channel-scoped. |
| [User stories](docs/user-stories/README.md) | Accepted user experiences, remaining proposals, and open product decisions for the complete Phase 1 scope. |
| [Technical designs](docs/design/README.md) | Tentative contracts and flows discussed alongside user stories, to be finalized together in the architecture design round. |

## 3. Discussion boundaries

Read the requirements and architecture before extending the design. Keep **accepted decisions**, **provisional technology choices**, **open questions**, and **verified implementation** distinct. The architecture glossary defines “existing agentic runtime” as the shared-machine approach represented by `mystacks-be` and `hs-llm-service`; those references do not establish that the required product is implemented.

Product requirements remain authoritative. Phase 1 provides financial information and analysis with read-only financial access; financial execution and specific investment recommendations remain outside its scope. Architecture decisions must preserve the stated monitoring limits and partial-data behavior.

EVM wallet onboarding requires connecting a wallet on the companion website and signing a readable SIWE message before the backend saves a verified EVM connection or imports holdings. The [onboarding design](docs/design/onboarding.md) owns the one-time challenge and verification flow. Routine monitoring uses the established connection without repeated signatures; challenge expiry does not end tracking. Supported wallet types and networks remain open.

Monitoring starts with checks every couple of hours or daily. Device timezone is captured once during website onboarding. Users explicitly change their default in the web app or chat; an explicit task timezone overrides only that task. Existing tasks keep their assigned zone unless edited, and confirmations show time and timezone. Re-detection on later website visits is deferred; exact recurrence and daylight-saving mechanics remain open. The architecture separates shared backend financial evidence from personal memory, standing tasks from execution attempts, and inexpensive monitoring from budgeted Mastra analysis. Financial-analysis sandboxes default to outbound internet off; required outputs persist before disposable sandboxes terminate. Pause is not deletion.

The core Phase 1 user-story discussion is complete. The next design round reviews the overall architecture against those stories; provider-dependent coverage and calculations, technical limits, retention, and implementation mechanisms still need decisions. Low-priority and deferred capabilities retain their stated scope. User stories and technical design remain separate, and architectural mappings stay tentative until jointly finalized. Update documentation in requested batches. Milestone sequencing and delivery timing follow architecture agreement.

Signup uses phone/SMS verification before channel linking and optional financial connections. Name, goals, and preferences are optional. A primary verified login phone number belongs to a stable MyStacks account. iMessage and WhatsApp are linked through prepared messages opened by buttons on phone or desktop, with copy fallbacks; QR linking and WhatsApp-based login are deferred. The [onboarding](docs/design/onboarding.md) design owns tentative identity, linking, and recovery mechanics.

Chat is the default assistant surface. The persistent website dashboard gives new and returning users the same Add account flow, portfolio preview, Add more, and Continue to chat. Financial-source removal, messaging-channel links, and preferred proactive-channel routing are website controls. Chat links users to those controls and answers portfolio questions on request. The website asks users to reconnect only when provider access requires their action; supported renewal is automatic, while temporary outages remain unavailable states.

All Phase 1 answers and reports are text-first, concise, precise, and readable in chat. Lead with the finding, key numbers, and necessary explanation or evidence, then support deeper detail through follow-ups. Substantial research, calculation, and background execution can support concise output. Image replies are low priority; extensive deep-research reports and polished website report artifacts are deferred.

Personal memory and financial connections are shared across the account. Conversation history, current context, compaction, background jobs, scheduled tasks, and results stay within their originating channel. Chat can list or manage only that channel's work. Useful personal facts may carry across conversations; shared memory must not become a copy of channel transcripts or task records. The [runtime design](docs/design/runtime.md) owns tentative Mastra mapping and enforcement.

Clear new user statements update older personal facts automatically. Unclear conflicts require clarification when they materially affect the answer; assistant interpretations remain distinguishable from user-confirmed facts. These UX rules preserve current financial evidence as authoritative and leave storage, concurrent-write ordering, and retention mechanisms for architecture design.

Scheduled tasks deliver only to their originating channel. Edits affect future runs; pause holds future work and unsent automatic results, resume uses the next scheduled occurrence without a backlog, and cancellation requests that active work stop. Channel disconnection pauses its tasks without rerouting. Financial-source disconnection allows a task to continue only if remaining authorized data fulfills its request; otherwise pause it and explain why once. Restoring a channel or source leaves affected tasks paused until the user resumes them from their originating channel. Proactive insights instead use the first linked channel as their initial preference, with a website-visible fallback to the remaining channel if disconnected. Their account-wide chat on/off setting is preserved when no destination remains. The [task design](docs/design/tasks.md) owns these lifecycle and delivery contracts.

Proactive insight selection prioritizes high precision and accepts lower recall to avoid spam. The user's portfolio, goals, and remembered interests guide relevance; strong evidence and attention criteria must justify a meaningfully new, useful message. Stay quiet when nothing qualifies and suppress uncertain, minor, repetitive, or low-value findings. Explicitly scheduled updates follow their requested behavior independently. Numeric thresholds and evidence mechanisms remain design work.

Portfolio display defaults to USD while preserving native quantities. Phase 1 uses provider data and best-effort code-based calculations without a MyStacks indexer; common calculation definitions serve website, chat, and scheduled work, while E2B supports flexible analysis. Balance changes and investment returns remain distinct, with cash-flow separation when evidence supports it. Exact formulas, metrics, and any later historical or indexing infrastructure follow demonstrated provider coverage and product needs.

The [user-story catalogue](docs/user-stories/README.md) owns priorities. Hyperliquid, file analysis, image replies, alternate display currencies, phone-number changes, recovery, and live steering are low priority. Account deletion, cross-channel work, automatic timezone re-detection, deep-research reports, and website report artifacts are deferred; export remains proposed. Memory inspection, correction, and forgetting retain their accepted account-wide scope.

The architecture owns the remaining decisions about package versions and integration, models, worker hosting, durable storage, memory policy, job lifecycle, sandbox configuration, tools, and provider data handling. Vendor documentation is evidence to evaluate, not a guarantee of deployed behavior or approval to send customer data.
