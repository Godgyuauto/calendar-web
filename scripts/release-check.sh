#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

RELEASE_CHECK_PORT="${RELEASE_CHECK_PORT:-3100}"
RELEASE_CHECK_BASE_URL="${RELEASE_CHECK_BASE_URL:-http://127.0.0.1:${RELEASE_CHECK_PORT}}"
RELEASE_CHECK_WAIT_SECONDS="${RELEASE_CHECK_WAIT_SECONDS:-25}"
RELEASE_CHECK_REQUIRE_AUTH="${RELEASE_CHECK_REQUIRE_AUTH:-0}"
RELEASE_CHECK_ACCESS_TOKEN="${RELEASE_CHECK_ACCESS_TOKEN:-${SMOKE_ACCESS_TOKEN:-${ACCESS_TOKEN:-}}}"
RELEASE_CHECK_SKIP_SMOKE="${RELEASE_CHECK_SKIP_SMOKE:-0}"
RELEASE_CHECK_AUTO_AUTH_TOKEN="${RELEASE_CHECK_AUTO_AUTH_TOKEN:-1}"
RELEASE_CHECK_TEST_EMAIL="${RELEASE_CHECK_TEST_EMAIL:-codex.verify.release@example.com}"
RELEASE_CHECK_CLEANUP_AFTER_AUTH="${RELEASE_CHECK_CLEANUP_AFTER_AUTH:-0}"
RELEASE_CHECK_CLEANUP_APPLY="${RELEASE_CHECK_CLEANUP_APPLY:-0}"
RELEASE_CHECK_CLEANUP_ORPHAN_FAMILIES="${RELEASE_CHECK_CLEANUP_ORPHAN_FAMILIES:-0}"

SERVER_PID=""
SERVER_LOG="/tmp/calendar-release-check-server.log"
AUTO_TOKEN_ISSUED=0

log() {
  printf '[release-check] %s\n' "$*"
}

cleanup() {
  if [[ -n "$SERVER_PID" ]] && kill -0 "$SERVER_PID" >/dev/null 2>&1; then
    kill "$SERVER_PID" >/dev/null 2>&1 || true
    wait "$SERVER_PID" >/dev/null 2>&1 || true
    log "stopped server pid=${SERVER_PID}"
  fi
}

wait_for_server() {
  local deadline=$((SECONDS + RELEASE_CHECK_WAIT_SECONDS))
  while [[ "$SECONDS" -lt "$deadline" ]]; do
    local code
    code=$(/usr/bin/curl -s -o /dev/null -w "%{http_code}" "${RELEASE_CHECK_BASE_URL}/api/shifts/today" || true)
    if [[ "$code" == "200" ]]; then
      return 0
    fi
    sleep 1
  done
  return 1
}

run_step() {
  local name="$1"
  shift
  log "step: ${name}"
  "$@"
}

start_server() {
  log "start local server: ${RELEASE_CHECK_BASE_URL}"
  PORT="$RELEASE_CHECK_PORT" pnpm run start >"$SERVER_LOG" 2>&1 &
  SERVER_PID="$!"
  if ! wait_for_server; then
    log "server failed to become ready in ${RELEASE_CHECK_WAIT_SECONDS}s"
    if [[ -f "$SERVER_LOG" ]]; then
      tail -n 80 "$SERVER_LOG"
    fi
    return 1
  fi
  log "server ready"
}

run_smoke() {
  local -a env_args
  env_args=("SMOKE_BASE_URL=${RELEASE_CHECK_BASE_URL}" "SMOKE_REQUIRE_AUTH=${RELEASE_CHECK_REQUIRE_AUTH}")
  if [[ -n "$RELEASE_CHECK_ACCESS_TOKEN" ]]; then
    env_args+=("SMOKE_ACCESS_TOKEN=${RELEASE_CHECK_ACCESS_TOKEN}")
  fi

  log "step: smoke (base_url=${RELEASE_CHECK_BASE_URL}, require_auth=${RELEASE_CHECK_REQUIRE_AUTH})"
  env "${env_args[@]}" pnpm run smoke
}

resolve_access_token() {
  if [[ "$RELEASE_CHECK_REQUIRE_AUTH" != "1" ]]; then
    return 0
  fi

  if [[ -n "$RELEASE_CHECK_ACCESS_TOKEN" ]]; then
    log "auth token already provided"
    return 0
  fi

  if [[ "$RELEASE_CHECK_AUTO_AUTH_TOKEN" != "1" ]]; then
    log "auth required but no access token was provided"
    return 1
  fi

  log "auth required; issuing test access token automatically"
  RELEASE_CHECK_ACCESS_TOKEN="$(
    RELEASE_CHECK_TEST_EMAIL="${RELEASE_CHECK_TEST_EMAIL}" \
      bash "${SCRIPT_DIR}/issue-test-token.sh"
  )"
  if [[ -z "$RELEASE_CHECK_ACCESS_TOKEN" ]]; then
    log "failed to resolve access token"
    return 1
  fi
  AUTO_TOKEN_ISSUED=1
}

run_cleanup_if_needed() {
  if [[ "$RELEASE_CHECK_CLEANUP_AFTER_AUTH" != "1" ]]; then
    return 0
  fi
  if [[ "$RELEASE_CHECK_REQUIRE_AUTH" != "1" ]]; then
    log "cleanup skipped (RELEASE_CHECK_REQUIRE_AUTH=0)"
    return 0
  fi
  if [[ "$AUTO_TOKEN_ISSUED" != "1" ]]; then
    log "cleanup skipped (token was provided externally)"
    return 0
  fi

  local -a env_args
  env_args=(
    "CLEANUP_EMAIL_EXACT=${RELEASE_CHECK_TEST_EMAIL}"
    "CLEANUP_DELETE_ORPHAN_FAMILIES=${RELEASE_CHECK_CLEANUP_ORPHAN_FAMILIES}"
  )
  if [[ "$RELEASE_CHECK_CLEANUP_APPLY" == "1" ]]; then
    env_args+=("CLEANUP_APPLY=1" "CLEANUP_CONFIRM=DELETE_TEST_DATA")
  fi

  log "cleanup verification artifacts (apply=${RELEASE_CHECK_CLEANUP_APPLY})"
  env "${env_args[@]}" bash "${SCRIPT_DIR}/cleanup-test-data.sh"
}

main() {
  trap cleanup EXIT
  cd "$PROJECT_ROOT"

  run_step "test" pnpm run test
  run_step "lint" pnpm lint
  run_step "typecheck" pnpm run typecheck
  run_step "build" pnpm run build

  if [[ "$RELEASE_CHECK_SKIP_SMOKE" == "1" ]]; then
    log "skip smoke enabled (RELEASE_CHECK_SKIP_SMOKE=1)"
    log "release check passed (lint/typecheck/build)"
    return 0
  fi

  resolve_access_token
  start_server
  local smoke_status=0
  local cleanup_status=0

  run_smoke || smoke_status=$?
  run_cleanup_if_needed || cleanup_status=$?

  if [[ "$smoke_status" -ne 0 || "$cleanup_status" -ne 0 ]]; then
    return 1
  fi
  log "release check passed"
}

main "$@"
