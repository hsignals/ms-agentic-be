# Stable accounts and independent channel links

## 1. Status and scope

**Status: ACCEPTED Phase 1 identity direction.** MyStacks uses Privy with Twilio Verify for website phone signup and login, a stable internal account, and independently verified messaging-channel links. Exact provider-profile mapping, channel verification, and recovery mechanisms remain open.

The [requirements](../requirements.md#44-signup-and-channel-continuity), [onboarding stories](../user-stories/onboarding.md), and [onboarding design](../design/onboarding.md) own the detailed behavior and authority boundaries.

## 2. Decision

### 2.1 Stable account and required phone credential

A stable internal MyStacks account UUID owns the user's connections, conversations, personal memory, preferences, tasks, and results. A unique `privy_user_id` maps the authenticated Privy identity to that UUID. The primary phone number is a verified login credential rather than the account identity: each account has one primary verified number, and a number belongs to one account at a time. Website signup and login require an SMS code. Name, goals, and preferences do not block signup.

Successful signup opens the persistent website dashboard. Financial connections are optional, and users may connect sources and link channels in either order. Assistant chat requires a separately verified linked channel.

### 2.2 Independent channel and financial authority

iMessage and WhatsApp each require their own verified link to the authenticated account, including when a provider exposes a sender phone that matches the primary login number. The dashboard offers QR codes, direct buttons, and a copyable linking-message fallback; opening or scanning a link does not establish verification. Matching phone numbers or email addresses must not implicitly link or merge accounts or channels.

Apple Messages for Business identifies a customer through an opaque identifier for the business, rather than exposing their phone number or email. That identifier routes channel messages; it does not authenticate a MyStacks account. The authenticated website account and verified channel-link operation must establish the separate binding. [Apple identity contract](https://register.apple.com/resources/messages/messaging-documentation/faq)

MyStacks login, channel verification, and financial-source authorization remain distinct. A wallet-control signature or provider connection does not replace account authentication or grant financial execution authority.

### 2.3 Privy phone authentication and account creation

Privy owns the phone-authentication identity, sessions, and access-token refresh; Twilio Verify delivers and checks the SMS OTP through Privy. Use project-owned Privy and Twilio resources and configuration. Phone login does not require an embedded wallet. The selected production plan, contract, and country coverage require validation; Privy's [SMS setup documentation](https://docs.privy.io/recipes/dashboard/login-methods/sms-whatsapp) documents BYO Twilio for Scale and Enterprise accounts.

On each authenticated API request, the backend uses Privy's native SDK to verify the access JWT against the expected application, issuer, signature, and expiry, then resolves its subject through the unique `privy_user_id`. The first authenticated request creates the internal account idempotently if it is absent; concurrent first requests must resolve to the same UUID. Account usability does not depend on a preceding webhook. The verified phone comes from trusted Privy identity data, not a request-body phone field. The exact user-profile API or verified identity-token mapping remains open. [Privy access tokens](https://docs.privy.io/authentication/user-authentication/access-tokens)

The [phone-auth reference](https://github.com/hsignals/mystacks-twilio-poc/blob/main/docs/auth-for-backend.md) is reported tested by the user and serves as a working integration reference. Official provider contracts and MyStacks authority boundaries govern the implementation; browser mocks and connection timers do not establish production backend behavior.

## 3. Rationale and alternatives

**The account preserves user control and continuity.** A channel-native account would make initial entry simpler, but would tie durable state to a messaging identity and complicate using both launch channels or changing login details. A stable account allows those bindings to change without replacing the user's account.

**Privy and Twilio Verify keep phone identity and OTP handling with their providers.** The backend verifies native provider tokens and maps them to its own UUID instead of implementing OTP or using a mutable phone as its durable key. Creating the account on the first authenticated request avoids a webhook dependency in the usable-account path. The trade-off is provider availability, plan, and country eligibility that MyStacks must validate.

**The trade-off is additional verification and account management.** Required phone signup and separate channel linking add setup steps compared with accepting a channel sender or matching phone as identity. They keep login, message delivery, and financial access under explicit, separate authority.

## 4. Consequences and open choices

- **Continuity:** an authorized phone change preserves the account ID and its state, including separately linked channels. The ordinary change flow verifies the current and new numbers.
- **Recovery:** phone changes, lost-number recovery, and email recovery are low priority. Recovery evidence and safe number-reassignment policy remain open; a recycled number must not grant its new holder the original owner's account.
- **Authentication integration:** select the native SDK version, trusted verified-phone lookup, exact records, and project configuration; validate production plan and country eligibility. Exercise token verification and concurrent first-request account creation.
- **Channel integration:** Bird is the primary Apple Messages for Business MSP under the [Apple messaging decision](0021-apple-messages-with-bird.md). Exact provider identifier mapping, APIs/webhooks, and linking mechanisms remain open within the independent verification boundary. This choice does not select a WhatsApp transport or change Privy and Twilio Verify phone authentication.
