# MODULE_README (scripts)

## Why this folder exists

Stores executable scripts that standardize checks across developers/agents.

## What goes here

- `smoke.sh`: single-command API/UI health probe.
- `release-check.sh`: fixed release loop (`lint -> typecheck -> build -> smoke`).
- `issue-test-token.sh`: bootstraps a verification user + membership and returns an access token.
- `verify-notify-queue.sh`: runtime schema preflight + queue status snapshot (`pending/sent/failed`) for notify operations.
- `verify-notify-e2e-dry.sh`: dry end-to-end notify verification (token -> event create -> remind marker -> queue check -> cleanup).
- `cleanup-test-data.sh`: dry-run-first cleanup for verification users/data.
- `cleanup-test-prefix-auto.sh`: schedule-friendly wrapper for `test_` account cleanup with strict guard rails.
- `backup-supabase.sh`: JSON snapshot backup for key family/shift tables.
- `restore-backup.sh`: dry-run-first restore (merge upsert) from backup snapshot.
- `query-api-logs.sh`: quick filter/summary tool for `kind=api-route` logs.
- `LOG_STANDARD.md`: API log fields + command comments ("이 명령어는 이거입니다").

## Agent safe edit guide

- Keep scripts deterministic and side-effect free by default.
- Destructive scripts must default to dry-run and require explicit confirmation flags.
