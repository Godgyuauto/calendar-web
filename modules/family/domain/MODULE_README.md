# MODULE_README (modules/family/domain)

## File ownership map

- `types.ts`: domain interfaces/types.
- `constants.ts`: default IDs.
- `validators.ts`: date and event-window checks.
- `store-state.ts`: singleton state bootstrap and seed data.
- `events.ts`: list/create/update/remove for events.
- `overrides.ts`: list/create/remove for overrides.
- `structured-override-note.ts`: canonical/legacy override note parser (`calendar_override_v1` normalization).
- `family-store.ts`: public barrel for external imports.

## Why this code is here

- This folder centralizes business rules so route handlers remain thin.
- Validation is separated to avoid duplicate logic across CRUD functions.
