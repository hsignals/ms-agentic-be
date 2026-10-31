#!/usr/bin/env bash
# Check the exact candidate image without credentials or paid provider calls.
set -euo pipefail
image="${1:?Expected image reference}"
container="$(docker run --detach --rm --publish 127.0.0.1::8080 --env DEPLOYMENT_ID=container-smoke "$image")"
trap 'docker stop --time=10 "$container" >/dev/null' EXIT
address="$(docker port "$container" 8080/tcp)"
url="http://$address"
for _ in {1..30}; do
  if curl --fail --silent "$url/health" > /dev/null; then
    break
  fi
  sleep 1
done
curl --fail --silent --show-error "$url/health" | jq -e '.deploymentId == "container-smoke"' >/dev/null
ready_status="$(curl --silent --show-error --output /dev/null --write-out '%{http_code}' "$url/health/ready")"
[[ "$ready_status" == 503 ]] || { echo "Unconfigured image readiness must be 503, received $ready_status." >&2; exit 1; }
echo 'Candidate image starts and reports incomplete dependency readiness without credentials.'
