# MyStacks 2.0 Requirement Spec

MyStacks aims to become a **personal investing agent**. It must provide professional, personalized assistance that helps users understand their combined portfolio and make better-informed decisions.

- **Phase 1** focuses on financial information, analysis, and proactive monitoring through read-only access to connected assets.
- **Phase 2** introduces execution as a separate product expansion.

These requirements define the intended product behavior and business context. They do not claim that the capabilities are implemented or select an architecture, runtime, hosting service, or integration technology.

The [user stories](user-stories/README.md) develop the complete Phase 1 experience. The [technical designs](design/README.md) describe how the accepted architecture can support those stories, with detailed product and implementation choices still open.

## 1. Purpose and users

### 1.1 Primary outcome

Users must be able to understand their holdings, positions, performance, and risks across supported sources as one portfolio. Personalized research and proactive information must support that understanding.

The assistant must handle broad requests **within wealth and assets**, rather than require users to choose from a fixed list of intents. It must remain focused on that domain and decline unrelated work, such as researching recent NBA games.

### 1.2 Intended users

The product must serve:

- Self-directed investors with assets across wallets and exchanges.
- Active traders managing leveraged positions.
- Long-term investors with crypto and traditional assets.

Audience scope is broader than initial data coverage. Serving a user with traditional assets does not imply that every brokerage connection is available in Phase 1.

## 2. Product phases and authority

### 2.1 Phase 1 informational scope

The assistant must explain holdings, portfolio changes, risks, and options using available evidence. It may research assets, analyze supplied documents, calculate hypothetical scenarios, and produce reports.

Phase 1 must exclude **specific buy, sell, or rebalance recommendations** and **execution of financial actions**. For example, the assistant may explain how a market decline would affect a portfolio, but must not turn that analysis into an instruction to sell a particular asset.

**Read-only access** applies to financial accounts and assets. The assistant may still create reports, retain user-specific memory, maintain informational tasks, and send messages within the product scope.

### 2.2 Phase 2 direction

Phase 2 is intended to introduce **smart accounts and automated financial actions**. Its execution authority, approval requirements, and action limits remain undecided.

Specific investment recommendations remain deferred pending the business's **licensing decisions and requirements**. Execution and investment recommendations require **separate scope decisions**; Phase 2 does not settle both together.

## 3. Connected assets and unified portfolio

### 3.1 Coverage

**Phase 1 coverage** must include on-chain wallet addresses, Binance accounts, and Hyperliquid positions. Connections must support the informational experience without requiring financial execution authority.

**Future coverage** is intended to include additional centralized exchanges, such as OKX, and traditional brokerage accounts. The exact supported chains, protocols, account types, instruments, and connection methods remain open.

### 3.2 Portfolio understanding

The assistant must combine available holdings and positions across supported connections into a coherent portfolio view. Users must be able to ask about the combined portfolio and understand the contribution of individual sources.

“Full portfolio” means the **supported, connected or user-supplied portion** of the user's assets. It must not imply knowledge of accounts or assets the user has not connected or supplied.

The experience must support questions about:

- Total holdings and positions across connections.
- Portfolio composition and concentration.
- Portfolio changes, including changes over 24 hours.
- Position risks, including proximity to liquidation where supported data is available.

These are examples of required outcomes, not a complete intent catalog. Valuation, performance calculations, and the treatment of deposits and withdrawals require further definition.

## 4. Conversational experience and personalization

### 4.1 Open-ended financial work

The assistant must interpret requests expressed in natural language and **combine available capabilities** to complete informational work within wealth and assets. Supported work must extend beyond retrieving a single predefined answer.

Examples include researching an asset, interpreting an uploaded statement, calculating a portfolio scenario, and producing a report that combines account information with relevant research. When a request is materially ambiguous, the assistant should clarify what the user wants. When available capabilities or evidence are insufficient, it must explain that limit.

Adding a relevant skill or tool should let the assistant handle new requests **without requiring a new hard-coded intent** or rewriting the general system prompt for each feature. The product's domain and authority boundaries must continue to apply to new capabilities.

