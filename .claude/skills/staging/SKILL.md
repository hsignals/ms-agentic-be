---
name: staging
description: Deploy an authorized ms-agentic-be candidate to its dedicated staging project and verify deployment identity, health, and recovery state.
---

# Deploy to staging

## 1. Outcome and context

Deploy the named remote candidate through the manually triggered `.github/workflows/deploy.yml`. Read full [AGENTS.md](../../../AGENTS.md), the [conventions index](../../../docs/conventions/README.md), applicable topics, [CONTRIBUTING.md](../../../CONTRIBUTING.md), and the [staging runbook](../../../docs/operations/staging.md).

The runbook and workflow own mechanics. Preserve serialization, migration gates, immutable-image verification, health checks, both entrypoints, and recovery controls. Use `bootstrap` for the explicitly deferred database/E2B stage; `full` requires its actual secrets and live gates. Bootstrap proves only the observations it runs.

## 2. Acceptance criteria

- Resolve the authorized remote commit, current serving deployment, and proposed candidate before dispatch. Assess the full serving-to-candidate diff, including config and migrations. An ordinary release contains current remote `main`; branch updates require their own Git authority.
- Show current and proposed identities before dispatch. If replacing another contributor's feature candidate is outside existing authority, obtain confirmation. Resolve unfinished releases and holds within authority; do not cancel another contributor's run. Serialization does not reserve staging for a separate acceptance session.
- Check migration compatibility before replacement and make conflicts with applied migrations explicit. Bind source commit to workflow, exact digest, API revision, and worker revision. Verify safe health and both process identities; report the scope actually exercised.
- Check identity before and after acceptance. If it changes, repeat affected tests on a known candidate. Personal acceptance comes from the author; health and automated smoke cannot supply it.
- Return success/failure/blocker, workflow link, previous and candidate identities, observed health/migration/worker state, acceptance gaps, and required recovery. Follow the runbook's recovery procedure within authority.

## 3. Authority

Deployment requires explicit authority; testing, review, or PR preparation alone does not grant it. Use existing authority without repeating approval requests. Paid model/sandbox tests, direct database writes, messages, trades, production promotion, and merging require their named scope. Do not silently retry, roll back, or clear an operator hold.

Database creation/URL, the E2B key, and dependent live tests are deferred for the current scaffold. Keep full E2B code and tests; report deferred proof separately and keep the runtime/cloud candidates in draft until required acceptance or an approved exception.
