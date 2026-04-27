#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${NOTIFY_VERIFY_ENV_FILE:-${PROJECT_ROOT}/.env.local}"

if [[ "${NOTIFY_VERIFY_LOAD_ENV:-1}" == "1" && -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

SUPABASE_URL="${SUPABASE_URL:-${NEXT_PUBLIC_SUPABASE_URL:-}}"
SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}"

NOTIFY_OPENAPI_FILE="${NOTIFY_OPENAPI_FILE:-/tmp/calendar-notify-openapi.json}"
NOTIFY_OVERRIDE_TABLE="${NOTIFY_OVERRIDE_TABLE:-shift_overrides}"
NOTIFY_EVENT_TABLE="${NOTIFY_EVENT_TABLE:-family_events}"
NOTIFY_QUEUE_TABLE="${NOTIFY_QUEUE_TABLE:-}"
NOTIFY_QUEUE_ALLOW_MISSING="${NOTIFY_QUEUE_ALLOW_MISSING:-0}"
NOTIFY_QUEUE_STATUS_COLUMN="${NOTIFY_QUEUE_STATUS_COLUMN:-}"
NOTIFY_QUEUE_CREATED_COLUMN="${NOTIFY_QUEUE_CREATED_COLUMN:-}"
NOTIFY_QUEUE_LIMIT="${NOTIFY_QUEUE_LIMIT:-200}"

log() {
  printf '[verify-notify-queue] %s\n' "$*"
}

fail() {
  log "ERROR: $*"
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "missing command: $1"
}

api_status() {
  local url="$1"
  /usr/bin/curl -sS \
    -o "$2" \
    -w "%{http_code}" \
    -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
    "$url"
}

table_exists() {
  local table="$1"
  jq -e --arg table "$table" '.definitions[$table] != null' "$NOTIFY_OPENAPI_FILE" >/dev/null
}

detect_first_column() {
  local table="$1"
  shift
  local candidate
  for candidate in "$@"; do
    if jq -e --arg table "$table" --arg key "$candidate" '.definitions[$table].properties[$key] != null' "$NOTIFY_OPENAPI_FILE" >/dev/null; then
      echo "$candidate"
      return 0
    fi
  done
  return 1
}

main() {
  require_cmd /usr/bin/curl
  require_cmd jq

  [[ -n "$SUPABASE_URL" ]] || fail "SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) is required"
  [[ -n "$SUPABASE_SERVICE_ROLE_KEY" ]] || fail "SUPABASE_SERVICE_ROLE_KEY is required"

  SUPABASE_URL="${SUPABASE_URL%/}"

  log "fetch runtime OpenAPI"
  local openapi_code
  openapi_code="$(api_status "${SUPABASE_URL}/rest/v1/" "$NOTIFY_OPENAPI_FILE")"
  [[ "$openapi_code" == "200" ]] || fail "failed to fetch OpenAPI. status=${openapi_code}"

  local remind_source="missing"
  if jq -e --arg table "$NOTIFY_OVERRIDE_TABLE" '.definitions[$table] != null' "$NOTIFY_OPENAPI_FILE" >/dev/null; then
    if jq -e --arg table "$NOTIFY_OVERRIDE_TABLE" '.definitions[$table].properties.note != null' "$NOTIFY_OPENAPI_FILE" >/dev/null; then
      remind_source="${NOTIFY_OVERRIDE_TABLE}.note.remind_at (json: calendar_override_v1)"
    elif jq -e --arg table "$NOTIFY_OVERRIDE_TABLE" '.definitions[$table].properties.remind_at != null' "$NOTIFY_OPENAPI_FILE" >/dev/null; then
      remind_source="${NOTIFY_OVERRIDE_TABLE}.remind_at"
    fi
  elif jq -e --arg table "$NOTIFY_EVENT_TABLE" '.definitions[$table] != null' "$NOTIFY_OPENAPI_FILE" >/dev/null; then
    # Backward-compat fallback for older runtimes that still keep remind_at in family_events.
    if jq -e --arg table "$NOTIFY_EVENT_TABLE" '.definitions[$table].properties.remind_at != null' "$NOTIFY_OPENAPI_FILE" >/dev/null; then
      remind_source="${NOTIFY_EVENT_TABLE}.remind_at"
    elif jq -e --arg table "$NOTIFY_EVENT_TABLE" '.definitions[$table].properties.data != null' "$NOTIFY_OPENAPI_FILE" >/dev/null; then
      remind_source="${NOTIFY_EVENT_TABLE}.data.remind_at (json)"
    fi
  fi

  if [[ -z "$NOTIFY_QUEUE_TABLE" ]]; then
    # Why: queue schema can vary by environment, so we auto-detect and fail safely.
    NOTIFY_QUEUE_TABLE="$(jq -r '
      (.definitions | keys)
      | map(select(test("notify|notification|queue|delivery|dispatch|remind"; "i")))
      | map(select(. != "push_subscriptions"))
      | .[0] // ""
    ' "$NOTIFY_OPENAPI_FILE")"
  fi

  if [[ -z "$NOTIFY_QUEUE_TABLE" ]] || ! table_exists "$NOTIFY_QUEUE_TABLE"; then
    log "BLOCKED: queue table not found in runtime OpenAPI."
    log "detected remind source: ${remind_source}"
    log "needed action: expose/create notify queue table (status + created_at + retry/error fields)."
    if [[ "$NOTIFY_QUEUE_ALLOW_MISSING" == "1" ]]; then
      log "NOTIFY_QUEUE_ALLOW_MISSING=1 -> return success with blocked note."
      return 0
    fi
    return 2
  fi

  if [[ -z "$NOTIFY_QUEUE_STATUS_COLUMN" ]]; then
    NOTIFY_QUEUE_STATUS_COLUMN="$(detect_first_column "$NOTIFY_QUEUE_TABLE" status state queue_status delivery_status || true)"
  fi
  [[ -n "$NOTIFY_QUEUE_STATUS_COLUMN" ]] || fail "queue status column not found in ${NOTIFY_QUEUE_TABLE}"

  if [[ -z "$NOTIFY_QUEUE_CREATED_COLUMN" ]]; then
    NOTIFY_QUEUE_CREATED_COLUMN="$(detect_first_column "$NOTIFY_QUEUE_TABLE" created_at queued_at scheduled_at inserted_at updated_at || true)"
  fi
  [[ -n "$NOTIFY_QUEUE_CREATED_COLUMN" ]] || fail "queue created timestamp column not found in ${NOTIFY_QUEUE_TABLE}"

  local retry_column
  retry_column="$(detect_first_column "$NOTIFY_QUEUE_TABLE" retry_count attempt_count attempts || true)"
  local error_column
  error_column="$(detect_first_column "$NOTIFY_QUEUE_TABLE" last_error error_message failure_reason || true)"

  local rows_file="/tmp/calendar-notify-queue-rows.json"
  local rows_query
  rows_query="select=${NOTIFY_QUEUE_STATUS_COLUMN},${NOTIFY_QUEUE_CREATED_COLUMN}"
  if [[ -n "$retry_column" ]]; then
    rows_query="${rows_query},${retry_column}"
  fi
  if [[ -n "$error_column" ]]; then
    rows_query="${rows_query},${error_column}"
  fi
  rows_query="${rows_query}&order=${NOTIFY_QUEUE_CREATED_COLUMN}.desc&limit=${NOTIFY_QUEUE_LIMIT}"

  local rows_code
  rows_code="$(api_status "${SUPABASE_URL}/rest/v1/${NOTIFY_QUEUE_TABLE}?${rows_query}" "$rows_file")"
  [[ "$rows_code" == "200" ]] || fail "failed to query queue rows. table=${NOTIFY_QUEUE_TABLE} status=${rows_code}"

  local total pending sent failed
  total="$(jq 'length' "$rows_file")"
  pending="$(jq --arg key "$NOTIFY_QUEUE_STATUS_COLUMN" '[.[] | .[$key] | tostring | ascii_downcase | select(. == "pending" or . == "queued" or . == "ready")] | length' "$rows_file")"
  sent="$(jq --arg key "$NOTIFY_QUEUE_STATUS_COLUMN" '[.[] | .[$key] | tostring | ascii_downcase | select(. == "sent" or . == "delivered" or . == "success")] | length' "$rows_file")"
  failed="$(jq --arg key "$NOTIFY_QUEUE_STATUS_COLUMN" '[.[] | .[$key] | tostring | ascii_downcase | select(. == "failed" or . == "error" or . == "dead")] | length' "$rows_file")"

  log "queue_table=${NOTIFY_QUEUE_TABLE}"
  log "status_column=${NOTIFY_QUEUE_STATUS_COLUMN} created_column=${NOTIFY_QUEUE_CREATED_COLUMN}"
  log "remind_source=${remind_source}"
  log "summary total=${total} pending=${pending} sent=${sent} failed=${failed}"
  log "retry_column=${retry_column:-missing} error_column=${error_column:-missing}"

  jq --arg status_key "$NOTIFY_QUEUE_STATUS_COLUMN" --arg created_key "$NOTIFY_QUEUE_CREATED_COLUMN" '
    .[:5]
    | map({
        status: .[$status_key],
        createdAt: .[$created_key],
        retry: (.retry_count // .attempt_count // .attempts // null),
        error: (.last_error // .error_message // .failure_reason // null)
      })
  ' "$rows_file"
}

main "$@"
