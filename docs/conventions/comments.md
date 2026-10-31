# Comment conventions

Use TSDoc for TypeScript documentation. Explain purpose, hidden rules, and effects a reader needs to use or change code safely.

## 1. Required coverage

### 1.1 Files and declarations

Where the format supports comments, give every maintained code file a one- or two-line responsibility header. Keep shebangs and license notices first. A barrel describes the boundary it exports.

Document exported functions, types, classes, and public methods with `/** ... */`. Document exported constants and schemas when their name and value leave a rule unclear. Explain non-obvious field units, absence, ownership, ordering, and lifecycle beside the declaration. Keep each shared rule at its owner.

### 1.2 Production failure contracts

Document the failure contract of every maintained production function, method, and constructor, including private functions. Use one `@throws` for each known escaping error and its condition, including meaningful propagated errors and rejected promises. Do not enumerate incidental dependency errors or claim an exhaustive list.

Document returned failure outcomes under `@returns`. A function with no escaping error says **“It has no intentional exception path.”** Document a callback's distinct failure contract at the callable that owns it.

## 2. Useful detail

Use `@param name - description` only for useful constraints; use `@returns` for outcomes or guarantees beyond the type. Add `@remarks` for needed side-effect, validation, transaction, or retry rules, and `@example` when a short example explains more clearly. Avoid empty tags and repeated types.

Explain a private helper's purpose or invariant when the code leaves it unclear. Use `//` for implementation decisions, constraints, or required ordering. Skip narration of obvious statements. When an intentional shortcut has a meaningful ceiling, add a concise `simplified:` comment naming its limit and upgrade trigger.

## 3. Maintenance

Keep comments current with behavior, preserve useful rationale during refactors, and keep broad design or operating procedures in their owning document. Use [writing conventions](writing.md) and describe exactly what code guarantees.

Tests use descriptive scenario names; comment on surprising fixtures, timing, or assertions. Reusable test helpers follow the same documentation rules. Other languages use native comment formats. Preserve source attribution, license notices, tool directives, generated files, pinned artifacts, and applied migrations. Comment-only work preserves executable statements, signatures, and literal values.