### 4.2 Interaction surfaces and responsiveness

**Messaging** must be the primary interaction surface. A **companion website** must support connecting accounts and viewing portfolios. The specific messaging channels and detailed website experience remain open.

Onboarding must be progressive and usable on a phone. Users may connect one useful source and add others later; account setup and authorization may use mobile web or provider apps. The detailed entry, authentication, and channel-linking experience remains open.

For difficult research or analysis, the assistant should provide a **useful initial response quickly** and continue deeper work afterward. It must make clear when work is ongoing and provide the resulting analysis when it is ready. Exact response-time targets remain open.

### 4.3 Long-term personalization

The assistant must retain **user-specific knowledge across conversations** so that its understanding and customization improve over time. Memory must support continuity beyond the current conversation.

The selection, storage, and updating of remembered information remain design decisions. User-facing controls for inspecting, correcting, or forgetting memory also remain undecided. Remembered information must not expand the assistant's Phase 1 authority or override current account evidence.

## 5. Proactive information and ongoing tasks

### 5.1 Risk alerts and daily digests

The product must support **proactive risk alerts** and a **daily morning portfolio digest**.

Risk alerts must communicate relevant, evidence-based information about the user's assets or positions. Examples include a leveraged position approaching liquidation or a substantial decline affecting a concentrated portfolio holding.

The morning digest must summarize portfolio changes and explain information relevant to the user's portfolio. Digest timing, timezone behavior, and detailed content remain open.

### 5.2 User-defined ongoing tasks

Users must be able to delegate **ongoing informational tasks in natural language**, such as asking the assistant to watch portfolio concentration and report material changes. These tasks must be flexible within wealth and assets rather than limited to a fixed catalog.

Each task must durably retain its **intent, current status, user, trigger, and delivery destination**. This standing request must remain distinct from individual execution attempts and their outcomes.

The assistant must keep ongoing work within the same domain and informational boundaries as conversational work. It must explain when a requested task falls outside that scope or cannot be supported.

### 5.3 Independent initiative and user control

Beyond explicit user tasks and standard alerts, the assistant may **independently surface information** it judges relevant to the user's portfolio. Such messages must be **evidence-based, useful, and low-noise**.

Users must be able to **change or pause** ongoing tasks and proactive notifications. The interface for those controls remains open.

Before delivering task results, the product must respect **current permissions, task status, and delivery destination** rather than rely only on the state captured when work was queued. Policies for task edits or pauses during execution, retries, and repeated delivery must be explicit; their detailed behavior remains open.

### 5.4 Monitoring target and accepted limits

Phase 1 starts with monitoring checks **every couple of hours or daily**. Exact cadence and timezone behavior remain open for each task. Checks and delivery are **best effort** rather than high-frequency or comprehensive. Some qualifying events, including approaching liquidation, may be missed within the accepted Phase 1 operating limits.

**Precision takes priority over recall**: avoiding incorrect alerts matters more than detecting every qualifying event. The assistant must also minimize unnecessary or repetitive notifications. Numeric precision targets, risk thresholds, and alert-frequency limits remain open.

Routine monitoring should use inexpensive checks. Monitoring and deeper analysis must operate within resource budgets; the limits remain open.

## 6. Information quality and transparency

### 6.1 Evidence and uncertainty

The assistant must ground portfolio statements, calculations, and risk claims in **available evidence**. It must distinguish reported information from assumptions, hypothetical scenarios, and uncertain conclusions. It must not invent holdings, positions, prices, or execution outcomes.

Financial evidence must identify its **source, as-of time or unknown freshness, coverage gaps, and native values and units**. Conversions and aggregation must preserve enough of that evidence to explain the result. The portfolio website, chat, reports, and digests must use consistent backend financial evidence. Personalization memory remains separate and must not become the source of current holdings, prices, or account permissions.

The informational scope applies equally to requested answers, generated reports, scheduled work, and unsolicited messages. Professional behavior must come from accurate explanations, relevant information, and clear limits rather than confidence unsupported by evidence.

