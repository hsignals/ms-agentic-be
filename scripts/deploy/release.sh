#!/usr/bin/env bash
# Release one immutable staging image; failures retain snapshots for explicit recovery.
set -euo pipefail
# shellcheck source=../cloud/common.sh
source "$(dirname -- "${BASH_SOURCE[0]}")/../cloud/common.sh"
require_command curl
require_command bun
require_command docker
DEPLOY_MODE="${DEPLOY_MODE:-bootstrap}"
IMAGE_DIGEST="${IMAGE_DIGEST:?Set the immutable sha256 image digest}"
DEPLOYMENT_ID="${DEPLOYMENT_ID:?Set the tested source commit and release identity}"
[[ "$IMAGE_DIGEST" =~ ^sha256:[0-9a-f]{64}$ ]] || { echo 'Invalid immutable image digest.' >&2; exit 1; }
[[ "$DEPLOYMENT_ID" =~ ^[a-zA-Z0-9._-]{1,100}$ ]] || { echo 'Invalid deployment identity.' >&2; exit 1; }
[[ "$DEPLOY_MODE" == bootstrap || "$DEPLOY_MODE" == full ]] || { echo 'Expected bootstrap or full mode.' >&2; exit 1; }
image="$IMAGE_URI@$IMAGE_DIGEST"
image_source_commit="$(docker inspect "$image" --format '{{index .Config.Labels "org.opencontainers.image.revision"}}')"
[[ "$image_source_commit" =~ ^[0-9a-f]{40}$ ]] || { echo 'Candidate lacks a valid immutable source commit label.' >&2; exit 1; }
artifact_dir="${DEPLOY_ARTIFACT_DIR:-$REPOSITORY_ROOT/deployment-artifacts}"
mkdir -p "$artifact_dir"
chmod 700 "$artifact_dir"
trap 'status=$?; if ((status != 0)); then echo "Release failed; inspect $artifact_dir and recover using the saved immutable configuration. Database migrations are never reversed." >&2; fi' EXIT

secret_version() {
  local version
  version="$(gcloud secrets versions list "$1" --project="$PROJECT_ID" --filter=state=ENABLED \
    --sort-by='~createTime' --limit=1 --format='value(name)')"
  [[ -n "$version" ]] || { echo "Required secret has no enabled version: $1" >&2; return 1; }
  printf '%s' "${version##*/}"
}
openai_version="$(secret_version openai-api-key)"
auth_version="$(secret_version staging-auth-token)"
secrets="OPENAI_API_KEY=openai-api-key:$openai_version,STAGING_AUTH_TOKEN=staging-auth-token:$auth_version"
environment="NODE_ENV=production,LOG_LEVEL=info,DEPLOYMENT_ID=$DEPLOYMENT_ID,GCS_BUCKET_NAME=$GCS_BUCKET_NAME,STAGING_ACCOUNT_ID=$STAGING_ACCOUNT_ID,STAGING_CHANNEL_ID=$STAGING_CHANNEL_ID,WORKER_CONCURRENCY=1"

api_exists=false
worker_exists=false
if gcloud run services describe "$API_SERVICE" --project="$PROJECT_ID" --region="$REGION" --format=export > "$artifact_dir/previous-api.yaml" 2> "$artifact_dir/api-describe.log"; then
  api_exists=true
else
  # Authorization/server failures are not evidence that the resource is absent.
  grep -Eiq 'not found|does not exist|NOT_FOUND|Cannot find (service|worker)' "$artifact_dir/api-describe.log" || { cat "$artifact_dir/api-describe.log" >&2; exit 1; }
  rm -f "$artifact_dir/previous-api.yaml"
fi
if gcloud run worker-pools describe "$WORKER_POOL" --project="$PROJECT_ID" --region="$REGION" --format=export > "$artifact_dir/previous-worker.yaml" 2> "$artifact_dir/worker-describe.log"; then
  worker_exists=true
else
  grep -Eiq 'not found|does not exist|NOT_FOUND|Cannot find (service|worker)' "$artifact_dir/worker-describe.log" || { cat "$artifact_dir/worker-describe.log" >&2; exit 1; }
  rm -f "$artifact_dir/previous-worker.yaml"
fi
if [[ "$DEPLOY_MODE" == bootstrap && "$worker_exists" == true ]]; then
  echo 'Bootstrap is only for an incomplete initial deployment; use full mode when a worker already exists.' >&2
  exit 1
fi
if [[ "$DEPLOY_MODE" == full ]]; then
  database_version="$(secret_version database-url)"
  migration_version="$(secret_version migrate-database-url)"
  e2b_version="$(secret_version e2b-api-key)"
  ca_version="$(secret_version valkey-ca-cert)"
  valkey="$(gcloud memorystore instances describe "$VALKEY_INSTANCE" --project="$PROJECT_ID" --location="$REGION" --format=json)"
  endpoint="$(jq -er '[.endpoints[].connections[].pscAutoConnection | select(.connectionType == "CONNECTION_TYPE_PRIMARY")][0] | select(.ipAddress != null and .port != null) | "rediss://\(.ipAddress):\(.port)"' <<< "$valkey")"
  secrets="$secrets,DATABASE_URL=database-url:$database_version,E2B_API_KEY=e2b-api-key:$e2b_version,REDIS_TLS_CA=valkey-ca-cert:$ca_version"
  environment="$environment,REDIS_URL=$endpoint"
