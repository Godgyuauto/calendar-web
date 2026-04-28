# modules/family/api

HTTP handlers for family/event/override/members/settings endpoints.

Files are grouped by endpoint or infrastructure concern. External callers should
import from folder barrels such as `@/modules/family/api/events`; files inside
this module should use direct relative imports to avoid barrel cycles.

## Responsibility

- Parse request input.
- Validate request-shape constraints.
- Call Supabase-backed repositories.
- Convert domain errors to HTTP status codes.
- Emit structured route logs (`requestId`, `status`, `durationMs`, `errorCode`, `commandHint`).