### 6.2 Incomplete or stale data

When some data is stale or unavailable, the assistant must answer with the available information and clearly identify **freshness, missing accounts, and uncertainty**. It must label a partial portfolio view as partial and must not represent unavailable data as a **zero balance or absence of risk**.

Useful partial information is preferable to withholding an answer until every connected source is current. The answer must make its coverage clear enough for the user to interpret it correctly.

## 7. Product priorities and business constraints

### 7.1 Priorities

| Area | Required priority |
| --- | --- |
| Core value | Unified portfolio understanding and better-informed decisions. |
| Flexibility | Broad informational work within wealth and assets. |
| Authority | Read-only financial access and informational outputs in Phase 1. |
| Proactivity | Relevant, evidence-based, low-noise information, including user-defined ongoing tasks. |
| Monitoring | High precision ahead of comprehensive recall; best-effort timing. |
| Responsiveness | A useful initial response, followed by deeper work when needed. |
| Continuity | User-specific knowledge that improves assistance over time. |
| Data gaps | Transparent partial answers rather than unsupported completeness claims. |

### 7.2 Scale and unresolved business constraints

Launch planning assumes **1,000 users**, with a growth target of **100,000 users**. Whether these counts refer to registered or active users remains undefined. Phase 2 authority remains a separate product decision.

Operating cost per user, monetization, geographic scope, and other commercial constraints remain undecided. The user target is product context, not a detailed rollout schedule.

## 8. Observable acceptance examples

These examples define product behavior without prescribing an implementation or limiting the request space.

| Situation | Expected behavior |
| --- | --- |
| A user connects a wallet and Binance, then asks for total holdings and positions. | The assistant presents a combined portfolio and identifies its source coverage. |
| The user has a supported leveraged position approaching liquidation. | When monitoring detects a sufficiently supported risk, the assistant sends an informational alert, subject to the best-effort timing and recall limits. |
| The user receives a morning digest. | The digest explains portfolio changes and relevant developments using available data, with any gaps made clear. |
| The user requests a financial research task requiring several steps. | The assistant gives a useful initial response, continues the work, and returns the resulting analysis or explains a limitation. |
| The user asks for an ongoing portfolio-concentration watch. | The assistant can establish and maintain an in-scope informational task that the user can change or pause. |
| The user returns in a later conversation. | Relevant user-specific knowledge improves continuity and personalization. |
| One connected source is unavailable. | The assistant answers with the available information and identifies the missing source and uncertainty. |
| The user asks which specific asset to buy or sell. | The assistant explains relevant information, risks, and options while staying outside specific investment recommendations. |
| The user asks for research on unrelated sports results. | The assistant declines the unrelated task and keeps its work within wealth and assets. |
| A relevant new skill or tool becomes available. | The assistant can use it for applicable requests without requiring a separately enumerated intent for each new workflow. |

## 9. Open decisions

| Area | Still to determine |
| --- | --- |
| Data coverage | Exact chains, protocols, account types, instruments, and supported position details. |
| Portfolio measures | Valuation currency, performance definitions, and treatment of external cash flows. |
| Alert evaluation | Risk definitions, numeric precision targets, freshness requirements by claim, and notification-frequency controls. |
| Interaction details | Messaging channels, task cadence and timezone behavior, digest scheduling, task-management interface, and response-time targets. |
| Task behavior | Policies for edits or pauses during execution, retries, repeated delivery, and resource-budget limits. |
| Memory | Which information to retain, how to keep it useful and current, and user-facing memory controls. |
| Business and data policy | Cost, monetization, geographic scope, retention, and applicable licensing requirements. |
| Phase 2 | Supported actions, smart-account experience, execution authority, automation limits, and approval behavior. |
| Architecture | Refine the [Mastra and E2B design](architecture.md), including the provisional queue choice, worker hosting, persistence, sandbox configuration, and operating policies. |

Future architecture decisions must be evaluated against these outcomes and accepted limits.
