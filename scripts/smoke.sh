#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${SMOKE_BASE_URL:-http://localhost:3000}"
ACCESS_TOKEN="${SMOKE_ACCESS_TOKEN:-${ACCESS_TOKEN:-}}"
REQUIRE_AUTH="${SMOKE_REQUIRE_AUTH:-0}"
TIMEOUT_SECONDS="${SMOKE_TIMEOUT_SECONDS:-8}"

PASS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0

TMP_DIR="$(mktemp -d /tmp/calendar-smoke.XXXXXX)"
trap 'rm -rf "$TMP_DIR"' EXIT

log() {
  printf '[smoke] %s\n' "$*"
}

pass() {
  PASS_COUNT=$((PASS_COUNT + 1))
  log "PASS: $1"
}

fail() {
  FAIL_COUNT=$((FAIL_COUNT + 1))
  log "FAIL: $1"
}

skip() {
  SKIP_COUNT=$((SKIP_COUNT + 1))
  log "SKIP: $1"
}

check_endpoint() {
  local name="$1"
  local method="$2"
  local path="$3"
  local expected_status="$4"
  local expected_text="${5:-}"
  local needs_auth="${6:-0}"
  local slug
  slug="$(printf '%s' "$name" | tr '[:space:]/' '__' | tr -cd '[:alnum:]_')"
  local body_file="$TMP_DIR/${slug}.body"
  local -a curl_args
  curl_args=(
    -sS
    -m "$TIMEOUT_SECONDS"
    -o "$body_file"
    -w "%{http_code}"
    -X "$method"
  )

  if [[ "$needs_auth" == "1" ]]; then
    curl_args+=(-H "Authorization: Bearer $ACCESS_TOKEN")
  fi

  curl_args+=("${BASE_URL}${path}")

  local status
  if ! status=$(/usr/bin/curl "${curl_args[@]}"); then
    fail "${name} (request failed)"
    return
  fi

  local status_ok=0
  IFS=',' read -r -a expected_statuses <<< "$expected_status"
  for expected in "${expected_statuses[@]}"; do
    if [[ "$status" == "${expected// /}" ]]; then
      status_ok=1
      break
    fi
  done

  if [[ "$status_ok" != "1" ]]; then
    local preview
    preview="$(head -c 220 "$body_file" | tr '\n' ' ')"
    fail "${name} (expected ${expected_status}, got ${status}) body=${preview}"
    return
  fi

  if [[ -n "$expected_text" ]] && ! grep -Fq "$expected_text" "$body_file"; then
    local preview
    preview="$(head -c 220 "$body_file" | tr '\n' ' ')"
    fail "${name} (missing text: ${expected_text}) body=${preview}"
    return
  fi

  pass "$name"
}

log "base_url=${BASE_URL}"
log "timeout_seconds=${TIMEOUT_SECONDS}"

# Home route may render the login HTML directly (200) or redirect to /login (307)
# depending on auth gate policy and Next runtime behavior.
check_endpoint "home page" GET "/" "200,307" "<html"
check_endpoint "shifts today api" GET "/api/shifts/today" 200 "\"summary\""

YEAR="$(date +%Y)"
MONTH="$(date +%m)"
MONTH="${MONTH#0}"
if [[ -z "$MONTH" ]]; then
  MONTH="0"
fi

check_endpoint "shifts month api" GET "/api/shifts/month?year=${YEAR}&month=${MONTH}" 200 "\"summary\""
check_endpoint "shifts month invalid month" GET "/api/shifts/month?year=${YEAR}&month=13" 400 "month must be an integer"

if [[ -n "$ACCESS_TOKEN" ]]; then
  check_endpoint "events api auth" GET "/api/events" 200 "\"events\"" 1
  check_endpoint "overrides api auth" GET "/api/overrides" 200 "\"overrides\"" 1
else
  check_endpoint "events api requires auth" GET "/api/events" 401 "Authorization header"
  check_endpoint "overrides api requires auth" GET "/api/overrides" 401 "Authorization header"

  if [[ "$REQUIRE_AUTH" == "1" ]]; then
    fail "SMOKE_REQUIRE_AUTH=1 but no SMOKE_ACCESS_TOKEN/ACCESS_TOKEN provided"
  else
    skip "authenticated read checks skipped (provide SMOKE_ACCESS_TOKEN for /api/events and /api/overrides 200 checks)"
  fi
fi

log "summary: pass=${PASS_COUNT} fail=${FAIL_COUNT} skip=${SKIP_COUNT}"
if [[ "$FAIL_COUNT" -gt 0 ]]; then
  exit 1
fi