fi
printf 'mode=%s\nimage=%s\nimage_source_commit=%s\ndeployment_id=%s\n' "$DEPLOY_MODE" "$image" "$image_source_commit" "$DEPLOYMENT_ID" > "$artifact_dir/candidate.txt"

# Cloud Run retains draining requests and tagged revisions unless explicitly disabled.
if [[ "$api_exists" == true ]]; then
  gcloud run services update-traffic "$API_SERVICE" --project="$PROJECT_ID" --region="$REGION" --clear-tags
  gcloud run services update "$API_SERVICE" --project="$PROJECT_ID" --region="$REGION" --scaling=0
  api_disabled_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
fi
if [[ "$worker_exists" == true ]]; then
  gcloud run worker-pools update "$WORKER_POOL" --project="$PROJECT_ID" --region="$REGION" --instances=0
  worker_disabled_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
fi
if [[ "$api_exists" == true ]]; then
  bash "$REPOSITORY_ROOT/scripts/deploy/wait-zero.sh" service "$API_SERVICE" "$api_disabled_at" "$artifact_dir/api-zero.json"
fi
if [[ "$worker_exists" == true ]]; then
  bash "$REPOSITORY_ROOT/scripts/deploy/wait-zero.sh" worker "$WORKER_POOL" "$worker_disabled_at" "$artifact_dir/worker-zero.json"
fi
if [[ "$DEPLOY_MODE" == full ]]; then
  gcloud run jobs deploy "$MIGRATION_JOB" --project="$PROJECT_ID" --region="$REGION" \
    --image="$image" --service-account="$MIGRATION_IDENTITY" --cpu=1 --memory=1Gi \
    --command=/sbin/tini --args=--,bun,run,src/db/migrate.ts --tasks=1 --parallelism=1 \
    --max-retries=0 --task-timeout=600s --set-env-vars=NODE_ENV=production \
    --set-secrets="DATABASE_URL=migrate-database-url:$migration_version" --execute-now --wait
fi

gcloud run deploy "$API_SERVICE" --project="$PROJECT_ID" --region="$REGION" \
  --image="$image" --service-account="$RUNTIME_IDENTITY" --cpu=1 --memory=1Gi \
  --scaling=1 --no-cpu-throttling --execution-environment=gen2 --port=8080 --timeout=300s \
  --ingress=all --no-invoker-iam-check --network="$NETWORK" --subnet="$SUBNET" --vpc-egress=private-ranges-only \
  --command=/sbin/tini --args=--,bun,run,src/index.ts --set-env-vars="$environment" --set-secrets="$secrets"
api_json="$(gcloud run services describe "$API_SERVICE" --project="$PROJECT_ID" --region="$REGION" --format=json)"
service_url="$(jq -er '.status.url' <<< "$api_json")"
api_revision="$(jq -er '.status.latestReadyRevisionName' <<< "$api_json")"
gcloud run revisions describe "$api_revision" --project="$PROJECT_ID" --region="$REGION" --format=json > "$artifact_dir/api-revision.json"
jq -e --arg image "$image" '.status.imageDigest == $image' "$artifact_dir/api-revision.json" >/dev/null
if [[ "$DEPLOY_MODE" == full ]]; then
  gcloud run worker-pools deploy "$WORKER_POOL" --project="$PROJECT_ID" --region="$REGION" \
    --image="$image" --service-account="$RUNTIME_IDENTITY" --cpu=1 --memory=1Gi --instances=1 \
    --network="$NETWORK" --subnet="$SUBNET" --vpc-egress=private-ranges-only \
    --command=/sbin/tini --args=--,bun,run,src/worker.ts --set-env-vars="$environment" --set-secrets="$secrets"
  gcloud run worker-pools describe "$WORKER_POOL" --project="$PROJECT_ID" --region="$REGION" --format=json > "$artifact_dir/worker.json"
  worker_revision="$(jq -er '.status.latestReadyRevisionName' "$artifact_dir/worker.json")"
  gcloud run worker-pools revisions describe "$worker_revision" --project="$PROJECT_ID" --region="$REGION" --format=json > "$artifact_dir/worker-revision.json"
  jq -e --arg image "$image" '.status.imageDigest == $image' "$artifact_dir/worker-revision.json" >/dev/null
fi
export STAGING_URL="$service_url" EXPECTED_DEPLOYMENT_ID="$DEPLOYMENT_ID" SMOKE_MODE="$DEPLOY_MODE"
STAGING_AUTH_TOKEN="$(gcloud secrets versions access "$auth_version" --secret=staging-auth-token --project="$PROJECT_ID")"
export STAGING_AUTH_TOKEN
bun --no-env-file "$REPOSITORY_ROOT/scripts/smoke/staging.ts" | tee "$artifact_dir/smoke.json"
unset STAGING_AUTH_TOKEN
printf 'service_url=%s\napi_revision=%s\nworker_revision=%s\nimage_digest=%s\nimage_source_commit=%s\n' "$service_url" "$api_revision" "${worker_revision:-not-deployed}" "$IMAGE_DIGEST" "$image_source_commit" | tee "$artifact_dir/result.txt"
if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
  cat "$artifact_dir/result.txt" >> "$GITHUB_OUTPUT"
fi
echo "Deployment mode: $DEPLOY_MODE. Full acceptance requires the runbook's separate redeployment and personal observations."
