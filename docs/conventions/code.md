# Code conventions

This topic owns code shape and decomposition. Apply [naming](naming.md), [comments](comments.md), and [boundaries](boundaries.md) alongside it.

## 1. Runtime and types

Use Bun, TypeScript, `bun.lock`, strict checks, explicit `.ts` imports, and the configured `@/` alias. Keep dependency changes and the lockfile together; use frozen installs for verification. Do not introduce `any`, `@ts-ignore`, or suppressions merely to pass checks.

### 1.1 Schemas and contracts

Put runtime schemas at the boundary they guard, and define a repeated field primitive once under its shared owner. Name Zod schemas `PascalCaseSchema`; declare a field-for-field inferred type beside its schema with `z.infer<typeof XSchema>`.

Use an `interface` for a contract a class implements; use a `type` for other shapes. Declare first-party parameter and result contracts beside their owner and import them by name. Do not derive them with `ReturnType`, `Parameters`, `ConstructorParameters`, or `InstanceType`.

Import native library types. When a library exposes no suitable type, a justified `typeof` derivation may document that gap; do not hand-copy its shape. Type closed lookup tables with `as const satisfies Record<Key, Value>`.

## 2. Functions and control flow

### 2.1 Readable expressions

- Prefer `const` arrow functions, defined before eager use. Retain function syntax when constructor, generator, or dynamic `this` semantics need it.
- Give control-flow bodies braces. Leave space between logical steps and before a final `return`.
- Use a `switch` or lookup table for multi-way mappings. Never nest ternaries; put the condition, `?` branch, and `:` branch on separate lines.
- Use implicit returns only for existing pure data mappings without setup or control flow; parenthesize returned object literals. Validation, effects, and async operations use explicit returns.
- Use `toSorted()` and `toReversed()`; preserve the input array. Use `value as Type` for assertions.
- For a multiline `&&` or `||` chain, put each condition on its own line with its operator at the start of the continuation.

### 2.2 State and decomposition

Use `#` fields and methods for private class state. Avoid the `private` keyword, constructor parameter properties, and proxying or spreading instances with `#` members.

Add an abstraction only for a current requirement or a clear simplification. Give a repeated step one owner at the lowest layer its consumers may import. Prefer a named local value when another helper would add no useful boundary.

When a production function exceeds roughly eighty lines or trips cognitive-complexity checks, extract complete decisions into named pure helpers with a TSDoc invariant. An extraction must enable a decision test, remove duplication, or move deterministic work outside a provider catch or lock window. Pure helpers read no provider, store, clock, environment, or logger; pass time as a value.

## 3. Change contracts

Preserve comments, type predicates, assertion signatures, evaluation order, provider-call count, and transaction boundaries during refactors. A contract change alters accepted input, output/status, stored format, timing, or retry behavior; make that change explicit with its owner update and compatibility implications. A fix restoring a documented contract is a bug fix.
