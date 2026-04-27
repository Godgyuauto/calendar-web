#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${BACKUP_ENV_FILE:-${PROJECT_ROOT}/.env.local}"

if [[ "${BACKUP_LOAD_ENV:-1}" == "1" && -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

SUPABASE_URL="${SUPABASE_URL:-${NEXT_PUBLIC_SUPABASE_URL:-}}"
SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}"
BACKUP_OUTPUT_ROOT="${BACKUP_OUTPUT_ROOT:-${PROJECT_ROOT}/backups}"
BACKUP_LABEL="${BACKUP_LABEL:-$(date +%Y%m%d_%H%M%S)}"
BACKUP_TIMEOUT_SECONDS="${BACKUP_TIMEOUT_SECONDS:-15}"
BACKUP_TABLES="${BACKUP_TABLES:-families,family_members,shift_patterns,family_events,shift_overrides,agent_api_keys}"
BACKUP_DIR="${BACKUP_DIR:-${BACKUP_OUTPUT_ROOT}/supabase_${BACKUP_LABEL}}"
BACKUP_PAGE_SIZE="${BACKUP_PAGE_SIZE:-1000}"

log() {
  printf '[backup] %s\n' "$*"
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    log "missing command: $1"
    exit 1
  }
}

# Fetch one Range page. Body to "$out", headers to "$headers_file",
# echoes http_code (caller validates 2xx + parses Content-Range).
api_get_page() {
  local url="$1"
  local range_from="$2"
  local range_to="$3"
  local out="$4"
  local headers_file="$5"

  /usr/bin/curl -sS -m "$BACKUP_TIMEOUT_SECONDS" \
    -o "$out" \
    -D "$headers_file" \
    -w "%{http_code}" \
    -X GET \
    -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Accept: application/json" \
    -H "Prefer: count=exact" \
    -H "Range-Unit: items" \
    -H "Range: ${range_from}-${range_to}" \
    "$url"
}

# Parse Content-Range header value like "0-999/12345" or "*/0".
# Echoes raw value or "?/?" if header missing.
parse_content_range() {
  local raw
  raw="$(awk 'BEGIN{IGNORECASE=1} /^content-range:/ {sub(/\r$/, ""); print $2; exit}' "$1" 2>/dev/null || true)"
  [[ -z "$raw" || "$raw" != *"/"* ]] && { echo "?/?"; return 0; }
  echo "$raw"
}

# Backup one table with pagination + JSON-array validation.
# Why: Supabase REST silently caps responses at ~1000 rows. Without count=exact +
# pagination, "table really has 1000 rows" vs "table has 50000 rows, got first
# 1000" is indistinguishable. Silent data loss in a backup tool is the worst kind.
backup_table() {
  local table="$1"
  local out="$2"
  local tmp_dir="$3"

  local from=0
  local to=$((BACKUP_PAGE_SIZE - 1))
  local total=-1
  local accumulated=0
  local pages_file="${tmp_dir}/${table}.pages.jsonl"
  : >"$pages_file"

  while true; do
    local body_file="${tmp_dir}/${table}.page.${from}.json"
    local headers_file="${tmp_dir}/${table}.headers.${from}.txt"
    local code
    code="$(api_get_page \
      "${SUPABASE_URL}/rest/v1/${table}?select=*" \
      "$from" "$to" "$body_file" "$headers_file")"

    if [[ "$code" -lt 200 || "$code" -ge 300 ]]; then
      log "table=${table} HTTP ${code}"
      head -c 300 "$body_file" >&2 || true
      return 1
    fi

    if ! jq -e 'type == "array"' "$body_file" >/dev/null 2>&1; then
      log "table=${table} response is not a JSON array (possible RLS / schema error)"
      head -c 300 "$body_file" >&2 || true
      return 1
    fi

    local page_len
    page_len="$(jq 'length' "$body_file")"
    accumulated=$((accumulated + page_len))

    # One JSON array per line; we will jq-flatten at the end.
    cat "$body_file" >>"$pages_file"
    printf '\n' >>"$pages_file"

    local cr
    cr="$(parse_content_range "$headers_file")"
    if [[ "$cr" != "?/?" ]]; then
      total="${cr#*/}"
      [[ "$total" == "*" ]] && total=-1
    fi

    # Stop when we've consumed all rows or this page was short.
    if [[ "$total" -ge 0 && "$accumulated" -ge "$total" ]]; then
      break
    fi
    if [[ "$page_len" -lt "$BACKUP_PAGE_SIZE" ]]; then
      break
    fi

    from=$((from + BACKUP_PAGE_SIZE))
    to=$((to + BACKUP_PAGE_SIZE))
  done

  # Concat page arrays into one array (jq -s slurps; `add` flattens).
  jq -s '. | add // []' "$pages_file" >"$out"

  local final_len
  final_len="$(jq 'length' "$out")"
  if [[ "$total" -ge 0 && "$final_len" -ne "$total" ]]; then
    log "table=${table} WARN row mismatch: got=${final_len} expected=${total}"
    return 1
  fi

  echo "$final_len"
}

main() {
  require_cmd /usr/bin/curl
  require_cmd jq

  if [[ -z "$SUPABASE_URL" || -z "$SUPABASE_SERVICE_ROLE_KEY" ]]; then
    log "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required"
    exit 1
  fi

  SUPABASE_URL="${SUPABASE_URL%/}"
  mkdir -p "$BACKUP_DIR"
  log "backup_dir=${BACKUP_DIR} page_size=${BACKUP_PAGE_SIZE}"

  local tmp_dir
  tmp_dir="$(mktemp -d /tmp/calendar-backup.XXXXXX)"
  # Double quotes bake $tmp_dir NOW (local in scope); single-quoted trap = leak.
  trap "rm -rf '$tmp_dir'" EXIT

  local summary_file="${BACKUP_DIR}/tables.tsv"
  local table out rows
  : >"$summary_file"

  IFS=',' read -r -a tables <<<"$BACKUP_TABLES"
  for table in "${tables[@]}"; do
    table="$(echo "$table" | xargs)"
    [[ -z "$table" ]] && continue
    out="${BACKUP_DIR}/${table}.json"
    if ! rows="$(backup_table "$table" "$out" "$tmp_dir")"; then
      log "failed to backup table=${table}"
      exit 1
    fi
    printf '%s\t%s\n' "$table" "$rows" >>"$summary_file"
    log "table=${table} rows=${rows}"
  done

  local tables_json
  tables_json="$(jq -Rn '
    [inputs | split("\t") | {table: .[0], rows: (.[1] | tonumber)}]
  ' <"$summary_file")"

  jq -n \
    --arg createdAt "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
    --arg supabaseUrl "$SUPABASE_URL" \
    --arg backupDir "$BACKUP_DIR" \
    --arg pageSize "$BACKUP_PAGE_SIZE" \
    --argjson tables "$tables_json" \
    '{
      createdAt: $createdAt,
      supabaseUrl: $supabaseUrl,
      backupDir: $backupDir,
      pageSize: ($pageSize | tonumber),
      tables: $tables
    }' >"${BACKUP_DIR}/manifest.json"

  log "done: manifest=${BACKUP_DIR}/manifest.json"
}

main "$@"
