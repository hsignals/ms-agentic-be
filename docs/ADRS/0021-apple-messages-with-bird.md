# Apple Messages for Business through Bird

## 1. Status and scope

**Status: ACCEPTED.** Bird is the primary Messaging Service Provider (MSP) for MyStacks' own Apple Messages for Business account. **iMessage** is the product shorthand for this channel. The technical integration is Apple Messages for Business through Bird, with native provider APIs and webhooks. Exact Bird product/API version, account configuration, and webhook integration remain open. The overall architecture remains tentative beyond its accepted decisions.

This record owns the Apple provider choice, channel capability scope, and backup-plan limits. MyStacks retains its backend Mastra runtime, memory, scheduling, and delivery authorization. Bird carries channel messages rather than owning the assistant runtime. The [account identity decision](0014-stable-account-and-independent-channel-links.md) owns separate account and channel verification, and the [human-support decision](0022-human-support-conversation-ownership.md) owns conversation ownership and the Apple staff interface.

## 2. Decision

### 2.1 Primary Apple provider and account boundary

Use Bird as the primary Apple MSP. Apple requires an approved MSP for automation, and Bird identifies itself as an Apple MSP. Business verification alone does not grant direct Apple API access. [Apple integration requirements](https://register.apple.com/resources/messages/messaging-documentation/faq), [Bird MSP offering](https://bird.com/en-nl/channels/amb)

Apple supplies an opaque customer identifier for the business. A phone number, email address, or that opaque identifier alone does not authenticate a MyStacks account; separate channel verification binds it to the authenticated website account. Bird's send API addresses the Apple business and opaque customer identifiers within an existing open conversation. An accepted API submission does not establish delivery. [Bird send contract](https://bird.com/docs/api/reference/create-amb-message)

### 2.2 Channel priority and supported work

iMessage is the priority channel. Supported capabilities remain subject to the channel's permissions and the validated notification scope.

| Capability | iMessage | WhatsApp |
| --- | --- | --- |
| User-initiated chat | Supported | Supported |
| One-off requested analysis and background work | Supported | Supported |
| User-created scheduled tasks and their reports | Supported | Deferred |
| Proactive investigations and reports | Supported when eligible and enabled | Deferred |
| WhatsApp template messaging | Not applicable | Deferred |

The account-wide **proactive insights** setting enables or disables eligible linked iMessage only. It defaults to enabled, subject to applicable channel permissions. WhatsApp cannot be selected, and linking it does not enable proactive work. No proactive investigation starts without an eligible automated-delivery destination. The website and supported chat controls change the same account setting.

WhatsApp scheduling, proactive work and reports, and template messaging remain deferred even while a reply window is open. When asked to schedule work in WhatsApp, explain the limit and direct the user to linked iMessage. WhatsApp cannot create or manage iMessage tasks, and work must not be automatically retargeted. Normal WhatsApp sends still follow the provider's messaging window; this decision adds no out-of-window notification or recovery flow.

This Apple provider choice does not select a WhatsApp transport or staff integration. Privy with Twilio Verify remains the separate website phone-authentication choice.

### 2.3 Photon as a backup integration plan

Retain Photon as a backup integration plan. Its documentation describes messaging integrations while keeping the agent's logic in the application. It does not establish MyStacks' deployment eligibility or approval. [Photon offering](https://photon.codes/docs/beta/photon)

The backup plan does not authorize building both integrations, automatic provider failover, or a promise that the same sender identity, number, or conversation thread can migrate. Photon suitability, applicable Apple approval, and continuity require validation if the backup plan is activated.

## 3. Rationale and alternatives

**Bird supplies the required Apple transport and staff channel.** Its documented integration connects a separately hosted assistant through the Apple Messages API and places human replies in Conversations. This fits MyStacks' existing backend ownership while providing the Apple staff interface. The trade-off is dependence on Bird's account setup, APIs, delivery contract, and service availability. [Bird assistant and staff integration](https://bird.com/docs/guides/apple-messages/ai-conversations)

**Channel scope follows the current product priority.** iMessage receives schedules and proactive reports while WhatsApp retains useful chat and requested analysis. WhatsApp's free-form reply window and template requirements add a separate delivery contract. Deferring those capabilities accepts less feature parity and asks users to open linked iMessage for schedules. Twilio's documentation explains the window and template distinction; it does not select Twilio as MyStacks' WhatsApp transport. [WhatsApp messaging window](https://www.twilio.com/docs/whatsapp/quickstart)

**A direct Apple integration cannot replace the MSP boundary.** An approved business account still needs the selected provider. Moving assistant state and scheduling into a provider would also split ownership from the accepted backend runtime without meeting a current requirement.

**An inactive backup keeps the primary path focused.** Building a second transport or automatic failover would require additional routing, ownership, and conversation-continuity decisions. Retaining Photon as a plan accepts provider interruption while those details remain unvalidated.

## 4. Consequences and open provider details

- **Apple readiness:** complete account approval and experience review with Bird. Provider selection does not mean the MyStacks experience is already approved.
- **Financial notifications:** validate the exact permitted financial notification scope, required notices, and opt-outs. Apple's support for some proactive notifications does not approve MyStacks' financial use case. Closed conversations and customer opt-outs constrain eligibility. [Apple notification rules](https://register.apple.com/resources/messages/messaging-documentation/faq)
- **Integration:** select the exact Bird product/API version, API and webhook configuration, identifier mapping, delivery-status integration, and provider-supported retry controls. Preserve the existing uncertain-send policy and backend authorization.
- **Support:** Apple uses Bird Conversations under the ownership contract in the human-support decision. Staffing, published hours and timezone, and response expectations remain open; WhatsApp support integration still needs selection and validation.
- **Identity:** Apple opaque identifiers remain delivery bindings, separate from authenticated account identity and financial-source authorization. The existing linking security boundary remains required.
- **Backup:** validate Photon only if the backup plan is needed; no automatic migration or same-thread continuity is promised.
