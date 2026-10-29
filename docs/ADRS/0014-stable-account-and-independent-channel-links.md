# Stable accounts and independent channel links

## 1. Status and scope

**Status: ACCEPTED Phase 1 identity direction.** MyStacks has a stable internal account, phone/SMS signup and login, and independently verified messaging-channel links. The overall architecture and exact authentication and verification mechanisms remain tentative.

The [requirements](../requirements.md#44-signup-and-channel-continuity), [onboarding stories](../user-stories/onboarding.md), and [onboarding design](../design/onboarding.md) own the detailed behavior and authority boundaries.

## 2. Decision

### 2.1 Stable account and required phone credential

A stable internal MyStacks account ID owns the user's connections, conversations, personal memory, preferences, tasks, and results. The primary phone number is a verified login credential rather than the account identity: each account has one primary verified number, and a number belongs to one account at a time. Website signup and login require an SMS code. Name, goals, and preferences do not block signup.

Successful signup opens the persistent website dashboard. Financial connections are optional, and users may connect sources and link channels in either order. Assistant chat requires a separately verified linked channel.

### 2.2 Independent channel and financial authority

iMessage and WhatsApp each require their own verified link to the authenticated account, even when their sender matches the primary phone number. The dashboard offers QR codes, direct buttons, and a copyable linking-message fallback; opening or scanning a link does not establish verification. Matching phone numbers or email addresses must not implicitly link or merge accounts or channels.

MyStacks login, channel verification, and financial-source authorization remain distinct. A wallet-control signature or provider connection does not replace account authentication or grant financial execution authority.

## 3. Rationale and alternatives

**The account preserves user control and continuity.** A channel-native account would make initial entry simpler, but would tie durable state to a messaging identity and complicate using both launch channels or changing login details. A stable account allows those bindings to change without replacing the user's account.

**The trade-off is additional verification and account management.** Required phone signup and separate channel linking add setup steps compared with accepting a channel sender or matching phone as identity. They keep login, message delivery, and financial access under explicit, separate authority.

## 4. Consequences and open choices

- **Continuity:** an authorized phone change preserves the account ID and its state, including separately linked channels. The ordinary change flow verifies the current and new numbers.
- **Recovery:** phone changes, lost-number recovery, and email recovery are low priority. Recovery evidence and safe number-reassignment policy remain open; a recycled number must not grant its new holder the original owner's account.
- **Implementation:** the authentication provider, supported channel sender identities, and exact verification mechanisms remain open. These choices must preserve the accepted identity and authority boundaries.
