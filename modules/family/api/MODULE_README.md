# MODULE_README (modules/family/api)

## Files

- `_common/`: auth context resolution, route auth adapters, shared logging/response helpers, and Supabase REST helpers.
- `events/`: `/api/events` route and `family_events` repository CRUD.
- `overrides/`: `/api/overrides` route, create/update mutation branch, payload validation, `shift_overrides` repository, and structured notification payload builder.
- `members/`: `/api/members` route, member role/working repositories, settings read repository, app-role resolver, and PATCH body parser.
- `push/`: `/api/push/subscriptions` route, push subscription repository, Web Push notifier, failure classifier, and route-safe dispatch wrapper.
- `notifications/`: notification queue upsert/cleanup repository plus non-blocking dispatch wrapper for override reminders.
- `settings/`: `/api/settings/summary` route and auth profile read repository.
- Each folder has an `index.ts` barrel for external imports. Files inside `modules/family/api/**` use direct relative imports to avoid loading their own folder barrel.

## Why this code is here

- Keeps Next.js route entry files in `app/api/*` as one-line re-export shims.
- Isolates API surface changes from domain logic changes.
- Prevents trusting `familyId/userId` from client body payloads in route handlers.
- Enforces server-side user identity (`auth.uid()` equivalent) before family-scoped CRUD.
- Routes now persist/read via Supabase REST (`family_events`, `shift_overrides`) rather than in-memory domain store.
- Data semantics are fixed: shift/home/notification flows must read `shift_overrides` as Source of Truth; `family_events` remains auxiliary display/record data.
- Notification queue body is persisted as structured JSON (`override_notification_v1`) so DB-driven dispatcher/trigger logic can branch on `event_type` and `shift_change` without free-text parsing.
- Dispatcher applies a final pre-send AND guard (`source override exists` AND `source note.remind_at matches queued remind_at`) to prevent sending stale/deleted reminders.
- Mutation routes (`/api/events`, `/api/overrides`) invalidate home-family memory cache and call `revalidatePath("/", "/calendar")` so save/delete is reflected immediately on Home/Calendar.
- Calendar sheet can request `GET /api/overrides?...&scope=mine` for "내 일정" 조회만 수행한다.
- Override update/delete are scoped to caller ownership (`user_id = auth.userId`) so family members can edit/delete their own overrides safely.
- Members/settings tabs now use family-scoped Supabase reads and self working-state persistence.
- Push subscription persistence and dispatch are kept in this layer so route handlers stay thin.
