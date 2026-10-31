// Owns the trusted account/channel binding shared by runtime and retained files.

/** An account and linked channel already authorized by the application. */
export type TrustedScope = { accountId: string, channelId: string };
