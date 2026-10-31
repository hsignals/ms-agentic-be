# Every observed series needs a fresh complete minute at zero. Missing data fails.
(.nextPageToken // "") == "" and
((.timeSeries // []) | length > 0) and
all(.timeSeries[];
  ([.points[]? | select(.interval.startTime > $cutoff)]
    | sort_by(.interval.endTime) | last) as $point
  | $point != null and ($point.value.int64Value | tonumber) == 0
)
