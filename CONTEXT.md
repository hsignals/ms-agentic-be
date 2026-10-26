# MyStacks backend context

## 1. Purpose and current state

`ms-agentic-be` is the canonical repository for the MyStacks personal investing agent backend. The repository contains product requirements and an **accepted architecture direction**, with no runtime implementation or implementation plan.

The design uses **Mastra as the framework for the shared custom runtime**, durable scheduling and queued execution, and **E2B for isolated generated-code execution**. MyStacks reuses Mastra's agent, skill, tool, context, and memory facilities while owning financial logic and authorization. Orchestration and runtime execution remain separate logical responsibilities. **BullMQ + Redis is the provisional queue choice**; worker hosting and detailed operating policies remain open. Documenting this direction does not authorize implementation or provisioning.

## 2. Document ownership

| Document | Owns |
| --- | --- |
| [Requirements](docs/requirements.md) | Agreed product behavior, Phase 1 authority, and business constraints. |
| [Architecture](docs/architecture.md) | Responsibilities, terminology, interaction flows, state ownership, and open architecture questions. |
| [Runtime and orchestration ADR](docs/ADRS/0001-custom-runtime-and-orchestration.md) | Why runtime executions share workers while orchestration and user context remain separate. |
| [Financial credentials ADR](docs/ADRS/0002-backend-owned-financial-credentials.md) | The agreed boundary between runtime tools and financial account authority. |
| [Code execution ADR](docs/ADRS/0003-sandboxed-code-execution.md) | Why generated code runs in an E2B sandbox through a trusted backend tool. |
| [Scheduling and execution ADR](docs/ADRS/0004-durable-scheduling-and-queued-execution.md) | Why durable schedules trigger shared workers, with BullMQ + Redis as a provisional implementation choice. |
| [Runtime framework ADR](docs/ADRS/0005-mastra-runtime-framework.md) | Why the custom runtime uses Mastra's framework components, with E2B as its execution sandbox. |

## 3. Discussion boundaries

Read the requirements and architecture before extending the design. Keep **accepted decisions**, **provisional technology choices**, **open questions**, and **verified implementation** distinct. The architecture glossary defines “existing agentic runtime” as the shared-machine approach represented by `mystacks-be` and `hs-llm-service`; those references do not establish that the required product is implemented.

Product requirements remain authoritative. Phase 1 provides financial information and analysis with read-only financial access; financial execution and specific investment recommendations remain outside its scope. Architecture decisions must preserve the stated monitoring limits and partial-data behavior.

Monitoring starts with checks every couple of hours or daily, with exact per-task cadence and timezone behavior open. The architecture separates shared backend financial evidence from personalization memory, standing tasks from execution attempts, and inexpensive monitoring from budgeted Mastra analysis. Financial-analysis sandboxes default to outbound internet off; required artifacts persist before disposable sandboxes terminate. Pause is not deletion.

The architecture owns the remaining decisions about package versions and integration, models, worker hosting, durable storage, memory policy, job lifecycle, sandbox configuration, tools, and provider data handling. Vendor documentation is evidence to evaluate, not a guarantee of deployed behavior or approval to send customer data.
