# Human support and conversation ownership

## 1. Status and scope

**Status: ACCEPTED.** The MyStacks backend enforces one active reply owner for each channel conversation. Human takeover pauses automated replies, and staff explicitly return control to the assistant. Apple support staff use Bird Conversations. Exact ownership records, staff actions, and provider event integration remain open; the overall architecture remains tentative beyond its accepted decisions.

Human support remains available in the originating channel during published support hours, with visible hours and timezone and a truthful pending state until a person joins. Outside those hours, the user sees the next opening and how the request or contact will be handled, without an unagreed response-time promise. Staffing, hours, response expectations, and SLAs remain open. Human support is also required for WhatsApp, but selecting Bird for Apple does not select WhatsApp's transport or staff integration.

## 2. Decision

### 2.1 Backend-enforced reply ownership

The backend determines whether automation or a human may reply to a conversation. When a human takes over, the live integration must pause automated replies before staff reply, including a reply being prepared when takeover occurs. A new inbound customer message or repeated webhook cannot silently resume the assistant. Staff must explicitly return ownership to automation.

Bird documents this separation for an application's own assistant integration: the application receives messages and sends API replies, staff reply through Conversations, and the live runtime enforces the ownership pause and return. MyStacks applies that contract through its backend rather than relying on a prompt instruction. [Bird ownership guidance](https://bird.com/docs/guides/apple-messages/ai-conversations)

The user must be able to distinguish human and AI replies. Staff receive only the issue and necessary authorized account and originating-channel context. A handoff cannot expose another channel's history, tasks, or results, and it grants no trading, money-movement, or other financial execution authority.

### 2.2 Requested work continues while delivery waits

During human ownership, running one-off requested analyses and user-created schedules continue and save their results. Automated replies and task reports wait. Handoff does not cancel or restart requested work, and it adds no separate cancellation or restart protocol.

Proactive investigations do not start while the channel is unavailable for automated delivery. Results from a proactive investigation already running must not interrupt the human conversation. On explicit return to automation, the main agent may consider them only if they remain useful and eligible.

### 2.3 Explicit return through the main agent

After staff explicitly return control, the main agent handles pending results through the normal channel completion path and owns any reply. It uses the actual result timestamps and current financial evidence, judges usefulness, and avoids presenting an older observation as current. Saved requested results remain available under their existing task and access contracts.

Handback does not bypass current account, connection, channel, delivery, or notification-permission checks. The proactive insights setting and channel eligibility still govern proactive delivery. The [task design](../design/tasks.md) owns work lifecycle, completion recovery, and uncertain-send behavior; handoff adds a reply-ownership pause to that flow.

### 2.4 Apple staff interface and WhatsApp boundary

Use Bird Conversations as the staff interface for Apple Messages for Business, with MyStacks enforcing reply ownership. Apple requires a live-agent escalation path alongside automation. Selecting the staff interface does not establish staffing or readiness. [Apple live-support requirement](https://register.apple.com/resources/messages/messaging-documentation/faq)

WhatsApp must preserve the same user-facing human-support and account/channel boundaries. The shared ownership contract can apply there, but its transport, staff interface, and integration remain open. Bird's Apple selection alone does not settle them.

## 3. Rationale and alternatives

**One explicit owner prevents conflicting replies.** A user asking a person for help must not receive competing assistant answers. A pause enforced by the backend covers inbound messages and pending task completions, while explicit staff handback makes the return deliberate. A timer, a repeated event, or the next user message cannot tell whether staff have finished. The trade-off is that staff must return control and delayed automated replies remain pending until they do.

**Reply ownership and useful analysis have different lifecycles.** Stopping the entire runtime or cancelling requested work would discard useful progress and alter user-created schedules merely because staff joined. Keeping that work running preserves the request while accepting delayed reports. Proactive work can wait because it was not a requested occurrence; already-running findings may lose relevance before handback, so the main agent may withhold them after reviewing usefulness and eligibility.

**Bird Conversations fits the selected Apple integration.** Its documented staff interface avoids choosing another Apple support tool while the application retains the assistant and authorization boundaries. The accepted trade-off is provider-specific handoff integration. Reusing that choice for WhatsApp without validating its transport and staff flow would settle a separate decision without evidence.

## 4. Consequences and open integration details

- **Staff operations:** publish support hours and timezone, assign staffing, and define response expectations and out-of-hours handling. A forwarded request remains pending until a person joins.
- **Ownership integration:** map Bird staff takeover and explicit handback actions to backend-enforced ownership. Validate takeover during an in-flight assistant turn and show that new inbound messages and repeated events cannot resume automation.
- **Pending results:** verify that requested work and schedules save results during takeover, task reports wait, and explicit return routes results through the main agent with their actual times and required authorization checks.
- **Proactive work:** verify that unavailable automated delivery prevents new investigations and that an already-running result cannot interrupt staff.
- **Context access:** keep staff context within the authorized account and originating channel, with identifiable human and AI replies and unchanged financial authority.
- **WhatsApp support:** select and validate its transport, staff interface, and ownership integration independently of Bird's Apple role.
