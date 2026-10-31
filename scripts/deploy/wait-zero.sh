#!/usr/bin/env bash
# Require actual post-disable zero metrics; missing samples never prove shutdown.
set -euo pipefail
# shellcheck source=../cloud/common.sh
source "$(dirname -- "${BASH_SOURCE[0]}")/../cloud/common.sh"
require_command curl
require_command python3
kind="${1:?Expected service or worker}"
name="${2:?Expected resource name}"
cutoff="${3:?Expected disable timestamp}"
evidence="${4:?Expected evidence file}"
case "$kind" in
  service) resource_type=cloud_run_revision; label=service_name ;;
  worker) resource_type=cloud_run_worker_pool; label=worker_pool_name ;;
  *) echo 'Expected service or worker.' >&2; exit 1 ;;
esac
filter="metric.type=\"run.googleapis.com/container/instance_count\" AND resource.type=\"$resource_type\" AND resource.labels.$label=\"$name\" AND resource.labels.location=\"$REGION\""
# Keep pre-disable series so a late/missing positive series cannot disappear from proof.
start_time="$(python3 -c 'from datetime import datetime,timedelta; import sys; print((datetime.fromisoformat(sys.argv[1].replace("Z", "+00:00"))-timedelta(minutes=10)).strftime("%Y-%m-%dT%H:%M:%SZ"))' "$cutoff")"
deadline=$((SECONDS + 600))
while ((SECONDS < deadline)); do
  end_time="$(python3 -c 'from datetime import datetime,timedelta,timezone; print((datetime.now(timezone.utc)-timedelta(seconds=120)).strftime("%Y-%m-%dT%H:%M:%SZ"))')"
  access_token="$(gcloud auth print-access-token)"
  curl --fail --silent --show-error --get \
    --header "Authorization: Bearer $access_token" \
    --data-urlencode "filter=$filter" \
    --data-urlencode "interval.startTime=$start_time" \
    --data-urlencode "interval.endTime=$end_time" \
    --data-urlencode 'view=FULL' \
    --data-urlencode 'aggregation.alignmentPeriod=60s' \
    --data-urlencode 'aggregation.perSeriesAligner=ALIGN_MAX' \
    --data-urlencode 'pageSize=100' \
    "https://monitoring.googleapis.com/v3/projects/$PROJECT_ID/timeSeries" > "$evidence"
  unset access_token
  # ALIGN_MAX checks the maximum sampled count in a full post-disable interval.
  if jq -e --arg cutoff "$cutoff" --from-file "$REPOSITORY_ROOT/scripts/deploy/zero-instances.jq" "$evidence" >/dev/null; then
    printf 'Observed zero %s instances: %s\n' "$kind" "$name"
    exit 0
  fi
  sleep 15
done
echo "No explicit fresh zero-instance evidence for $name within 10 minutes. Resource remains disabled." >&2
exit 1
