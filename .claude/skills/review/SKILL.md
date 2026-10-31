---
name: review
description: Independently review a ms-agentic-be PR, branch, or local change, triage findings, and fix accepted defects within task authority.
---

# Review and verify a change

## 1. Outcome and context

Find and correct real defects within the requested change while preserving accepted behavior, limits, and conventions. Read full [AGENTS.md](../../../AGENTS.md), the [conventions index](../../../docs/conventions/README.md), applicable topics, and affected system contracts. [CONTRIBUTING.md](../../../CONTRIBUTING.md) owns independent coverage, result freshness, and readiness.

## 2. Finding bar

A defect must be introduced or worsened by the change, with exact code, a plausible supported trigger, and practical consequence. Required conventions remain binding. A simplification must identify removable/reusable code and show that required behavior and safeguards survive; fewer lines or hypothetical maintenance savings do not suffice.

Require a current requirement or concrete reachable failure for hardening, extra branches, or new mechanisms, and explain why the common flow or native tools cannot meet it. Preserve concrete security, privacy, data-loss, accessibility, and consent concerns when their remedy needs a decision. Reject unrelated cleanup, nitpicks, and speculative requirements.

## 3. Acceptance criteria

- Independent reviewers who did not implement the change inspect read-only in separate contexts, explicitly read applicable conventions, and cover the complete change, affected consumers, and cross-boundary behavior against identified base/head revisions and accepted limits. Use further independent coverage where useful.
- The working session verifies and deduplicates findings by cause, separates defects from bundled suggestions, and records accepted findings, rejection reasons, unresolved decisions, and severity by impact.
- Fix every accepted finding within task authority using the smallest complete correction, update affected consumers/tests/docs, and verify with relevant checks and independent inspection. Extend coverage when a fix changes design or adds a path; never weaken tests.
- Return comparison revisions, any local snapshot, dispositions, checks, remaining issues, and unreviewed scope. Missing independent proof leaves review incomplete.

## 4. Authority

Review and delegated inspection remain read-only; corrections belong to the working session. Obtain a decision before changing approved behavior, scope, policy, or consent. PR publication, documentation synchronization, deployment, and merging remain separate actions.
