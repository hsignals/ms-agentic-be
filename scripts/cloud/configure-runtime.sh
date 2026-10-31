#!/usr/bin/env bash
# Store the provider's public CA bundle without printing it or changing runtime secrets.
set -euo pipefail
# shellcheck source=common.sh
source "$(dirname -- "${BASH_SOURCE[0]}")/common.sh"
ca_file="$(mktemp)"
trap 'rm -f "$ca_file"' EXIT
gcloud memorystore instances get-certificate-authority "$VALKEY_INSTANCE" \
  --project="$PROJECT_ID" --location="$REGION" --format=json \
  | jq -er '[.managedServerCa.caCerts[].certificates[]] | join("\n")' > "$ca_file"
openssl crl2pkcs7 -nocrl -certfile "$ca_file" | openssl pkcs7 -print_certs -noout >/dev/null
gcloud secrets versions add valkey-ca-cert --project="$PROJECT_ID" --data-file="$ca_file" >/dev/null
echo 'Stored the Valkey CA bundle. Database and E2B secret values require their approved sources.'
