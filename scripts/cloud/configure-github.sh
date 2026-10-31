#!/usr/bin/env bash
# Configure this repository's approved merge policy without requiring unavailable CI checks.
set -euo pipefail
for command in gh jq bun; do
  command -v "$command" >/dev/null || { echo "Required command missing: $command" >&2; exit 1; }
done
[[ $# == 0 || ( $# == 1 && "$1" == --dry-run ) ]] || { echo 'Usage: configure-github.sh [--dry-run]' >&2; exit 1; }
dry_run=false
if [[ "${1:-}" == --dry-run ]]; then dry_run=true; fi
repository=hsignals/ms-agentic-be
work_directory="$(mktemp -d)"
trap 'rm -rf "$work_directory"' EXIT
api() {
  local endpoint="$1"
  shift
  gh api "$endpoint" --hostname github.com --header 'Accept: application/vnd.github+json' \
    --header 'X-GitHub-Api-Version: 2026-03-10' "$@"
}
api "repos/$repository" > "$work_directory/repository.json"
jq -e '.id == 1432887469 and .full_name == "hsignals/ms-agentic-be" and .default_branch == "main"' \
  "$work_directory/repository.json" >/dev/null || { echo 'Unexpected repository identity or default branch.' >&2; exit 1; }

# A missing workflow must never erase previously configured checks.
if ! api "repos/$repository/branches/main/protection" \
  > "$work_directory/existing-protection.json" 2> "$work_directory/protection-error.log"; then
  if grep -Eq 'HTTP 404' "$work_directory/protection-error.log" \
    && jq -e '.message == "Branch not protected"' "$work_directory/existing-protection.json" >/dev/null; then
    printf '%s' '{}' > "$work_directory/existing-protection.json"
  else
    cat "$work_directory/protection-error.log" >&2
    exit 1
  fi
fi

checks_active=false
if api "repos/$repository/contents/.github/workflows/ci.yml?ref=main" \
  > "$work_directory/workflow.json" 2> "$work_directory/workflow-error.log"; then
  # A named matrix or reusable job produces different check contexts; reject those here.
  bun --no-env-file -e '
    const response = await Bun.file(process.argv[1]).json();
    if (response.type !== "file" || response.encoding !== "base64" || typeof response.content !== "string") {
      throw new Error("Default-branch CI must be a readable workflow file.");
    }
    const workflow = Bun.YAML.parse(Buffer.from(response.content, "base64").toString("utf8"));
    const events = workflow?.on;
    let hasPullRequest = false;
    if (Array.isArray(events)) {
      hasPullRequest = events.includes("pull_request");
    } else if (typeof events === "string") {
      hasPullRequest = events === "pull_request";
    } else if (events !== null && typeof events === "object") {
      hasPullRequest = Object.hasOwn(events, "pull_request");
    }
    if (!hasPullRequest) throw new Error("Default-branch CI must run on pull requests.");
    for (const context of ["typecheck", "test", "container-smoke"]) {
      const job = workflow?.jobs?.[context];
      if (!job || (job.name ?? context) !== context || job.strategy?.matrix || job.uses || !Array.isArray(job.steps) || job.steps.length === 0) {
        throw new Error("Default-branch CI does not publish the stable check name " + context + ".");
      }
    }
  ' "$work_directory/workflow.json"
  checks_active=true
elif ! grep -Eq 'HTTP 404' "$work_directory/workflow-error.log"; then
  cat "$work_directory/workflow-error.log" >&2
  exit 1
fi

if [[ "$checks_active" == false ]] && jq -e '
  ((.required_status_checks.contexts // []) | length) > 0 or
  ((.required_status_checks.checks // []) | length) > 0
' "$work_directory/existing-protection.json" >/dev/null; then
  echo 'Default-branch CI is absent but main already requires checks; refusing to clear them.' >&2
  exit 1
fi

cat > "$work_directory/merge.json" <<'JSON'
{"allow_squash_merge":true,"allow_merge_commit":false,"allow_rebase_merge":false,"delete_branch_on_merge":true}
JSON
cat > "$work_directory/environment.json" <<'JSON'
{"wait_timer":0,"prevent_self_review":false,"reviewers":[],"deployment_branch_policy":null}
JSON
jq --null-input --argjson active "$checks_active" '{
  required_status_checks: (if $active then {strict:false,contexts:["typecheck","test","container-smoke"]} else null end),
  enforce_admins:true,
  required_pull_request_reviews:{
    required_approving_review_count:1,
    dismiss_stale_reviews:false,
    require_code_owner_reviews:false,
    require_last_push_approval:false,
    bypass_pull_request_allowances:{users:["shunjizhan"],teams:[],apps:[]}
  },
  restrictions:null,
  allow_force_pushes:false,
  allow_deletions:false
}' > "$work_directory/protection.json"
if [[ "$dry_run" == true ]]; then
  echo 'Dry run only; no GitHub settings changed.'
  jq --null-input --slurpfile merge "$work_directory/merge.json" \
    --slurpfile environment "$work_directory/environment.json" --slurpfile protection "$work_directory/protection.json" \
    '{repository:"hsignals/ms-agentic-be",merge:$merge[0],staging_environment:$environment[0],main_protection:$protection[0]}'
else
  api "repos/$repository" --method PATCH --input "$work_directory/merge.json" --silent
  api "repos/$repository/environments/staging" --method PUT --input "$work_directory/environment.json" --silent
  api "repos/$repository/branches/main/protection" --method PUT --input "$work_directory/protection.json" --silent

  # Verify the resulting policy through independent reads, not mutation exit codes.
  api "repos/$repository" | jq -e '.allow_squash_merge == true and .allow_merge_commit == false and
    .allow_rebase_merge == false and .delete_branch_on_merge == true' >/dev/null
  api "repos/$repository/environments/staging" | jq -e '.name == "staging" and .deployment_branch_policy == null and
    all(.protection_rules[]?; (.type != "required_reviewers" or (.reviewers | length) == 0) and
      (.type != "wait_timer" or .wait_timer == 0))' >/dev/null
  api "repos/$repository/branches/main/protection" | jq -e --argjson active "$checks_active" '
    .enforce_admins.enabled == true and .allow_force_pushes.enabled == false and .allow_deletions.enabled == false and
    .required_pull_request_reviews.required_approving_review_count == 1 and
    .required_pull_request_reviews.dismiss_stale_reviews == false and
    .required_pull_request_reviews.require_code_owner_reviews == false and
    .required_pull_request_reviews.require_last_push_approval == false and
    ([.required_pull_request_reviews.bypass_pull_request_allowances.users[].login] == ["shunjizhan"]) and
    (.required_pull_request_reviews.bypass_pull_request_allowances.teams | length) == 0 and
    (.required_pull_request_reviews.bypass_pull_request_allowances.apps | length) == 0 and
    (if $active then (.required_status_checks.contexts | sort) == (["typecheck","test","container-smoke"] | sort)
      and .required_status_checks.strict == false else .required_status_checks == null end)
  ' >/dev/null
  echo 'Verified staging environment, squash-only merge settings, and main review protections.'
fi
if [[ "$checks_active" == true ]]; then
  echo 'Default-branch CI verified; required checks selected: typecheck, test, container-smoke.'
else
  echo 'Required checks pending: default-branch CI is absent; required_status_checks is null.'
  echo 'Re-run after .github/workflows/ci.yml reaches main to activate typecheck, test, and container-smoke.'
fi
