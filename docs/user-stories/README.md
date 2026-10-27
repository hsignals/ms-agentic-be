# Phase 1 user stories

## 1. Scope and status

This catalogue covers the **complete Phase 1 user experience** for the MyStacks personal investing agent. The [requirements](../requirements.md) own accepted product scope. Progressive onboarding, read-only financial information, portfolio understanding, conversational work, ongoing tasks, proactive information, and long-term personalization are part of that scope.

**Detailed stories are proposals for discussion.** Acceptance bullets make intended behavior reviewable; they do not silently settle decisions marked open in the requirements or their owning story document. The [technical designs](../design/README.md) describe supporting responsibilities separately. Milestone sequencing and delivery timing follow product and technical design.

Phase 1 excludes specific buy, sell, or rebalance recommendations and financial execution. Wallet addresses, Binance accounts, and Hyperliquid positions are the required connection categories, with exact supported coverage still open. Additional exchanges and brokerage coverage remain future product directions.

## 2. Complete experience map

| Area | User outcomes | Detailed stories | Technical owner |
| --- | --- | --- | --- |
| Onboarding and account controls | Start on a phone, connect sources progressively, understand access, recover an account, manage connections and data. | [Onboarding](onboarding.md), `US-ONB` | [Onboarding design](../design/onboarding.md) |
| Portfolio understanding | Understand the supported combined portfolio, individual sources, changes, concentration, risks, and data gaps. | [Portfolio](portfolio.md), `US-PORT` | [Portfolio design](../design/portfolio.md) |
| Conversation and research | Ask questions, follow up, research assets, analyze documents and data, receive reports, and continue longer work. | [Assistant](assistant.md), `US-CHAT` | [Runtime design](../design/runtime.md) |
| Ongoing tasks and notifications | Receive digests, delegate flexible recurring work, understand risk information, and control proactive messages. | [Tasks](tasks.md), `US-TASK` | [Task design](../design/tasks.md) |
| Memory and personalization | Retain useful preferences, understand remembered information, correct it, and request forgetting. | [Memory](memory.md), `US-MEM` | [Runtime design](../design/runtime.md) |

These areas are parts of one experience. A user may connect an account from chat, ask about a portfolio change, request a recurring check, correct a preference, and later disconnect a source. The product must preserve consistent authority, evidence, and user control across those transitions.

## 3. Shared experience principles

- **Progressive setup:** users can connect one useful source and add others later. Phone-friendly authorization steps may open the companion website or provider app.
- **Honest coverage:** answers describe the supported, connected or supplied portion of the user's assets. Unavailable data is distinct from a verified zero balance.
- **Consistent evidence:** chat, portfolio views, reports, and notifications use compatible financial facts, source coverage, and freshness information.
- **Useful continuation:** deeper work has understandable progress and outcomes; leaving a conversation does not erase delegated tasks or remembered preferences.
- **User control:** task changes, paused notifications, corrected memory, and disconnected sources must have clear effects. Disconnecting and deleting retained information are distinct actions.
- **Informational authority:** user instructions, remembered preferences, and new skills cannot expand Phase 1 financial authority.

## 4. Decisions to discuss by area

| Area | Product decisions still needed |
| --- | --- |
| Entry and account continuity | Supported messaging channels, login and recovery experience, channel linking, and launch geographic scope. |
| Source connections | Supported networks and account types, visible permissions and exclusions, provider setup, reconnect behavior, and connection limits. |
| Financial meaning | Valuation currency, price sources, performance and cash-flow definitions, risk methods, historical coverage, and claim-specific freshness. |
| Conversation and analysis | Initial-response expectations, continued-work controls, supported uploads and outputs, limits, and artifact access. |
| Proactivity | Digest timing, timezone behavior, notification defaults and consent, repeated-message controls, user-defined task limits, and behavior when budgets are exhausted. |
| Memory and data controls | What is retained, automatic versus explicit updates, inspection and correction, forgetting, export, account deletion, and retention. |

The stories expose these choices with concrete user outcomes. Technology and rollout choices must not silently decide them.
