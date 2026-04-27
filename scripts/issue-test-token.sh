#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${RELEASE_CHECK_ENV_FILE:-${PROJECT_ROOT}/.env.local}"

if [[ "${RELEASE_CHECK_LOAD_ENV:-1}" == "1" && -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

SUPABASE_URL="${SUPABASE_URL:-${NEXT_PUBLIC_SUPABASE_URL:-}}"
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}}"
SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}"

TEST_EMAIL="${RELEASE_CHECK_TEST_EMAIL:-codex.verify.release@example.com}"
TEST_ROLE="${RELEASE_CHECK_TEST_ROLE:-editor}"
TARGET_FAMILY_ID="${RELEASE_CHECK_FAMILY_ID:-}"
TIMEOUT_SECONDS="${RELEASE_CHECK_TIMEOUT_SECONDS:-10}"
GENERATED_PASSWORD="CodexRelease$(date +%s)!A1"

TEST_PASSWORD="${RELEASE_CHECK_TEST_PASSWORD:-$GENERATED_PASSWORD}"
TMP_DIR="$(mktemp -d /tmp/calendar-issue-token.XXXXXX)"
trap 'rm -rf "$TMP_DIR"' EXIT

log() {
  printf '[issue-test-token] %s\n' "$*" >&2
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    log "missing command: $1"
    exit 1
  }
}

api_service_json() {
  local method="$1"
  local url="$2"
  local body="${3:-}"
  local out="$4"
  local -a args
  args=(
    -sS
    -m "$TIMEOUT_SECONDS"
    -o "$out"
    -w "%{http_code}"
    -X "$method"
    -H "apikey: $SUPABASE_SERVICE_ROLE_KEY"
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
  )
  if [[ -n "$body" ]]; then
    args+=(-H "Content-Type: application/json" --data "$body")
  fi

  local code
  code=$(/usr/bin/curl "${args[@]}" "$url")
  [[ "$code" -ge 200 && "$code" -lt 300 ]]
}

api_anon_json() {
  local method="$1"
  local url="$2"
  local body="${3:-}"
  local out="$4"
  local -a args
  args=(
    -sS
    -m "$TIMEOUT_SECONDS"
    -o "$out"
    -w "%{http_code}"
    -X "$method"
    -H "apikey: $SUPABASE_ANON_KEY"
    -H "Content-Type: application/json"
  )
  if [[ -n "$body" ]]; then
    args+=(--data "$body")
  fi

  local code
  code=$(/usr/bin/curl "${args[@]}" "$url")
  [[ "$code" -ge 200 && "$code" -lt 300 ]]
}

main() {
  require_cmd /usr/bin/curl
  require_cmd jq

  if [[ -z "$SUPABASE_URL" || -z "$SUPABASE_ANON_KEY" || -z "$SUPABASE_SERVICE_ROLE_KEY" ]]; then
    log "SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY are required"
    exit 1
  fi
  if [[ "$TEST_ROLE" != "admin" && "$TEST_ROLE" != "editor" ]]; then
    log "RELEASE_CHECK_TEST_ROLE must be admin|editor"
    exit 1
  fi

  SUPABASE_URL="${SUPABASE_URL%/}"
  log "ensure test user: ${TEST_EMAIL}"

  local users_json="$TMP_DIR/users.json"
  if ! api_service_json GET "${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=1000" "" "$users_json"; then
    log "failed to list users"
    head -c 400 "$users_json" >&2 || true
    exit 1
  fi

  local user_id
  user_id="$(jq -r --arg email "$TEST_EMAIL" '.users[]? | select(.email == $email) | .id' "$users_json" | head -n 1)"
  if [[ -z "$user_id" ]]; then
    local create_body create_json="$TMP_DIR/user_create.json"
    create_body="$(jq -cn --arg email "$TEST_EMAIL" --arg password "$TEST_PASSWORD" '{email:$email,password:$password,email_confirm:true}')"
    if ! api_service_json POST "${SUPABASE_URL}/auth/v1/admin/users" "$create_body" "$create_json"; then
      log "failed to create test user"
      head -c 400 "$create_json" >&2 || true
      exit 1
    fi
    user_id="$(jq -r '.id // empty' "$create_json")"
    log "created user id=${user_id}"
  else
    local reset_body reset_json="$TMP_DIR/user_reset.json"
    reset_body="$(jq -cn --arg password "$TEST_PASSWORD" '{password:$password,email_confirm:true}')"
    if ! api_service_json PUT "${SUPABASE_URL}/auth/v1/admin/users/${user_id}" "$reset_body" "$reset_json"; then
      log "failed to reset test user password"
      head -c 400 "$reset_json" >&2 || true
      exit 1
    fi
    log "reset password for user id=${user_id}"
  fi

  if [[ -z "$TARGET_FAMILY_ID" ]]; then
    local families_json="$TMP_DIR/families.json"
    if ! api_service_json GET "${SUPABASE_URL}/rest/v1/families?select=id&order=created_at.asc&limit=1" "" "$families_json"; then
      log "failed to read families"
      head -c 400 "$families_json" >&2 || true
      exit 1
    fi
    TARGET_FAMILY_ID="$(jq -r '.[0].id // empty' "$families_json")"
  fi
  if [[ -z "$TARGET_FAMILY_ID" ]]; then
    log "family not found; set RELEASE_CHECK_FAMILY_ID or create family row"
    exit 1
  fi

  log "ensure membership user=${user_id} family=${TARGET_FAMILY_ID} role=${TEST_ROLE}"
  local member_json="$TMP_DIR/member_upsert.json"
  local member_body
  member_body="$(jq -cn --arg family_id "$TARGET_FAMILY_ID" --arg user_id "$user_id" --arg role "$TEST_ROLE" '[{family_id:$family_id,user_id:$user_id,role:$role}]')"
  if ! /usr/bin/curl -sS -m "$TIMEOUT_SECONDS" -o "$member_json" -w "%{http_code}" \
    -X POST \
    -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" \
    -H "Prefer: resolution=merge-duplicates,return=representation" \
    --data "$member_body" \
    "${SUPABASE_URL}/rest/v1/family_members?on_conflict=family_id,user_id" | awk '$1 >= 200 && $1 < 300 {ok=1} END {exit(ok?0:1)}'; then
    log "failed to upsert family_members"
    head -c 400 "$member_json" >&2 || true
    exit 1
  fi

  local token_json="$TMP_DIR/token.json"
  local token_body
  token_body="$(jq -cn --arg email "$TEST_EMAIL" --arg password "$TEST_PASSWORD" '{email:$email,password:$password}')"
  if ! api_anon_json POST "${SUPABASE_URL}/auth/v1/token?grant_type=password" "$token_body" "$token_json"; then
    log "failed to issue access token"
    head -c 400 "$token_json" >&2 || true
    exit 1
  fi

  local access_token
  access_token="$(jq -r '.access_token // empty' "$token_json")"
  if [[ -z "$access_token" ]]; then
    log "token response missing access_token"
    exit 1
  fi

  echo "$access_token"
}

main "$@"
