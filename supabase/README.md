# supabase

Database migration and Supabase-related notes.

## Migration policy

- `supabase/migrations` is append-only.
- Runtime hotfixes applied directly in Supabase must be exported back into a new migration file.
- Do not edit or reorder previous migration files.

## Latest sync

- `20260421090000_sync_runtime_rls_policies.sql`
  - Re-asserts non-recursive `family_members_select_own_family` policy.
  - Drops legacy `family_events` policies (`Allow all`, `Users can only access their own events`).
  - Re-asserts canonical `family_events_read_family` / `family_events_write_family`.
- `20260424113000_add_family_members_working.sql`
  - Adds `family_members.working boolean not null default true`.
  - Backfills null rows to `true` for compatibility.

## Backup / Restore Policy (Fact-based)

The current backup tooling is script-based JSON snapshot export/import:

- Backup command: `pnpm run backup:data`
- Restore dry-run: `pnpm run restore:data`
- Restore apply: `pnpm run restore:data:apply`

What is automated now:

- `scripts/backup-supabase.sh` exports table snapshots to `backups/supabase_<timestamp>/`.
- Covered tables default: `families`, `family_members`, `shift_patterns`, `family_events`, `shift_overrides`, `agent_api_keys`.
- Pagination + count verification are built in to avoid silent truncation.
- `scripts/restore-backup.sh` supports dry-run by default and merge-upsert restore in apply mode.
- Apply restore requires explicit confirmation (`RESTORE_APPLY=1` + `RESTORE_CONFIRM=RESTORE_BACKUP_DATA`).

What is still manual:

- No in-repo scheduler is provisioned. Running backups on a fixed schedule (cron/CI/Supabase scheduled Edge Function) is an external ops setup step.
- No automated PITR trigger is configured by this repository.
- Restore execution decision remains operator-driven manual action.

Operational baseline:

- Run backup before release or schema-sensitive maintenance.
- Keep dry-run restore verification logs before first apply in each environment.
- Store backup artifacts in access-controlled storage outside local machine retention.
