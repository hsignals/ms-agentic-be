#!/usr/bin/env bash
# Provision only the dedicated staging project and its application resources.
set -euo pipefail
# shellcheck source=common.sh
source "$(dirname -- "${BASH_SOURCE[0]}")/common.sh"

reference="$(gcloud projects describe "$REFERENCE_PROJECT_ID" --format=json)"
parent_type="$(jq -r '.parent.type' <<< "$reference")"
parent_id="$(jq -r '.parent.id' <<< "$reference")"
billing_account="$(gcloud billing projects describe "$REFERENCE_PROJECT_ID" --format='value(billingAccountName)')"
[[ "$parent_type" == organization && "$parent_id" =~ ^[0-9]+$ && "$billing_account" == billingAccounts/* ]] || {
  echo 'Reference project must identify one organization and an active billing account.' >&2
  exit 1
}
if ! gcloud projects describe "$PROJECT_ID" --format=json >/dev/null 2>&1; then
  gcloud projects create "$PROJECT_ID" --name='MS Agentic Staging' --organization="$parent_id"
fi
actual_parent="$(gcloud projects describe "$PROJECT_ID" --format='value(parent.id)')"
[[ "$actual_parent" == "$parent_id" ]] || { echo 'Target project organization differs from reference.' >&2; exit 1; }
actual_billing="$(gcloud billing projects describe "$PROJECT_ID" --format='value(billingAccountName)')"
if [[ -z "$actual_billing" ]]; then
  gcloud billing projects link "$PROJECT_ID" --billing-account="${billing_account#billingAccounts/}"
elif [[ "$actual_billing" != "$billing_account" ]]; then
  echo 'Target project already uses another billing account; refusing to change it.' >&2
  exit 1
fi

gcloud services enable --project="$PROJECT_ID" \
  artifactregistry.googleapis.com run.googleapis.com secretmanager.googleapis.com \
  iam.googleapis.com iamcredentials.googleapis.com sts.googleapis.com \
  cloudresourcemanager.googleapis.com compute.googleapis.com memorystore.googleapis.com \
  networkconnectivity.googleapis.com serviceconsumermanagement.googleapis.com \
  logging.googleapis.com monitoring.googleapis.com

if ! gcloud artifacts repositories describe "$ARTIFACT_REPOSITORY" --project="$PROJECT_ID" --location="$REGION" >/dev/null 2>&1; then
  gcloud artifacts repositories create "$ARTIFACT_REPOSITORY" --project="$PROJECT_ID" \
    --location="$REGION" --repository-format=docker --description='MS Agentic staging images'
fi
if ! gcloud compute networks describe "$NETWORK" --project="$PROJECT_ID" >/dev/null 2>&1; then
  gcloud compute networks create "$NETWORK" --project="$PROJECT_ID" --subnet-mode=custom
fi
if ! gcloud compute networks subnets describe "$SUBNET" --project="$PROJECT_ID" --region="$REGION" >/dev/null 2>&1; then
  gcloud compute networks subnets create "$SUBNET" --project="$PROJECT_ID" --region="$REGION" \
    --network="$NETWORK" --range="$SUBNET_RANGE" --enable-private-ip-google-access
fi
if ! gcloud network-connectivity service-connection-policies describe "$PSC_POLICY" --project="$PROJECT_ID" --region="$REGION" >/dev/null 2>&1; then
  gcloud network-connectivity service-connection-policies create "$PSC_POLICY" --project="$PROJECT_ID" \
    --region="$REGION" --network="$NETWORK" --service-class=gcp-memorystore \
    --subnets="projects/$PROJECT_ID/regions/$REGION/subnetworks/$SUBNET" --psc-connection-limit=2
fi

bash "$CLOUD_SCRIPT_DIR/configure-identity.sh"

if ! gcloud storage buckets describe "gs://$GCS_BUCKET_NAME" --project="$PROJECT_ID" >/dev/null 2>&1; then
  gcloud storage buckets create "gs://$GCS_BUCKET_NAME" --project="$PROJECT_ID" --location="$REGION" \
    --default-storage-class=STANDARD --uniform-bucket-level-access --public-access-prevention
fi
# Standard storage, private IAM, and no lifecycle expiry preserve retained evidence.
gcloud storage buckets update "gs://$GCS_BUCKET_NAME" --project="$PROJECT_ID" \
  --uniform-bucket-level-access --public-access-prevention --default-storage-class=STANDARD --clear-lifecycle
for role in roles/storage.objectCreator roles/storage.objectViewer; do
  gcloud storage buckets add-iam-policy-binding "gs://$GCS_BUCKET_NAME" \
    --member="serviceAccount:$RUNTIME_IDENTITY" --role="$role" >/dev/null
done
for secret in openai-api-key e2b-api-key database-url migrate-database-url staging-auth-token valkey-ca-cert; do
  if ! gcloud secrets describe "$secret" --project="$PROJECT_ID" >/dev/null 2>&1; then
    gcloud secrets create "$secret" --project="$PROJECT_ID" --replication-policy=automatic \
      --labels=application=ms-agentic,environment=staging
  fi
  # Deployment selects immutable enabled versions but cannot read their payloads.
  gcloud secrets add-iam-policy-binding "$secret" --project="$PROJECT_ID" \
    --member="serviceAccount:$DEPLOY_IDENTITY" --role=roles/secretmanager.viewer >/dev/null
done
for secret in openai-api-key e2b-api-key database-url staging-auth-token valkey-ca-cert; do
  gcloud secrets add-iam-policy-binding "$secret" --project="$PROJECT_ID" \
    --member="serviceAccount:$RUNTIME_IDENTITY" --role=roles/secretmanager.secretAccessor >/dev/null
done
gcloud secrets add-iam-policy-binding migrate-database-url --project="$PROJECT_ID" \
  --member="serviceAccount:$MIGRATION_IDENTITY" --role=roles/secretmanager.secretAccessor >/dev/null
gcloud secrets add-iam-policy-binding staging-auth-token --project="$PROJECT_ID" \
  --member="serviceAccount:$DEPLOY_IDENTITY" --role=roles/secretmanager.secretAccessor >/dev/null

if ! gcloud memorystore instances describe "$VALKEY_INSTANCE" --project="$PROJECT_ID" --location="$REGION" >/dev/null 2>&1; then
  gcloud memorystore instances create "$VALKEY_INSTANCE" --project="$PROJECT_ID" --location="$REGION" \
    --node-type=custom-pico --mode=cluster-disabled --shard-count=1 --replica-count=0 \
    --authorization-mode=auth-disabled --transit-encryption-mode=server-authentication \
    --persistence-config-mode=aof --aof-config-append-fsync=every-sec \
    --engine-configs=maxmemory-policy=noeviction \
    --endpoints="[{\"connections\":[{\"pscAutoConnection\":{\"network\":\"projects/$PROJECT_ID/global/networks/$NETWORK\",\"projectId\":\"$PROJECT_ID\"}}]}]"
fi
gcloud memorystore instances describe "$VALKEY_INSTANCE" --project="$PROJECT_ID" --location="$REGION" --format=json \
  | jq -e '.mode == "CLUSTER_DISABLED" and .nodeType == "CUSTOM_PICO" and .shardCount == 1 and
    (.replicaCount // 0) == 0 and .transitEncryptionMode == "SERVER_AUTHENTICATION" and
    .authorizationMode == "AUTH_DISABLED" and .persistenceConfig.mode == "AOF" and
    .persistenceConfig.aofConfig.appendFsync == "EVERY_SEC" and
    .engineConfigs["maxmemory-policy"] == "noeviction"' >/dev/null
printf 'Project: %s\nImage URI: %s\nWIF provider: projects/%s/locations/global/workloadIdentityPools/%s/providers/%s\nDeployment identity: %s\n' \
  "$PROJECT_ID" "$IMAGE_URI" "$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')" "$WIF_POOL" "$WIF_PROVIDER" "$DEPLOY_IDENTITY"
echo 'Next: configure runtime CA, add approved secret versions, then dispatch the deployment workflow.'
