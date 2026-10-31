---
name: create-pr
description: Create or update a ms-agentic-be draft PR from completed work and evidence; mark ready only when requested and readiness holds.
---

# Prepare a pull request

## 1. Outcome and context

Deliver an accurate PR with reviewable evidence. Read full [AGENTS.md](../../../AGENTS.md), the [conventions index](../../../docs/conventions/README.md), applicable topics, [CONTRIBUTING.md](../../../CONTRIBUTING.md), and the [PR template](../../../.github/pull_request_template.md).

## 2. Acceptance criteria

- Follow the contributor guide's branch policy: explicit base first, otherwise latest-created open PR across all authors including drafts, otherwise `main`. An existing PR keeps its base unless requested; the candidate must actually contain its parent's current head.
- Use the template and record the stacked parent, actual comparison revisions, review dispositions, checks, documentation, live proof, and named exceptions. Reuse evidence only when the intervening diff preserves its covered behavior and retain its tested identity.
- Keep new or incomplete PRs in draft. Ready status requires an explicit request and all readiness criteria, including personal staging acceptance or a permitted exemption/accepted exception. Request the owner's review only when explicitly authorized.
- Verify GitHub's returned URL, base, head, body, and draft/ready status against the intended result.

## 3. Authority and limits

Use existing task authority for Git and PR writes, stage only named paths, and keep internal workflow vocabulary out of public text. Consume review/documentation evidence without starting those workflows or repairing implementation. Missing local checks may run under [testing](../../../docs/test.md). Deployment, merging, and repository settings are outside this skill.
