#!/usr/bin/env bash
# Shared fixed staging names; this file contains no credential values.
set -euo pipefail
CLOUD_SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPOSITORY_ROOT="$(cd -- "$CLOUD_SCRIPT_DIR/../.." && pwd)"
# shellcheck source=../../deploy/staging.env
source "$REPOSITORY_ROOT/deploy/staging.env"
if [[ "$PROJECT_ID" != ms-agentic-staging || "$REGION" != us-east4 ]]; then
  echo 'Refusing an unexpected staging project or region.' >&2
  exit 1
fi
export CLOUDSDK_CORE_DISABLE_PROMPTS=1
export RUNTIME_IDENTITY="$RUNTIME_SERVICE_ACCOUNT@$PROJECT_ID.iam.gserviceaccount.com"
export MIGRATION_IDENTITY="$MIGRATION_SERVICE_ACCOUNT@$PROJECT_ID.iam.gserviceaccount.com"
export DEPLOY_IDENTITY="$DEPLOY_SERVICE_ACCOUNT@$PROJECT_ID.iam.gserviceaccount.com"
export IMAGE_URI="$REGION-docker.pkg.dev/$PROJECT_ID/$ARTIFACT_REPOSITORY/backend"
require_command() {
  command -v "$1" >/dev/null || { echo "Required command missing: $1" >&2; exit 1; }
}
require_command gcloud
require_command jq
