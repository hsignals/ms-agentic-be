# Verification conventions

This topic owns behavioral evidence. [Testing](../test.md) owns commands, prerequisites, and suite boundaries; [CONTRIBUTING.md](../../CONTRIBUTING.md) owns readiness.

## 1. Meaningful coverage

Test observable behavior and invariants with independently derived expectations. Cover meaningful positive, negative, boundary, failure, and lifecycle cases. A test must catch a plausible regression rather than repeat implementation, count lines, or assert a private helper call without a behavioral reason.

Do not export production helpers solely for tests. A pure decision with a documented branch table may be exported from its owner's `utils/` and tested there.

Prefer pure unit tests for decisions and local integration tests for real persistence, atomicity, schema, queue, ownership, and lifecycle guarantees. Keep a few short live happy paths for real provider integration. Do not build long live corner-case journeys or scheduled waits when local tests can prove the contract.

## 2. Isolation and fixtures

Control provider responses, clocks, and randomness. Use minimal synthetic fixtures that reveal the invariant, descriptive scenario names, and clear arrange/action/assert structure. Test-only helpers and types belong under `tests/` or colocated test files allowed by the project layout.

Use narrow fakes rather than replacing a whole SDK surface. When a fake simulates storage semantics, exercise the fake and real implementation with the same relevant contract cases. Do not let a permissive fake conceal ownership, uniqueness, concurrency, or transaction rules.

Unexpected provider calls fail controlled scenarios. Unused fake methods throw, and behavioral store fakes return structured clones rather than live mutable records. Extend the shared fake/real contract cases before relying on another simulated behavior; strict canned doubles that simulate no storage behavior need no behavioral contract suite.

Keep cases sequential when they share mutable mocks, environment values, clocks, or fixtures; concurrent cases own their state and use test-local assertions. Do not enable blanket concurrency for a shared database or replace isolation with timing workarounds. Restore changed globals, doubles, and clocks after each case.

Routine tests use synthetic configuration and do not load developer credential files. Disposable PostgreSQL and Valkey runs own unique resources and clean them after success, failure, or interruption. Never infer a live test target from a developer database URL. Failures must survive cleanup in the exit status.

Cleanup watchdogs cover setup and the complete measured behavior. The test timeout must leave the watchdog time to stop its owned process; keep behavioral timing assertions separate from those cleanup limits.

## 3. Assertions and execution

Assert exact outputs and important side effects, absence of forbidden effects, and error type/reason where the contract needs them. Avoid broad truthiness assertions, snapshots of unstable SDK objects, and expectations calculated with the same production logic. Never weaken a test to make it pass.

Check prerequisites cheaply, run focused tests during development, and inspect actual outputs. Before a code push or PR, run the full required checks. Docs-only work runs document checks. Use the configured formatter, linter, and type checker without suppressing their rules.

## 4. Evidence quality

Record the command, outcome, tested revision, scope, and missing evidence. Distinguish a skipped test, missing prerequisite, known failure, and pass. CI covers only the jobs it ran; historical test counts are not a fresh result.

Bind live acceptance to the workflow, commit, immutable digest, API revision, and worker revision. Verify deployment identity before and after testing; if it changed, repeat affected checks. A model answer does not prove E2B execution, a health response does not prove storage, and automated smoke does not supply personal acceptance.

User-facing live probes exercise a few quick happy paths through public APIs and must not require direct database access. Local integration suites own database inspection, corner cases, recovery permutations, and scheduled waits.

Slow or unavailable live tests leave local results valid and live requirements unmet. Deferred database/E2B credentials must remain an explicit acceptance gap, without placeholder success evidence.
