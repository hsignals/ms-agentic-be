---
name: sync-docs
description: Synchronize the docs, comments, decisions, and TODOs affected by a finished ms-agentic-be change.
---

# Synchronize documentation

## 1. Outcome and context

Leave affected documentation accurate, self-contained, and consistent with the finished change. Read full [AGENTS.md](../../../AGENTS.md), the [conventions index](../../../docs/conventions/README.md), applicable topics, and system owners. Apply [writing conventions](../../../docs/conventions/writing.md), including ownership and current-truth rules.

## 2. Acceptance criteria

- One pass covers the finished change and review corrections; later implementation changes repeat the affected pass.
- Update affected docs, comments, examples, decisions, and TODOs while preserving technical meaning, accepted limits, and authority boundaries. Keep durable facts in their owning documents.
- Run applicable document checks and confirm a second inspection needs no further edits. Return scope/revisions, corrections, checks, and unresolved work.

## 3. Scope

Preserve executable behavior, production names, public signatures, and checks. Return executable defects with evidence to implementation/review and complete their correction and verification before continuing synchronization. This skill does not publish or deploy.
