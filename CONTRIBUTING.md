# Contributing

Prepare one coherent change with evidence a reviewer can inspect. The author owns behavior and readiness claims. Read the full [repository instructions](AGENTS.md), [conventions index](docs/conventions/README.md), applicable topics, and the system contract you change.

## 1. Setup and project skills

Follow [README setup](README.md#2-local-development) using Bun and `bun.lock`. Preserve local `.env` files and keep credentials out of Git, images, diagnostics, and evidence. [Testing](docs/test.md) owns commands and suite prerequisites; the [staging runbook](docs/operations/staging.md) owns live access and release procedures.

Shared project skills live under `.claude/skills/`, with `.agents/skills/` links exposing the same instructions to Codex. Invoke `review`, `sync-docs`, `create-pr`, or `staging` by name. If discovery is unavailable, read the corresponding `SKILL.md` directly.

## 2. Everyday contribution flow

### 2.1 Preparation sequence

1. Agree on expected behavior, a concrete before/after example, material design choices, and the intended [parent branch](#3-branches).
2. Implement the scoped change and focused tests, preserving unrelated work.
3. Obtain independent read-only review of the complete change and affected consumers. Fix accepted findings and verify corrections through relevant checks and independent inspection.
4. Synchronize affected docs, comments, decisions, and TODOs. Return executable defects to implementation or review before finishing synchronization.
5. Before a code push or PR, run all required local checks. Within granted Git authority, create or update a draft PR with the review, check, and documentation evidence.
6. When deployment is authorized, deploy the candidate and personally test the relevant staging flows. An authorized deployment may overlap review; personal acceptance must cover the candidate with its resulting fixes.
7. Refresh the PR with deployment, personal acceptance, and current CI evidence. Mark it ready and request the project owner's review only when explicitly authorized and all readiness requirements hold.

Equivalent review and documentation workflows are permitted when they satisfy these requirements. Calling a project skill does not start another stage or grant authority for publication, deployment, or merging.

### 2.2 Later changes and authority

Update the existing PR after further changes, and repeat review or tests whose evidence no longer covers the candidate. Keep still-valid evidence with its original tested revision and explain why it applies. A documentation typo needs document checks; an API response change needs review and testing of that response.

Each request authorizes only its named actions. Use existing task authority without requesting it again; PR preparation alone does not authorize deployment. Deployment does not authorize customer messages, trades, production promotion, or merging. Automated smoke tests do not supply the author's personal confirmation.

## 3. Branches

### 3.1 Select the parent

For a new PR, use an explicit base when supplied; otherwise use the head branch of the **most recently created open PR across all authors, including drafts**. Use `main` when none exists. An existing PR keeps its base unless a change is requested; do not create a duplicate or select that PR as its own parent.

Recheck the selected parent before creating or updating the PR and record actual comparison commits. For the scaffold, the [delivery specification](docs/design/scaffolding.md#51-delivery-across-four-pull-requests) defines the explicit stack above the existing product-design PR.

### 3.2 Integrate and refresh

The child must contain the selected parent's current head; changing the GitHub base setting does not integrate code. Within granted Git authority, prefer merging the parent over rewriting published history. Link its PR, review the child's diff against it, and assess the complete candidate's behavior.

When the parent head changes, inspect the combined change and repeat affected verification. When the parent merges or closes, reassess the child's base and diff. A clean merge alone does not prove unchanged behavior. Stage only named paths and inspect `git show --stat` after authorized commits.

## 4. Review and evidence

### 4.1 Independent review

Reviewers must not have implemented the change. They inspect read-only in separate contexts, explicitly read applicable instructions/conventions/contracts, and cover the complete change, affected consumers, and boundary behavior against exact comparison revisions and accepted limits. The [review skill](.claude/skills/review/SKILL.md) supplies the built-in workflow.

The working session triages findings against supported behavior. Fix accepted findings and verify corrections with relevant checks and independent inspection; extend coverage when a correction changes design or adds a path. Keep unresolved defects visible. An accepted operating exception requires the project owner's explicit agreement and rationale and must preserve security and integrity.

### 4.2 Reviewable results

Use the [PR template](.github/pull_request_template.md). Record behavior, stacked parent, reviewed base/head and any local snapshot, scope, findings/dispositions, correction checks, tested commits, and coverage limits. Keep the body concise and link accessible evidence.

For live evidence, include the workflow link, commit, image digest, API and worker revisions, and health result. Record the author's scenarios, expected/observed results, and personal confirmation. Private local paths, secret values, signed authority, and raw personal data are not publishable proof.

### 4.3 Missing results and exceptions

If runtime, image, deployment, and migration behavior are unchanged, the author may mark deployment and personal E2E **Not applicable** with a reason. Complete applicable checks and independent review. Other missing live proof requires a named exception accepted by the project owner.

When a local prerequisite is missing, use equivalent CI evidence or record a named exception. Report passed and unproved work separately. Slow or unavailable live tests leave local evidence valid and live acceptance unmet. The scaffold's deferred database creation/URL and E2B key are explicit delivery limits; health-only staging does not establish runtime acceptance.

## 5. Readiness and owner review

### 5.1 Readiness requirements

Before readiness, all of these must hold:

- Required local checks and CI cover the current candidate, with missing prerequisites covered by equivalent CI or an accepted named exception.
- Independent review is complete and accepted findings are fixed and independently verified.
- Affected documentation is synchronized and material decisions are settled or explicitly accepted.
- Staging and personal E2E acceptance cover the candidate, or a permitted exemption/accepted exception is recorded.
- The PR accurately describes final behavior, evidence, and limitations.

The author confirms every assertion. Leave personal testing unchecked until they perform and confirm it. For an exempt change, replace both live items with **Not applicable** and the reason; for an accepted exception, replace the affected item with its supporting link.

### 5.2 Feedback and status

Keep incomplete PRs in draft. When explicitly asked and readiness holds, mark ready and request the project owner's review within granted authority. If later changes invalidate evidence, restore draft within authorized PR updates. Contributors own PR status between agent invocations.

Answer feedback with a fix or concise technical explanation. Leave human review threads for their reviewer to resolve. Refresh affected evidence after fixes and keep accepted follow-ups with an owner and revisit trigger. Merging and production release require separate authority.

## 6. Merge policy

### 6.1 Required settings

Use squash merge and automatic deletion of merged feature branches. The intended classic protection rule for `main` requires:

- A PR and one approval from an eligible reviewer with write access.
- Passing `typecheck`, `test`, and `container-smoke`, enforced for administrators.
- Only `@shunjizhan` on the required-PR bypass list; required checks still apply.
- Preserved approvals after new commits, with code-owner and latest-push approval requirements disabled.
- Force pushes and deletion of `main` disabled.

The named-user bypass also permits direct pushes when remaining protections pass. Ordinary contributors need an approved PR. Protection of `main` does not protect a stack targeting a feature branch.

### 6.2 Verify enforcement

Repository files do not activate GitHub settings. When settings changes are authorized, inspect and verify the actual rule, including that the named user can bypass review while failing required checks still block merge. Enable runtime required checks only when their workflows exist; never add passing placeholders. Do not claim protection is enforced from this document alone.
