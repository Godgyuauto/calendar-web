#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${RESTORE_ENV_FILE:-${PROJECT_ROOT}/.env.local}"

if [[ "${RESTORE_LOAD_ENV:-1}" == "1" && -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

SUPABASE_URL="${SUPABASE_URL:-${NEXT_PUBLIC_SUPABASE_URL:-}}"
SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}"
RESTORE_TIMEOUT_SECONDS="${RESTORE_TIMEOUT_SECONDS:-12}"
RESTORE_APPLY="${RESTORE_APPLY:-0}"
RESTORE_CONFIRM="${RESTORE_CONFIRM:-}"
RESTORE_DIR="${RESTORE_DIR:-${1:-}}"

log() {
  printf '[restore] %s\n' "$*"
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    log "missing command: $1"
    exit 1
  }
}

resolve_latest_backup_dir() {
  local latest
  latest="$(ls -dt "${PROJECT_ROOT}/backups"/supabase_* 2>/dev/null | head -n 1 || true)"
  if [[ -n "$latest" ]]; then
    RESTORE_DIR="$latest"
  fi
}

conflict_columns_for_table() {
  case "$1" in
    families|shift_patterns|family_events|shift_overrides|agent_api_keys) echo "id" ;;
    family_members) echo "family_id,user_id" ;;
    *) echo "id" ;;
  esac
}

upsert_rows() {
  local table="$1"
  local file="$2"
  local on_conflict="$3"
  local code out
  out="$(mktemp /tmp/calendar-restore.XXXXXX)"
  code=$(/usr/bin/curl -sS -m "$RESTORE_TIMEOUT_SECONDS" -o "$out" -w "%{http_code}" \
    -X POST \
    -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" \
    -H "Prefer: resolution=merge-duplicates,return=minimal" \
    --data-binary "@${file}" \
    "${SUPABASE_URL}/rest/v1/${table}?on_conflict=${on_conflict}")
  if [[ "$code" -lt 200 || "$code" -ge 300 ]]; then
    log "upsert failed table=${table} status=${code}"
    head -c 300 "$out" >&2 || true
    rm -f "$out"
    return 1
  fi
  rm -f "$out"
}

main() {
  require_cmd /usr/bin/curl
  require_cmd jq

  if [[ -z "$RESTORE_DIR" ]]; then
    resolve_latest_backup_dir
  fi
  if [[ -z "$RESTORE_DIR" ]]; then
    log "restore directory not found (set RESTORE_DIR or pass path as first arg)"
    exit 1
  fi

  if [[ "$RESTORE_APPLY" == "1" ]]; then
    [[ "$RESTORE_CONFIRM" == "RESTORE_BACKUP_DATA" ]] || {
      log "REFUSED: set RESTORE_CONFIRM=RESTORE_BACKUP_DATA with RESTORE_APPLY=1"
      exit 1
    }
  fi

  if [[ -z "$SUPABASE_URL" || -z "$SUPABASE_SERVICE_ROLE_KEY" ]]; then
    log "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required"
    exit 1
  fi

  SUPABASE_URL="${SUPABASE_URL%/}"
  local manifest="${RESTORE_DIR}/manifest.json"
  [[ -f "$manifest" ]] || {
    log "manifest not found: ${manifest}"
    exit 1
  }

  local mode
  mode="dry-run"
  if [[ "$RESTORE_APPLY" == "1" ]]; then
    mode="apply"
  fi
  log "mode=${mode} restore_dir=${RESTORE_DIR}"

  local table file rows conflict
  while IFS=$'\t' read -r table rows; do
    [[ -z "$table" ]] && continue
    file="${RESTORE_DIR}/${table}.json"
    [[ -f "$file" ]] || {
      log "skip missing file: ${file}"
      continue
    }
    if [[ "$rows" == "0" ]]; then
      log "skip table=${table} rows=0"
      continue
    fi
    if [[ "$RESTORE_APPLY" != "1" ]]; then
      log "DRY-RUN: would upsert table=${table} rows=${rows}"
      continue
    fi

    conflict="$(conflict_columns_for_table "$table")"
    upsert_rows "$table" "$file" "$conflict"
    log "upserted table=${table} rows=${rows} on_conflict=${conflict}"
  done < <(jq -r '.tables[] | [.table, (.rows|tostring)] | @tsv' "$manifest")

  log "done"
}

main "$@"
