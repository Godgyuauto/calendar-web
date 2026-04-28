# MODULE_README (modules/family/api)

## Files

- `events-route.ts`: GET/POST/PATCH/DELETE for events.
- `overrides-route.ts`: GET/POST/PATCH/DELETE for overrides. Uses cookie fallback auth for browser-originated calls from calendar UI (`credentials: include`) while keeping Bearer support.
- `auth-context.ts`: validates `Authorization: Bearer` token with Supabase Auth and resolves family scope from `family_members`.
- `route-auth.ts`: thin adapter that wraps `resolveFamilyAuthContext` and turns auth errors into `NextResponse`. Every authenticated route imports `resolveFamilyAuthOrResponse` (strict Bearer) or `resolveFamilyAuthOrResponseWithCookie` (Bearer with cookie fallback, for browser-originated routes like `/api/push/subscriptions` and `/api/overrides`) from here so the auth-reject branch is single-sourced.
- `request-log.ts`: common API route logging format (`requestId/status/duration/errorCode/commandHint`). Generic — not family-specific. Shared by `modules/shift/api/*` routes too (no separate logger module yet; move out if a 3rd consumer appears).
- `route-log-response.ts`: response helpers that enforce logging on success/failure/auth-reject paths. Accepts a plain `{ familyId?, userId? }` meta object, so shift routes (no auth context) reuse the same helpers.
- `family-supabase-common.ts`: shared Supabase config/headers/response error mapping.
- `family-events-supabase.ts`: `family_events` repository CRUD for API handlers.
- `family-overrides-supabase.ts`: `shift_overrides` repository CRUD for API handlers.
- `override-route-payload.ts`: override POST/PATCH payload validator (`overrideType`, `overrideShift`, date/label fields).
- `override-mutation-route.ts`: override create/update branch and side-effects (queue/push/revalidate) to keep route file slim.
- `structured-override-notification.ts`: override 알림 payload 생성 시 `modules/family/domain/structured-override-note.ts` 파서를 사용해 legacy/canonical note를 단일 해석.
- `notification-jobs-supabase.ts`: notification queue upsert/cleanup for override reminders (`notification_jobs`).
- `structured-override-notification.ts`: structured override note parser + queue body payload builder (`override_notification_v1`).
- `notification-jobs-dispatch.ts`: non-blocking queue dispatch wrapper with route log safety.
- `family-members-settings-supabase.ts`: members/settings read repositories (`family_members`, `families`, `shift_patterns`, `push_subscriptions`).
- `family-auth-profile-supabase.ts`: auth profile read repository (`auth/v1/user`).
- `family-members-working-repository.ts`: service-role write repository for self `family_members.working` update.
- `family-members-role-repository.ts`: service-role write repository for `family_members.role` update (family master authority only).
- `family-member-role.ts`: app-role resolver (`master/head/member`) derived from DB role + created_at ordering.
- `members-role-update.ts`: PATCH body parser for member role change payload (`targetUserId` + `role`).
- `members-route.ts`: members API (`/api/members`, GET/PATCH). PATCH updates own `working` flag or updates target member role when the caller is family master.
- `settings-summary-route.ts`: settings summary read API (`/api/settings/summary`, GET).
- `push-subscriptions-route.ts`: push subscription create/delete API (`/api/push/subscriptions`).
- `push-subscriptions-repository.ts`: service-role repository for `push_subscriptions`.
- `push-notifier.ts`: Web Push send logic (VAPID + invalid endpoint cleanup).
- `push-notify-dispatch.ts`: route-safe wrapper that prevents push failure from breaking core CRUD responses.

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
