# Assistant User Stories

## 1. Status and scope

**Status: proposed Phase 1 experience details.** The [requirements](../requirements.md) define accepted product outcomes; these stories propose observable behavior for conversational financial work.

The assistant handles broad requests within **wealth and assets**, combining available information and capabilities without requiring users to choose a fixed intent. Messaging is the primary interaction surface; channels and response-time targets remain open.

Phase 1 provides **read-only financial information and analysis**. It excludes specific buy, sell, or rebalance recommendations and financial execution. The [runtime design](../design/runtime.md) describes the technical boundaries under the accepted [architecture](../architecture.md).

## 2. User stories

### 2.1 US-CHAT-01 — Ask questions and follow up naturally

As a user, I want to ask about my assets in ordinary language so that I can understand my portfolio without learning a command list.

- Questions about holdings, composition, changes, and supported position risks use the available connected or supplied information.
- Follow-up questions can refer to the prior answer; if the reference is unclear, the assistant resolves it before drawing a materially different conclusion.
- The answer identifies the relevant source coverage and freshness, and makes gaps or assumptions that affect the conclusion clear.
- If some sources are unavailable, the assistant provides a useful partial answer and does not treat missing data as zero or an absence of risk.

### 2.2 US-CHAT-02 — Combine research with portfolio context

As a user, I want research that connects relevant information to my assets so that I can understand what may matter to me.

- A request can combine supported portfolio data, relevant research, and calculations instead of returning only a predefined response.
- The assistant names or links the sources supporting material claims and distinguishes reported facts, analysis, and hypothetical outcomes.
- If sources conflict or do not support a requested conclusion, the answer explains that limit without inventing agreement or certainty.
- A report explains relevant exposure or risks while keeping the user's supported, connected or supplied assets distinct from the wider market.

### 2.3 US-CHAT-03 — Resolve ambiguity without needless setup

As a user, I want the assistant to clarify choices that affect my request so that the result answers the question I intended.

- If an unclear asset, account, period, or scenario would materially change the answer, the assistant asks a focused question.
- If a reasonable assumption is enough for useful work, the assistant states it and proceeds within the request's scope.
- If the request needs unavailable data or an unsupported capability, the assistant explains what it can answer and what remains missing.
- If the user corrects the scope or an assumption, the next answer reflects the correction and identifies any earlier conclusion it changes.

### 2.4 US-CHAT-04 — Analyze a supplied document or table

As a user, I want to supply a statement or CSV so that the assistant can explain it and produce a bounded analysis.

- The user can supply a supported statement or CSV and learn which parts were read, which could not be interpreted, and which inputs need clarification.
- The analysis distinguishes supplied information from connected-account evidence, and states relevant dates, values, units, and scenario assumptions.
- When the request calls for a report, table, or calculation file, the user can access an artifact that explains its inputs, method, and limits.
- If parsing or calculation checks fail, the assistant explains the affected result and does not present it as verified; supported findings can still be returned.

### 2.5 US-CHAT-05 — Receive deeper work after an initial answer

As a user, I want useful information while deeper work continues so that I can leave the conversation and return to its outcome.

- For a request needing more work, the assistant gives a useful initial response and clearly identifies what is still being investigated.
- The user can see meaningful progress or the reason work is waiting, and receives the resulting analysis through an authorized product surface after leaving the conversation.
- If work fails or reaches a limit, the user sees that outcome, any useful completed findings, and whether further action is needed; a failed attempt is not shown as complete.
- **Proposed cancellation control:** the user can request that continued work stop and see whether the request was accepted and when work has stopped. Handling of in-flight work and already-delivered results remains open.

### 2.6 US-CHAT-06 — Understand the assistant's authority

As a user, I want clear boundaries so that I can tell which financial help the assistant can provide.

- The assistant supports relevant informational work across wealth and assets, including explanations, research, hypothetical scenarios, and reports.
- If asked which specific asset to buy, sell, or rebalance, the assistant explains the boundary and can provide relevant factual information, risks, or user-defined scenarios.
- If asked to place an order, transfer assets, or perform another financial action, the assistant explains that Phase 1 cannot carry out the action and never claims it did.
- If asked for unrelated work, the assistant briefly explains the domain boundary; adding a new capability does not change these limits.

## 3. Observable acceptance examples

These examples exercise the stories without limiting the assistant to a fixed request catalog.

| Situation | Observable result |
| --- | --- |
| The user asks about total exposure, then asks which source contributes most. | The follow-up uses the same understood scope and explains each source's contribution. |
| One connected source is unavailable during research. | The answer identifies the missing source and still provides supported findings. |
| “How did I do?” could mean a balance change or investment performance. | The assistant resolves the distinction needed for a meaningful answer. |
| A supplied CSV contains an unclear unit or an unreadable row. | The answer identifies the affected input and limits the calculation accordingly. |
| Deeper analysis continues after the user leaves chat. | The user can later find the outcome and distinguish completion, partial completion, and failure. |
| A user requests a specific trade or an unrelated sports report. | The assistant states the applicable boundary and makes no claim of execution. |

## 4. Open decisions

- **Interaction:** messaging channels, follow-up context limits, progress presentation, and response-time targets.
- **Research:** supported sources, access methods, source attribution format, and claim-specific freshness requirements.
- **Uploads and artifacts:** supported formats, file and analysis limits, artifact formats, access duration, and retention.
- **Continued work:** routing, delivery, cancellation, retry and replay behavior, interrupted-work recovery, and resource budgets.

The [portfolio stories](portfolio.md), [task stories](tasks.md), and [memory stories](memory.md) cover the connected experience, ongoing requests, and personalization alongside these conversations.
