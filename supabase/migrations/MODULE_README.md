# MODULE_README (supabase/migrations)

## Rule

Only append new timestamped migration files; do not rewrite old migrations after shared usage.

## Option1 note

- Option1 (schema alignment to code) is split into two migration files to keep each file under 200 lines:
  - `20260420145000_align_family_schema_option1.sql`
  - `20260420145100_apply_family_rls_option1.sql`

## Structured note backfill

- `20260428083000_backfill_shift_overrides_structured_note_v1.sql`
  - 목적: legacy `shift_overrides.note`를 `calendar_override_v1` 표준 JSON으로 정규화.
  - 이유: UI(달력/시트)와 알림 경로가 동일한 구조를 읽도록 단일화.
