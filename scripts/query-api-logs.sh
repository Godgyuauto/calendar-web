#!/usr/bin/env bash
set -euo pipefail

LOG_QUERY_FILE="${LOG_QUERY_FILE:-/tmp/calendar-release-check-server.log}"
LOG_QUERY_MODE="${LOG_QUERY_MODE:-summary}" # summary | lines
LOG_QUERY_ROUTE="${LOG_QUERY_ROUTE:-}"
LOG_QUERY_METHOD="${LOG_QUERY_METHOD:-}"
LOG_QUERY_OUTCOME="${LOG_QUERY_OUTCOME:-}"
LOG_QUERY_STATUS="${LOG_QUERY_STATUS:-}"
LOG_QUERY_LEVEL="${LOG_QUERY_LEVEL:-}"
LOG_QUERY_LIMIT="${LOG_QUERY_LIMIT:-200}"

log() {
  printf '[log-query] %s\n' "$*"
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    log "missing command: $1"
    exit 1
  }
}

filter_stream() {
  jq -R -c \
    --arg route "$LOG_QUERY_ROUTE" \
    --arg method "$LOG_QUERY_METHOD" \
    --arg outcome "$LOG_QUERY_OUTCOME" \
    --arg status "$LOG_QUERY_STATUS" \
    --arg level "$LOG_QUERY_LEVEL" \
    '
      fromjson?
      | select(.kind == "api-route")
      | select($route == "" or .route == $route)
      | select($method == "" or .method == $method)
      | select($outcome == "" or .outcome == $outcome)
      | select($status == "" or ((.status | tostring) == $status))
      | select($level == "" or .level == $level)
    ' "$LOG_QUERY_FILE"
}

render_lines() {
  filter_stream \
    | tail -n "$LOG_QUERY_LIMIT" \
    | jq -c '{at, level, outcome, route, method, status, errorCode, message, commandHint, requestId}'
}

render_summary() {
  filter_stream \
    | jq -s '
      group_by([.route, .method, .outcome, .status])
      | map({
          route: .[0].route,
          method: .[0].method,
          outcome: .[0].outcome,
          status: .[0].status,
          count: length,
          latestAt: (map(.at) | max)
        })
      | sort_by(.route, .method, .status, .outcome)
    '
}

main() {
  require_cmd jq

  if [[ ! -f "$LOG_QUERY_FILE" ]]; then
    log "log file not found: ${LOG_QUERY_FILE}"
    exit 1
  fi

  log "file=${LOG_QUERY_FILE} mode=${LOG_QUERY_MODE}"
  case "$LOG_QUERY_MODE" in
    lines) render_lines ;;
    summary) render_summary ;;
    *)
      log "invalid LOG_QUERY_MODE=${LOG_QUERY_MODE} (use summary|lines)"
      exit 1
      ;;
  esac
}

main "$@"
