#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

OPS_CLEANUP_EMAIL_PREFIX="${OPS_CLEANUP_EMAIL_PREFIX:-test_}"
OPS_CLEANUP_EMAIL_SUFFIX="${OPS_CLEANUP_EMAIL_SUFFIX:-@example.com}"
OPS_CLEANUP_ALLOWED_EMAIL_SUFFIXES="${OPS_CLEANUP_ALLOWED_EMAIL_SUFFIXES:-@example.com}"
OPS_CLEANUP_MAX_USERS="${OPS_CLEANUP_MAX_USERS:-20}"
OPS_CLEANUP_DELETE_ORPHAN_FAMILIES="${OPS_CLEANUP_DELETE_ORPHAN_FAMILIES:-0}"
OPS_CLEANUP_ENV_FILE="${OPS_CLEANUP_ENV_FILE:-${PROJECT_ROOT}/.env.local}"
OPS_CLEANUP_APPLY="${OPS_CLEANUP_APPLY:-0}"
OPS_CLEANUP_CONFIRM="${OPS_CLEANUP_CONFIRM:-}"

log() {
  printf '[ops-cleanup] %s\n' "$*"
}

require_number_in_range() {
  local value="$1" min="$2" max="$3" name="$4"
  if ! [[ "$value" =~ ^[0-9]+$ ]]; then
    log "REFUSED: ${name} must be an integer (got '${value}')"
    exit 1
  fi
  if (( value < min || value > max )); then
    log "REFUSED: ${name} must be in range ${min}..${max} (got '${value}')"
    exit 1
  fi
}

validate_suffix_allow_list() {
  local normalized_target normalized_candidate
  local -a allowed_suffixes

  IFS=',' read -r -a allowed_suffixes <<<"${OPS_CLEANUP_ALLOWED_EMAIL_SUFFIXES}"
  normalized_target="$(echo "${OPS_CLEANUP_EMAIL_SUFFIX}" | xargs)"

  for candidate in "${allowed_suffixes[@]}"; do
    normalized_candidate="$(echo "${candidate}" | xargs)"
    [[ -z "$normalized_candidate" ]] && continue
    if [[ "$normalized_candidate" == "$normalized_target" ]]; then
      return 0
    fi
  done
  return 1
}

main() {
  # Why this wrapper exists:
  # cleanup-test-data.sh is a generic cleanup utility. This wrapper constrains
  # execution to test_ accounts so scheduled runs cannot broaden scope by mistake.
  [[ "$OPS_CLEANUP_EMAIL_PREFIX" == test_* ]] || {
    log "REFUSED: OPS_CLEANUP_EMAIL_PREFIX must start with 'test_'"
    exit 1
  }

  validate_suffix_allow_list || {
    log "REFUSED: OPS_CLEANUP_EMAIL_SUFFIX='${OPS_CLEANUP_EMAIL_SUFFIX}' is not in OPS_CLEANUP_ALLOWED_EMAIL_SUFFIXES"
    exit 1
  }

  require_number_in_range "$OPS_CLEANUP_MAX_USERS" 1 200 "OPS_CLEANUP_MAX_USERS"
  [[ "$OPS_CLEANUP_DELETE_ORPHAN_FAMILIES" == "0" || "$OPS_CLEANUP_DELETE_ORPHAN_FAMILIES" == "1" ]] || {
    log "REFUSED: OPS_CLEANUP_DELETE_ORPHAN_FAMILIES must be 0 or 1"
    exit 1
  }

  local -a cleanup_env
  cleanup_env=(
    "CLEANUP_ENV_FILE=${OPS_CLEANUP_ENV_FILE}"
    "CLEANUP_EMAIL_PREFIX=${OPS_CLEANUP_EMAIL_PREFIX}"
    "CLEANUP_EMAIL_SUFFIX=${OPS_CLEANUP_EMAIL_SUFFIX}"
    "CLEANUP_MAX_USERS=${OPS_CLEANUP_MAX_USERS}"
    "CLEANUP_DELETE_ORPHAN_FAMILIES=${OPS_CLEANUP_DELETE_ORPHAN_FAMILIES}"
  )

  if [[ "$OPS_CLEANUP_APPLY" == "1" ]]; then
    [[ "$OPS_CLEANUP_CONFIRM" == "RUN_TEST_PREFIX_CLEANUP" ]] || {
      log "REFUSED: set OPS_CLEANUP_CONFIRM=RUN_TEST_PREFIX_CLEANUP with OPS_CLEANUP_APPLY=1"
      exit 1
    }
    # Why double-confirm: this wrapper requires one confirmation, and the
    # underlying script requires another confirmation before actual delete.
    cleanup_env+=("CLEANUP_APPLY=1" "CLEANUP_CONFIRM=DELETE_TEST_DATA")
  fi

  log "run cleanup-test-data.sh (apply=${OPS_CLEANUP_APPLY}, prefix='${OPS_CLEANUP_EMAIL_PREFIX}', suffix='${OPS_CLEANUP_EMAIL_SUFFIX}', max_users=${OPS_CLEANUP_MAX_USERS})"
  env "${cleanup_env[@]}" bash "${SCRIPT_DIR}/cleanup-test-data.sh"
}

main "$@"
