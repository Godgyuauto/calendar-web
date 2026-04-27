# scripts

Reusable project scripts for local verification and developer workflows.

- Log policy: `scripts/LOG_STANDARD.md`

## Smoke check

```bash
pnpm run smoke
```

- Default target: `http://localhost:3000`
- Override target: `SMOKE_BASE_URL=https://your-host pnpm run smoke`
- Optional auth checks: `SMOKE_ACCESS_TOKEN=<jwt> pnpm run smoke`
- Enforce auth checks: `SMOKE_REQUIRE_AUTH=1 SMOKE_ACCESS_TOKEN=<jwt> pnpm run smoke`

## Release check (fixed loop)

```bash
pnpm run verify:release
```

Runs fixed order:

1. `pnpm lint`
2. `pnpm run typecheck`
3. `pnpm run build`
4. start server on port `3100` (default)
5. `pnpm run smoke`
6. stop server

Options:

- `RELEASE_CHECK_PORT=3200`
- `RELEASE_CHECK_BASE_URL=http://127.0.0.1:3200`
- `RELEASE_CHECK_ACCESS_TOKEN=<jwt>`
- `RELEASE_CHECK_REQUIRE_AUTH=1`
- `RELEASE_CHECK_AUTO_AUTH_TOKEN=1` (default, auto issue test token if auth is required and token is missing)
- `RELEASE_CHECK_SKIP_SMOKE=1` (only lint/typecheck/build)

Auth-included release check:

```bash
pnpm run verify:release:auth
pnpm run verify:release:auth:cleanup
```

- Requires Supabase env vars (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
- Automatically creates/resets a verification user and issues a short-lived token for smoke auth checks
- `verify:release:auth:cleanup` also runs post-check cleanup for the exact verification email

Manual token issue:

```bash
pnpm run token:test-user
```

## Notify queue verification loop (dry-run first)

Queue snapshot:

```bash
pnpm run verify:notify:queue
```

- This command checks runtime OpenAPI first and tries to detect:
  - event remind source (`family_events.remind_at` or `family_events.data.remind_at`)
  - notify queue table + status timestamp columns
- If queue schema is missing, script exits with `BLOCKED` and required next action.

End-to-end dry verification:

```bash
pnpm run verify:notify:e2e:dry
```

- Fixed dry flow:
  1. issue test token
  2. create one structured event via `/api/events`
  3. store a dry-run `remind_at` marker in `family_events.data` when possible
  4. run queue snapshot check
  5. delete the test event (default)
- Override examples:
  - keep event: `NOTIFY_E2E_KEEP_EVENT=1 pnpm run verify:notify:e2e:dry`
  - allow missing queue schema: `NOTIFY_E2E_QUEUE_ALLOW_MISSING=1 pnpm run verify:notify:e2e:dry`

## Test data cleanup

Preview only (default dry-run):

```bash
pnpm run cleanup:test-data
```

Apply delete:

```bash
pnpm run cleanup:test-data:apply
```

Optional filters:

- `CLEANUP_EMAIL_EXACT=codex.verify.release@example.com` (exact target only)
- `CLEANUP_EMAIL_PREFIX` (default: `codex.verify.`)
- `CLEANUP_EMAIL_SUFFIX` (default: `@example.com`)
- `CLEANUP_MAX_USERS` (default: `50`)
- `CLEANUP_DELETE_ORPHAN_FAMILIES=1` (optional orphan family cleanup)

## Ops automation: `test_` prefix cleanup

Schedule-friendly wrapper:

```bash
bash ./scripts/cleanup-test-prefix-auto.sh
```

- Default mode is dry-run.
- Default target pattern: `test_*@example.com`
- Guard rails:
  - refuses when prefix does not start with `test_`
  - refuses when suffix is not in `OPS_CLEANUP_ALLOWED_EMAIL_SUFFIXES`
  - refuses when `OPS_CLEANUP_MAX_USERS` is out of `1..200`

Apply mode (double confirmation):

```bash
OPS_CLEANUP_APPLY=1 \
OPS_CLEANUP_CONFIRM=RUN_TEST_PREFIX_CLEANUP \
bash ./scripts/cleanup-test-prefix-auto.sh
```

- This wrapper requires `OPS_CLEANUP_CONFIRM=RUN_TEST_PREFIX_CLEANUP`
- Underlying cleanup script still requires `CLEANUP_CONFIRM=DELETE_TEST_DATA` internally

Suggested scheduler command (example):

```bash
cd /path/to/calendar-web && \
OPS_CLEANUP_APPLY=1 OPS_CLEANUP_CONFIRM=RUN_TEST_PREFIX_CLEANUP \
bash ./scripts/cleanup-test-prefix-auto.sh
```

- The repository provides executable path only; cron/CI registration itself is an external manual step.

## Backup / Restore

Create JSON snapshot:

```bash
pnpm run backup:data
```

- Output: `backups/supabase_<timestamp>/`
- Files: `manifest.json` + one JSON per table

Restore snapshot (dry-run by default):

```bash
pnpm run restore:data
pnpm run restore:data:apply
```

- `restore:data` shows what will be upserted
- `restore:data:apply` performs merge-upsert restore with explicit confirm flag

## API log query shortcuts

```bash
pnpm run logs:api
pnpm run logs:api:fail
pnpm run logs:api:lines
```

- Default source: `/tmp/calendar-release-check-server.log`
- Filter examples:
  - `LOG_QUERY_ROUTE=/api/events pnpm run logs:api`
  - `LOG_QUERY_STATUS=500 pnpm run logs:api:fail`
