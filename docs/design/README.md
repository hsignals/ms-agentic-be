# Phase 1 technical designs

## 1. Scope and authority

This design set supports the **complete Phase 1 experience** described by the [user stories](../user-stories/README.md). It defines responsibilities, data and authority boundaries, and execution flows. Detailed proposals and unresolved choices are identified in their owning documents.

The [architecture](../architecture.md) and [ADRs](../ADRS/) own the accepted shared Mastra runtime, backend financial authority, durable scheduling with provisional BullMQ + Redis, and E2B generated-code boundary. These designs refine those decisions. The [requirements](../requirements.md) own product authority, supported connection categories, best-effort monitoring, and information quality.

Logical components may share a deployment. This set does not select an implementation schedule, deployment topology, storage engine, model provider, or authentication vendor. Implementation and milestone planning follow agreement on the relevant product behavior and technical contracts.

## 2. Design ownership

| Design | Owns | User-story coverage |
| --- | --- | --- |
| [Onboarding and account connections](onboarding.md) | User and channel binding, connection setup, provider permission validation, reconnect, recovery, disconnect, and proposed account data controls. | `US-ONB` |
| [Portfolio evidence](portfolio.md) | Connector reads, supported coverage, common financial observations, aggregation, valuation and comparison semantics, freshness, and partial results. | `US-PORT`, financial evidence used by every other area. |
| [Runtime and memory](runtime.md) | Conversation execution, skills and protected tools, continued work, uploaded content, E2B analysis, artifacts, and user-scoped memory. | `US-CHAT`, `US-MEM` |
| [Tasks and notifications](tasks.md) | Standing instructions, schedules, attempts, recurring and proactive work, notification eligibility, delivery, and task controls. | `US-TASK`, delivery for continued conversational work. |

Setup and data retrieval have distinct owners: onboarding establishes a connection and its allowed access; portfolio adapters retrieve and normalize evidence under that binding. The runtime and scheduled work consume the same financial operations. Adding providers should reuse identity, evidence, task, memory, and delivery contracts.

## 3. Cross-area contracts to preserve

### 3.1 Identity and authority

The backend establishes user identity and authorizes each protected operation. Runtime context, memory scope, connection selection, artifacts, task ownership, and notification destinations must preserve that binding. Provider and database credentials stay with trusted backend adapters and out of model context, sandbox execution, and traces.

### 3.2 Financial evidence and memory

Current holdings, prices, and permissions come from authorized backend evidence. Personalization memory can guide explanations and relevant context but cannot override those facts. A useful partial response must identify missing coverage; an unknown value is not zero.

### 3.3 Work and delivery

Conversations, user-defined tasks, digests, and independent initiative use common protected tools and delivery controls. Durable work and required results survive worker processes. Schedule eligibility, task intent, execution attempts, and delivery outcomes remain distinct concepts with one authority for each record.

### 3.4 Changes to access and retained data

Disconnecting a source affects future reads and work that depends on it. Pausing or changing a task affects pending execution and delivery according to the agreed task policy. Forgetting memory and deleting an account require coordination across enabled stores; a user-facing completion claim must reflect the actual operation and any disclosed retention limits.

## 4. Design completion criteria

- Each in-scope user journey has a success path, meaningful partial or failure outcomes, and the controls a user needs.
- Each protected action has an owner and a trusted user binding; each durable record has one authority.
- Shared financial evidence supports the portfolio, conversation, and proactive paths without incompatible provider-specific calculations in each consumer.
- Open choices that materially affect behavior, authority, cost, or recovery are explicit rather than hidden in example code or a vendor default.
- Representative verification covers user isolation, partial financial data, actual scheduled eligibility, delivery controls, durable memory, and sandbox execution through their real application boundaries.

These criteria guide design discussion and later targeted implementation checks.
