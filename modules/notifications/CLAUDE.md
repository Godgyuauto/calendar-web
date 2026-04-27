# modules/notifications — server-side notification helpers

## Responsibility

- Holds small server-side helpers and operational notes for notification delivery.
- Database scheduling lives in `supabase/migrations`.
- Supabase Edge Function runtime code lives in `supabase/functions/dispatch-notifications`.

## Rules

- Do not hardcode tokens, chat IDs, or project URLs.
- Keep delivery helpers side-effect explicit and return structured results.
- Time-based behavior must name `Asia/Seoul` when formatting or documenting reminders.
