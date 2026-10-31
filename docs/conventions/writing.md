# Writing conventions

These rules apply to Markdown, including instructions, skills, references, and templates. [Naming](naming.md) owns project terminology.

## 1. Structure and wording

### 1.1 Reviewable documents

Use one `#` title, numbered `##` topics (`1`), and numbered `###` subtopics (`1.1`). Choose descriptive headings, group related rules, and split dense sections. Use lists for parallel items or ordered actions and tables for comparisons. Keep conditions and exceptions beside their rule and refresh changed heading links.

Use balanced **bold emphasis** for structural labels or important points when it helps scanning. Each document must include the context needed to understand it without an unavailable local file.

### 1.2 Precise language

Use active voice, familiar words, and one term per concept. Preserve exact identifiers, commands, paths, and error text. Name the actor and required result; put conditions before actions. **Must** means required, **should** recommended, and **may** permitted.

Keep closely related conditions, actions, and consequences together. Split independent points or hard-to-read sentences. Remove filler while preserving conditions, exceptions, approval boundaries, and rationale. State uncertainty when a fact is uncertain.

## 2. Current truth and ownership

Write maintained documents as self-contained current truth. Git owns history, code owns implementation details, ADRs own material trade-offs, and plans/TODOs own next work. Preserve rationale, rejected alternatives, accepted limits, and guardrails.

Keep each durable fact in one maintained owner. When an accepted contract changes, update that owner. Remove superseded wording and explanations that depend on it; retain a negative statement only when it defines a current boundary or prevents a likely misunderstanding. Keep unfinished obligations with an owner and revisit trigger.

Skills state outcomes, constraints, and acceptance criteria. Prescribe a sequence only when order or method matters. Link to owning rules instead of repeating them.

## 3. Synchronization and review

After implementation and review corrections, synchronize affected docs, comments, examples, decisions, links, and TODOs. Perform one pass and check the documents; if implementation changes again, repeat the affected pass. Move remaining durable facts from temporary notes into their owner, and confirm a second inspection needs no further edits.

Documentation work preserves executable behavior, production names, signatures, and checks. Return substantive executable defects with evidence to implementation or review, then complete their correction and verification before continuing. Do not settle design ambiguity through wording or silently weaken a convention inside the change being reviewed.
