# Last-save-wins profile updates

## 1. Status and scope

**Status: ACCEPTED Phase 1 profile update policy.** Account-shared personal profiles use native partial-field merging. For the same field, the last successful save wins regardless of user-message order. Overall architecture, exact schema, and runtime integration remain tentative.

The [runtime design](../design/runtime.md) owns execution and verification; the [memory stories](../user-stories/memory.md) own observable behavior. The [shared PostgreSQL decision](0013-shared-postgresql-storage.md) owns storage selection. This record owns the concurrency policy and its accepted limits.

## 2. Decision

Let main-agent turns from different linked channels update the account's profile concurrently through Mastra's native schema-based working memory. Partial updates preserve fields outside the supplied change. Native object deep-merging preserves independent named fields; supplied arrays and text fields replace those whole fields, and `null` deletes a field. Facts inside one text or array field are not merged independently. See [Mastra working-memory merge semantics](https://mastra.ai/docs/memory/working-memory#merge-semantics-for-schema-based-memory).

For competing saves to the same field, use **last successful save wins**, not the timestamp of the newest user message. A slower older turn can overwrite a newer correction or restore deleted content. This limit also applies to [profile-only forgetting](0011-profile-only-forgetting.md).

Use the atomic resource-profile merge supplied by `@mastra/pg`, including its short internal row locks, as documented in [working-memory concurrency behavior](https://mastra.ai/docs/memory/working-memory#concurrent-updates). Do not add application-level serialization across channels, per-field timestamps, deletion tombstones, or a custom conflict resolver.

## 3. Rationale and alternatives

**Native partial updates preserve independent work with little application machinery.** Two channels can save different profile fields without replacing the whole profile. A shared application lock would serialize otherwise-independent channel work; the database's short atomic merge is enough for the selected policy.

**Message-time precedence is a stronger contract.** Enforcing it would require tracking update authority and order for fields or facts, including correction and deletion state. Phase 1 accepts that completion order can differ from user-message order rather than adding those controls.

**Field-level replacement matches the native representation.** Text categories and arrays can contain several facts, so a later replacement may overwrite another edit within the same field. Per-fact merging would require a different representation or custom resolution; it is not part of this choice.

## 4. Consequences and open choices

- **Independent fields:** successful partial updates preserve saved fields outside their supplied changes.
- **Conflicts:** the last successful same-field save determines the stored value, even when it came from an older message or reverses a correction or deletion.
- **Isolation:** internal database row locking does not require serializing foreground turns across linked channels; each channel retains its own ordered-turn boundary.
- **Open details:** exact profile fields, schema/types, native tool configuration, and user-facing save outcomes remain open.
