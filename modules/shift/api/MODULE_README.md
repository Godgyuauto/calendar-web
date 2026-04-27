# MODULE_README (modules/shift/api)

## Files

- `month-route.ts`: returns month summary. Uses `modules/family/api/route-log-response` helpers for logging + response to stay consistent with family routes.
- `today-route.ts`: returns today's summary. Same helper pattern as `month-route.ts`.

## Why this code is here

- HTTP concerns are separated from pure `shift/domain` calculation logic.
- Logging format (`requestId/status/duration/errorCode/commandHint`) is unified with family routes via the shared response helpers — do not hand-roll logs here.

## Agent safe edit guide

- Keep both files thin (< 80 lines). Validation stays inline; do not add new dependencies.
- If a logging helper is missing, extend `modules/family/api/route-log-response.ts` or `request-log.ts` rather than copy-pasting `console.info/console.error` here.
