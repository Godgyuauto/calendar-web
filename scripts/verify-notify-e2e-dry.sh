#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${NOTIFY_E2E_ENV_FILE:-${PROJECT_ROOT}/.env.local}"

if [[ "${NOTIFY_E2E_LOAD_ENV:-1}" == "1" && -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

SUPABASE_URL="${SUPABASE_URL:-${NEXT_PUBLIC_SUPABASE_URL:-}}"
SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}"

NOTIFY_E2E_PORT="${NOTIFY_E2E_PORT:-3110}"
NOTIFY_E2E_BASE_URL="${NOTIFY_E2E_BASE_URL:-http://127.0.0.1:${NOTIFY_E2E_PORT}}"
NOTIFY_E2E_WAIT_SECONDS="${NOTIFY_E2E_WAIT_SECONDS:-25}"
NOTIFY_E2E_TEST_EMAIL="${NOTIFY_E2E_TEST_EMAIL:-codex.verify.notify@example.com}"
NOTIFY_E2E_TEST_ROLE="${NOTIFY_E2E_TEST_ROLE:-editor}"
NOTIFY_E2E_TEST_PASSWORD="${NOTIFY_E2E_TEST_PASSWORD:-}"
NOTIFY_E2E_FAMILY_ID="${NOTIFY_E2E_FAMILY_ID:-}"
NOTIFY_E2E_TITLE_PREFIX="${NOTIFY_E2E_TITLE_PREFIX:-[notify-e2e-dry]}"
NOTIFY_E2E_KEEP_OVERRIDE="${NOTIFY_E2E_KEEP_OVERRIDE:-${NOTIFY_E2E_KEEP_EVENT:-0}}"
NOTIFY_E2E_REMIND_OFFSET_MINUTES="${NOTIFY_E2E_REMIND_OFFSET_MINUTES:-5}"
NOTIFY_E2E_QUEUE_ALLOW_MISSING="${NOTIFY_E2E_QUEUE_ALLOW_MISSING:-0}"

SERVER_PID=""
SERVER_LOG="/tmp/calendar-notify-e2e-server.log"

log() {
  printf '[verify-notify-e2e-dry] %s\n' "$*"
}

fail() {
  log "ERROR: $*"
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "missing command: $1"
}

cleanup() {
  if [[ -n "$SERVER_PID" ]] && kill -0 "$SERVER_PID" >/dev/null 2>&1; then
    kill "$SERVER_PID" >/dev/null 2>&1 || true
    wait "$SERVER_PID" >/dev/null 2>&1 || true
    log "stopped server pid=${SERVER_PID}"
  fi
}

wait_for_server() {
  local deadline=$((SECONDS + NOTIFY_E2E_WAIT_SECONDS))
  while [[ "$SECONDS" -lt "$deadline" ]]; do
    local code
    code=$(/usr/bin/curl -s -o /dev/null -w "%{http_code}" "${NOTIFY_E2E_BASE_URL}/api/shifts/today" || true)
    if [[ "$code" == "200" ]]; then
      return 0
    fi
    sleep 1
  done
  return 1
}

iso_after_minutes() {
  local minutes="$1"
  node -e '
    const minutes = Number(process.argv[1]);
    const d = new Date(Date.now() + minutes * 60 * 1000);
    process.stdout.write(d.toISOString());
  ' "$minutes"
}

datetime_local_after_minutes() {
  local minutes="$1"
  node -e '
    const minutes = Number(process.argv[1]);
    const date = new Date(Date.now() + minutes * 60 * 1000);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const mins = String(date.getMinutes()).padStart(2, "0");
    process.stdout.write(`${year}-${month}-${day}T${hours}:${mins}`);
  ' "$minutes"
}

main() {
  trap cleanup EXIT

  require_cmd /usr/bin/curl
  require_cmd jq
  require_cmd node
  cd "$PROJECT_ROOT"

  [[ -n "$SUPABASE_URL" ]] || fail "SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) is required"
  [[ -n "$SUPABASE_SERVICE_ROLE_KEY" ]] || fail "SUPABASE_SERVICE_ROLE_KEY is required"

  log "issue test access token"
  local access_token
  access_token="$(
    RELEASE_CHECK_TEST_EMAIL="${NOTIFY_E2E_TEST_EMAIL}" \
    RELEASE_CHECK_TEST_ROLE="${NOTIFY_E2E_TEST_ROLE}" \
    RELEASE_CHECK_TEST_PASSWORD="${NOTIFY_E2E_TEST_PASSWORD}" \
    RELEASE_CHECK_FAMILY_ID="${NOTIFY_E2E_FAMILY_ID}" \
    bash "${SCRIPT_DIR}/issue-test-token.sh"
  )"
  [[ -n "$access_token" ]] || fail "failed to issue test access token"

  log "start local server for API e2e"
  PORT="$NOTIFY_E2E_PORT" pnpm run start >"$SERVER_LOG" 2>&1 &
  SERVER_PID="$!"
  wait_for_server || {
    log "server failed to start in ${NOTIFY_E2E_WAIT_SECONDS}s"
    tail -n 80 "$SERVER_LOG" || true
    exit 1
  }

  local start_time end_time remind_at date_key title note_json
  start_time="$(datetime_local_after_minutes 3)"
  end_time="$(datetime_local_after_minutes 33)"
  remind_at="$(iso_after_minutes "$NOTIFY_E2E_REMIND_OFFSET_MINUTES")"
  date_key="${start_time%%T*}"
  title="${NOTIFY_E2E_TITLE_PREFIX} $(date -u +%Y%m%dT%H%M%SZ)"

  note_json="$(
    jq -cn \
      --arg title "$title" \
      --arg remind_at "$remind_at" \
      --arg start "$start_time" \
      --arg end "$end_time" \
      '{
        schema:"calendar_override_v1",
        event_type:"custom",
        shift_change:"KEEP",
        all_day:false,
        start_at:$start,
        end_at:$end,
        remind_at:$remind_at,
        title:$title
      }'
  )"

  local create_body create_out="/tmp/calendar-notify-e2e-create.json"
  create_body="$(
    jq -cn \
      --arg date "$date_key" \
      --arg label "$title" \
      --arg start "$start_time" \
      --arg end "$end_time" \
      --arg note "$note_json" \
      '{
        date:$date,
        overrideType:"custom",
        overrideShift:null,
        label:$label,
        startTime:$start,
        endTime:$end,
        note:$note
      }'
  )"

  log "create structured override via /api/overrides"
  local create_code
  create_code="$(
    /usr/bin/curl -sS -o "$create_out" -w "%{http_code}" \
      -X POST \
      -H "Authorization: Bearer ${access_token}" \
      -H "Content-Type: application/json" \
      --data "$create_body" \
      "${NOTIFY_E2E_BASE_URL}/api/overrides"
  )"
  [[ "$create_code" == "201" ]] || {
    log "override create failed status=${create_code}"
    head -c 500 "$create_out" || true
    exit 1
  }

  local override_id
  override_id="$(jq -r '.override.id // empty' "$create_out")"
  [[ -n "$override_id" ]] || fail "override id missing in /api/overrides response"
  log "created override id=${override_id}"

  log "verify queue snapshot"
  local queue_status=0
  NOTIFY_QUEUE_ALLOW_MISSING="${NOTIFY_E2E_QUEUE_ALLOW_MISSING}" \
    bash "${SCRIPT_DIR}/verify-notify-queue.sh" || queue_status=$?

  if [[ "$NOTIFY_E2E_KEEP_OVERRIDE" != "1" ]]; then
    log "cleanup override via /api/overrides?id=..."
    local delete_code
    delete_code="$(
      /usr/bin/curl -sS -o /tmp/calendar-notify-e2e-delete.json -w "%{http_code}" \
        -X DELETE \
        -H "Authorization: Bearer ${access_token}" \
        "${NOTIFY_E2E_BASE_URL}/api/overrides?id=${override_id}"
    )"
    if [[ "$delete_code" != "204" ]]; then
      log "warn: cleanup delete status=${delete_code}"
      head -c 500 /tmp/calendar-notify-e2e-delete.json || true
    fi
  fi

  if [[ "$queue_status" -eq 2 ]]; then
    log "BLOCKED: queue schema/status table not available yet."
    log "next action: add/expose queue table, then rerun pnpm run verify:notify:e2e:dry."
    return 2
  fi
  [[ "$queue_status" -eq 0 ]] || return "$queue_status"

  log "notify e2e dry verification finished"
}

main "$@"
