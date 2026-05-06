#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${CLEANUP_ENV_FILE:-${PROJECT_ROOT}/.env.local}"
[[ "${CLEANUP_LOAD_ENV:-1}" == "1" && -f "$ENV_FILE" ]] && set -a && source "$ENV_FILE" && set +a
SUPABASE_URL="${SUPABASE_URL:-${NEXT_PUBLIC_SUPABASE_URL:-}}"
SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}"
EMAIL_EXACT="${CLEANUP_EMAIL_EXACT:-}"
EMAIL_PREFIX="${CLEANUP_EMAIL_PREFIX:-codex.verify.}"
EMAIL_SUFFIX="${CLEANUP_EMAIL_SUFFIX:-@example.com}"
MAX_USERS="${CLEANUP_MAX_USERS:-50}"
PER_PAGE="${CLEANUP_PER_PAGE:-200}"
TIMEOUT_SECONDS="${CLEANUP_TIMEOUT_SECONDS:-10}"
DELETE_ORPHAN_FAMILIES="${CLEANUP_DELETE_ORPHAN_FAMILIES:-0}"

DRY_RUN=1
if [[ "${CLEANUP_APPLY:-0}" == "1" ]]; then
  [[ "${CLEANUP_CONFIRM:-}" == "DELETE_TEST_DATA" ]] || {
    echo "[cleanup] REFUSED: set CLEANUP_CONFIRM=DELETE_TEST_DATA with CLEANUP_APPLY=1" >&2
    exit 1
  }
  DRY_RUN=0
fi

for c in /usr/bin/curl jq; do
  command -v "$c" >/dev/null 2>&1 || { echo "[cleanup] missing command: $c" >&2; exit 1; }
done
[[ -n "$SUPABASE_URL" && -n "$SUPABASE_SERVICE_ROLE_KEY" ]] || {
  echo "[cleanup] SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required" >&2
  exit 1
}
if [[ -n "$EMAIL_EXACT" ]]; then
  [[ "$EMAIL_EXACT" == *"@"* ]] || {
    echo "[cleanup] CLEANUP_EMAIL_EXACT must be a valid email" >&2
    exit 1
  }
else
  [[ -n "$EMAIL_PREFIX" && "${#EMAIL_PREFIX}" -ge 4 ]] || {
    echo "[cleanup] CLEANUP_EMAIL_PREFIX is too short; refuse to run" >&2
    exit 1
  }
fi

SUPABASE_URL="${SUPABASE_URL%/}"
TMP_DIR="$(mktemp -d /tmp/calendar-cleanup.XXXXXX)"
trap 'rm -rf "$TMP_DIR"' EXIT
PASS_COUNT=0
WARN_COUNT=0
ERR_COUNT=0
TARGET_COUNT=0
TARGETS_FILE=""
log() { printf '[cleanup] %s\n' "$*"; }
warn() { WARN_COUNT=$((WARN_COUNT + 1)); log "WARN: $*"; }
err() { ERR_COUNT=$((ERR_COUNT + 1)); log "ERROR: $*"; }

