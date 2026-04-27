# supabase/migrations

SQL migration files ordered by timestamp.

## Current files

- `20260418215000_initial_schema.sql`
  - Initial draft schema + RLS.
- `20260420145000_align_family_schema_option1.sql`
  - Option1 schema alignment:
  - create missing PRD tables (`families`, `family_members`, `shift_overrides`)
  - normalize legacy `family_events(jsonb)` shape to API-required columns
  - backfill family/member rows from legacy `family_info` and `family_events.user_id`
- `20260420145100_apply_family_rls_option1.sql`
  - apply constraints and canonical RLS/policies for family-scoped access.
- `20260424113000_add_family_members_working.sql`
  - add persistent `family_members.working` flag for members/settings.
