-- Drop unused legacy tables that pre-date the normalized family schema.
-- Pre-audit (Part6, 2026-04-28):
--   - daily_contexts: 0 rows, 0 code refs, 0 FK deps -> safe drop.
--   - family_info: 1 row, 0 runtime refs (only legacy migration backfill),
--     0 FK deps -> data backed up to backups/legacy_drop_20260428/family_info.json.
--   - routines: 3 rows, 0 code refs, 0 FK deps ->
--     data backed up to backups/legacy_drop_20260428/routines.json.
-- All three tables are user_id-keyed (not family_id-scoped) and predate the
-- families/family_members/shift_patterns normalization. Their content is
-- either obsolete or already migrated to current tables.

drop table if exists public.daily_contexts;
drop table if exists public.family_info;
drop table if exists public.routines;