api_json() {
  local method="$1" url="$2" output="$3" code
  code=$(/usr/bin/curl -sS -m "$TIMEOUT_SECONDS" -o "$output" -w "%{http_code}" \
    -X "$method" \
    -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
    "$url")
  if [[ "$code" -lt 200 || "$code" -ge 300 ]]; then
    log "HTTP ${code} ${method} ${url}"
    [[ -f "$output" ]] && head -c 400 "$output" | tr '\n' ' ' && echo
    return 1
  fi
}
COUNT_ROWS_SEQ=0
count_rows() {
  # Why $RANDOM + counter instead of $(date +%s%N): macOS BSD `date` does not
  # support %N (nanoseconds). It would emit a literal "%N" causing temp-file
  # name collisions when the same (table,filter) is queried twice in one second.
  COUNT_ROWS_SEQ=$((COUNT_ROWS_SEQ + 1))
  local table="$1" filter="$2" out
  out="$TMP_DIR/count_${table}_${COUNT_ROWS_SEQ}_${RANDOM}.json"
  api_json GET "${SUPABASE_URL}/rest/v1/${table}?select=id&${filter}" "$out"
  jq 'length' "$out"
}
delete_rows() {
  local table="$1" filter="$2" code
  code=$(/usr/bin/curl -sS -m "$TIMEOUT_SECONDS" -o /dev/null -w "%{http_code}" \
    -X DELETE \
    -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Prefer: return=minimal" \
    "${SUPABASE_URL}/rest/v1/${table}?${filter}")
  [[ "$code" -ge 200 && "$code" -lt 300 ]]
}
delete_auth_user() {
  local user_id="$1" code
  code=$(/usr/bin/curl -sS -m "$TIMEOUT_SECONDS" -o /dev/null -w "%{http_code}" \
    -X DELETE \
    -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
    "${SUPABASE_URL}/auth/v1/admin/users/${user_id}")
  [[ "$code" -ge 200 && "$code" -lt 300 ]]
}
collect_targets() {
  local page=1 total_users=0
  TARGETS_FILE="$TMP_DIR/targets.tsv"
  : >"$TARGETS_FILE"
  while true; do
    local out="$TMP_DIR/users_${page}.json" page_count
    api_json GET "${SUPABASE_URL}/auth/v1/admin/users?page=${page}&per_page=${PER_PAGE}" "$out" || return 1
    page_count="$(jq '.users | length' "$out")"
    total_users=$((total_users + page_count))
    jq -r --arg p "$EMAIL_PREFIX" --arg s "$EMAIL_SUFFIX" \
      --arg exact "$EMAIL_EXACT" \
      '.users[]?
      | (.email // "") as $email
      | select(
          ($exact != "" and $email == $exact) or
          ($exact == "" and ($email | startswith($p)) and ($email | endswith($s)))
        )
      | [.id, $email]
      | @tsv' \
      "$out" >>"$TARGETS_FILE"
    [[ "$page_count" -lt "$PER_PAGE" ]] && break
    page=$((page + 1))
  done
  TARGET_COUNT="$(wc -l <"$TARGETS_FILE" | tr -d ' ')"
  log "scan complete: total_users=${total_users}, matched_targets=${TARGET_COUNT}"
  if [[ "$TARGET_COUNT" -gt "$MAX_USERS" ]]; then
    err "matched target users (${TARGET_COUNT}) exceeds CLEANUP_MAX_USERS (${MAX_USERS}); refuse to continue"
    return 1
  fi
}
cleanup_user() {
  local user_id="$1" email="$2"
  log "target user: ${email} (${user_id})"
  local rules=(
    "family_events created_by"
    "shift_patterns created_by"
    "agent_api_keys created_by"
    "shift_overrides user_id"
    "family_members user_id"
  )
  local table column filter n
  for rule in "${rules[@]}"; do
    table="${rule%% *}"; column="${rule##* }"; filter="${column}=eq.${user_id}"
    n="$(count_rows "$table" "$filter")" || { err "count failed: ${table}.${column} for ${email}"; continue; }
    [[ "$n" -eq 0 ]] && continue
    if [[ "$DRY_RUN" -eq 1 ]]; then
      log "DRY-RUN: would delete ${n} rows from ${table} where ${column}=${user_id}"
    elif delete_rows "$table" "$filter"; then
      log "deleted ${n} rows from ${table}"; PASS_COUNT=$((PASS_COUNT + 1))
    else
      err "delete failed: ${table}.${column} for ${email}"
    fi
  done
  if [[ "$DRY_RUN" -eq 1 ]]; then
    log "DRY-RUN: would delete auth user ${email}"
  elif delete_auth_user "$user_id"; then
    log "deleted auth user ${email}"; PASS_COUNT=$((PASS_COUNT + 1))
  else
    err "delete auth user failed: ${email}"
  fi
}
cleanup_orphans() {
  local fjson="$TMP_DIR/families.json"
  api_json GET "${SUPABASE_URL}/rest/v1/families?select=id" "$fjson" || return 1
  local fid members
  while IFS= read -r fid; do
    members="$(count_rows "family_members" "family_id=eq.${fid}")" || { err "count failed for family ${fid}"; continue; }
    [[ "$members" -ne 0 ]] && continue
    if [[ "$DRY_RUN" -eq 1 ]]; then
      log "DRY-RUN: would delete orphan family ${fid}"
    elif delete_rows "families" "id=eq.${fid}"; then
      log "deleted orphan family ${fid}"; PASS_COUNT=$((PASS_COUNT + 1))
    else
      err "delete failed for orphan family ${fid}"
    fi
  done < <(jq -r '.[].id' "$fjson")
}
main() {
  log "mode=$([[ "$DRY_RUN" -eq 1 ]] && echo dry-run || echo apply)"
  [[ -n "$EMAIL_EXACT" ]] && log "target email exact: ${EMAIL_EXACT}" \
    || log "target email pattern: prefix='${EMAIL_PREFIX}', suffix='${EMAIL_SUFFIX}'"
  collect_targets || exit 1
  if [[ "$TARGET_COUNT" -eq 0 ]]; then
    log "no target users found"
    exit 0
  fi
  while IFS=$'\t' read -r uid email; do
    [[ -z "$uid" || -z "$email" ]] && continue
    cleanup_user "$uid" "$email"
  done <"$TARGETS_FILE"
  if [[ "$DELETE_ORPHAN_FAMILIES" == "1" ]]; then
    cleanup_orphans
  else
    warn "orphan family cleanup skipped (set CLEANUP_DELETE_ORPHAN_FAMILIES=1 to include)"
  fi
  log "summary: targets=${TARGET_COUNT} pass=${PASS_COUNT} warn=${WARN_COUNT} error=${ERR_COUNT}"
  [[ "$ERR_COUNT" -eq 0 ]]
}
main "$@"
