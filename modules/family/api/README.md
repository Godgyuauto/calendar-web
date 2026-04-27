# modules/family/api

HTTP handlers for family/event/override/members/settings endpoints.

## Responsibility

- Parse request input.
- Validate request-shape constraints.
- Call Supabase-backed repositories.
- Convert domain errors to HTTP status codes.
- Emit structured route logs (`requestId`, `status`, `durationMs`, `errorCode`, `commandHint`).
