# Notification Engine Backend

This module documents the backend notification engine prepared for 24/7 serverless delivery.

## Data Model

The migration `supabase/migrations/20260427090000_add_notification_jobs.sql` adds `public.notification_jobs`.

Required reliability fields:

- `remind_at`: delivery due time stored as `timestamptz`.
- `status`: `pending`, `sent`, or `failed`.
- `attempt_count`: incremented when the Edge Function claims a job.
- `last_error`: last safe error message.
- `dedupe_key`: unique per family to prevent duplicate jobs.
- `notified_at`: set only after a successful send.

The dispatcher formats reminder times with `Asia/Seoul` and records UTC timestamps in the database.

Queue payload policy:

- `notification_jobs.body` stores structured JSON (`schema: "override_notification_v1"`).
- Payload keys are `title`, `event_type`, `event_type_label`, `shift_change`, `shift_change_label`, `date`.
- Dispatcher renders Telegram text in fixed order: `제목 -> 일정 유형 -> 근무조 변경 -> 대상 날짜 -> 알림 시간`.
- Legacy plain-text `body` rows still dispatch with fallback formatting.

Pre-send safety guard (AND condition):

- Right before Telegram send, dispatcher re-checks source override row by `dedupe_key` (`override:<overrideId>:...`).
- Send is allowed only when both are true:
  - source row still exists in `shift_overrides`
  - source `note.remind_at` is still equal to queued `notification_jobs.remind_at`
- If either condition fails, send is skipped and job becomes `failed` with `last_error=SKIPPED_SOURCE_MISMATCH_OR_DELETED`.

## Environment Variables

Set these for the Edge Function:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `NOTIFICATION_DISPATCH_SECRET` optional shared secret for cron calls
- `NOTIFICATION_BATCH_SIZE` optional, default `25`
- `NOTIFICATION_MAX_ATTEMPTS` optional, default `5`
- `NOTIFICATION_DRY_RUN` optional, set `true` to count due jobs without claiming or sending

## Edge Function

Function path:

```bash
supabase/functions/dispatch-notifications/index.ts
```

Suggested staging deploy command:

```bash
supabase functions deploy dispatch-notifications
```

Suggested local dry-run serve command:

```bash
NOTIFICATION_DRY_RUN=true supabase functions serve dispatch-notifications --env-file ./supabase/.env.local
```

## pg_cron Setup Draft

After deploying the Edge Function, schedule it from a staging SQL console first:

```sql
select public.schedule_notification_dispatcher(
  'https://<project-ref>.functions.supabase.co/dispatch-notifications',
  '<NOTIFICATION_DISPATCH_SECRET>'
);
```

If no custom secret is used, pass the service role token as the bearer token and keep the function JWT verification enabled.

## Safe Dry Runs

Check due jobs without sending Telegram messages:

```bash
NOTIFICATION_DRY_RUN=true curl -X POST \
  -H "Authorization: Bearer <NOTIFICATION_DISPATCH_SECRET>" \
  https://<project-ref>.functions.supabase.co/dispatch-notifications
```

Check the claim RPC in a rollback transaction on staging:

```sql
begin;
select * from public.claim_due_notification_jobs(5, 5);
rollback;
```

Do not run these against production until the Integration Owner approves the migration and Edge Function deployment.
