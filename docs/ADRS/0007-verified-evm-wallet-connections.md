# Verified EVM wallet connections

## 1. Status and scope

**Status: ACCEPTED connection boundary and verification approach.** MyStacks requires wallet-control verification before saving an EVM wallet as a tracked connection or importing its portfolio data. The user connects a supported wallet on the companion website and signs a readable, off-chain Sign-In with Ethereum message using [ERC-4361](https://eips.ethereum.org/EIPS/eip-4361).

This decision supports the [Phase 1 requirements](../requirements.md): personal portfolio information and monitoring with read-only financial access. It grants neither financial execution nor token-approval authority. Wallet-control verification establishes control at verification time, not exclusive or permanent ownership. Supported wallet types and networks remain open; no runtime implementation is established by this record.

## 2. Decision and ownership

MyStacks account authentication and wallet-control verification are separate bindings. Trusted backend code binds the connection attempt to the authenticated user, checks the signed message and signature, and creates a verified EVM connection only after successful verification. Chat, website, import-to-connection flows, and scheduled tracking must enforce the same connection boundary.

The signed challenge contains a cryptographically random **nonce** that can be consumed once and expires after a short interval. The nonce is the random part of the challenge; the challenge is the message the user signs. Verification must check the expected message content and context as well as the signature. The [onboarding design](../design/onboarding.md) owns those checks, the pending-attempt flow, failures, and connection lifecycle. The exact challenge lifetime remains an implementation choice.

**Challenge expiry and connection lifetime are separate.** Once verification establishes the connection, ordinary portfolio reads and scheduled monitoring do not require another signature or an open wallet app. Disconnecting stops future reads through that connection. The [portfolio design](../design/portfolio.md) owns authorization for those reads.

Use maintained SIWE parsing and verification facilities rather than custom cryptographic primitives. If smart contract wallets are supported, verification must use the supported contract-account mechanism on the specified chain, including [ERC-1271](https://eips.ethereum.org/EIPS/eip-1271) where applicable. Selecting SIWE does not select a wallet SDK, authentication vendor, or support for every account type.

## 3. Rationale and alternatives

Requiring proof aligns connected portfolio data with a wallet the user controls and makes read-only tracking consent explicit. Public availability of holdings does not establish that the address belongs in that user's connected portfolio.

Allowing arbitrary address entry reduces onboarding effort and supports watch-only portfolios, but permits unrelated wallets to be recorded as personal connections. MyStacks chooses verified connections for this experience, accepting the additional signing step and excluding addresses the user cannot verify.

A fixed reusable message would be simpler to present but would not bind a proof to a fresh connection attempt. A standard SIWE message with backend-validated context and a one-time nonce prevents replay across connection attempts and provides a recognizable signing format. A successful signature alone cannot establish the intended user, site, or connection operation.

## 4. Consequences and open decisions

- **User experience:** cancelled, expired, invalid, or unsupported verification must leave the wallet unconnected and offer an appropriate retry or explanation. A pending attempt is not a tracked connection.
- **Persistent access:** a durable connection records a completed verification; it does not promise continuous proof of unchanged wallet control. Recovery and any additional re-verification policy need a defined product requirement.
- **Coverage:** supported EVM networks, ordinary and smart contract wallet types, and proof scope across networks require explicit choices.
- **Separate connectors:** Hyperliquid account-control rules and master-account, subaccount, and vault relationships need their own design. Its public API alone does not settle connection authority.
- **Data policy:** verification evidence retention and account recovery remain open. Wallet proof does not replace authorization to saved connections, private data, or notification destinations.
