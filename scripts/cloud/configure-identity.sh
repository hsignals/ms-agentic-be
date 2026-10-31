#!/usr/bin/env bash
# Configure deployment identities without creating billable resources.
set -euo pipefail
# shellcheck source=common.sh
source "$(dirname -- "${BASH_SOURCE[0]}")/common.sh"

gcloud services enable --project="$PROJECT_ID" iam.googleapis.com iamcredentials.googleapis.com sts.googleapis.com
for identity in "$RUNTIME_SERVICE_ACCOUNT" "$MIGRATION_SERVICE_ACCOUNT" "$DEPLOY_SERVICE_ACCOUNT"; do
  if ! gcloud iam service-accounts describe "$identity@$PROJECT_ID.iam.gserviceaccount.com" --project="$PROJECT_ID" >/dev/null 2>&1; then
    gcloud iam service-accounts create "$identity" --project="$PROJECT_ID" --display-name="$identity"
  fi
done

for role in roles/run.admin roles/artifactregistry.writer roles/compute.networkUser roles/serviceusage.serviceUsageConsumer roles/monitoring.viewer roles/memorystore.viewer; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:$DEPLOY_IDENTITY" \
    --role="$role" --condition=None >/dev/null
done
for identity in "$RUNTIME_IDENTITY" "$MIGRATION_IDENTITY"; do
  gcloud iam service-accounts add-iam-policy-binding "$identity" --project="$PROJECT_ID" \
    --member="serviceAccount:$DEPLOY_IDENTITY" --role=roles/iam.serviceAccountUser >/dev/null
done
project_number="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"
if ! gcloud iam workload-identity-pools describe "$WIF_POOL" --project="$PROJECT_ID" --location=global >/dev/null 2>&1; then
  gcloud iam workload-identity-pools create "$WIF_POOL" --project="$PROJECT_ID" --location=global \
    --display-name='GitHub staging deployment'
fi
condition="assertion.repository_id == '$GITHUB_REPOSITORY_ID' && assertion.repository_owner_id == '$GITHUB_OWNER_ID' && assertion.sub == 'repo:$GITHUB_REPOSITORY:environment:staging'"
mapping='google.subject=assertion.sub,attribute.repository_id=assertion.repository_id,attribute.repository_owner_id=assertion.repository_owner_id'
if ! gcloud iam workload-identity-pools providers describe "$WIF_PROVIDER" --project="$PROJECT_ID" --location=global --workload-identity-pool="$WIF_POOL" >/dev/null 2>&1; then
  gcloud iam workload-identity-pools providers create-oidc "$WIF_PROVIDER" --project="$PROJECT_ID" \
    --location=global --workload-identity-pool="$WIF_POOL" \
    --issuer-uri=https://token.actions.githubusercontent.com --attribute-mapping="$mapping" --attribute-condition="$condition"
else
  gcloud iam workload-identity-pools providers update-oidc "$WIF_PROVIDER" --project="$PROJECT_ID" \
    --location=global --workload-identity-pool="$WIF_POOL" \
    --attribute-mapping="$mapping" --attribute-condition="$condition"
fi
principal="principal://iam.googleapis.com/projects/$project_number/locations/global/workloadIdentityPools/$WIF_POOL/subject/repo:$GITHUB_REPOSITORY:environment:staging"
gcloud iam service-accounts add-iam-policy-binding "$DEPLOY_IDENTITY" --project="$PROJECT_ID" \
  --member="$principal" --role=roles/iam.workloadIdentityUser >/dev/null

printf 'WIF provider: projects/%s/locations/global/workloadIdentityPools/%s/providers/%s\nDeployment identity: %s\n' \
  "$project_number" "$WIF_POOL" "$WIF_PROVIDER" "$DEPLOY_IDENTITY"
