# MODULE_README (modules/family)

## What was moved and why

- Large single-file family store logic was split into domain modules to stay under 200 lines per file.
- Split reason: isolate change scope (`events`, `overrides`, `store`, `validators`) and make review faster.

## Current files and intent

- `domain/types.ts`: shared family types and store shape.
- `domain/constants.ts`: default IDs used by development-only in-memory storage.
- `domain/validators.ts`: input format/window validation.
- `domain/store-state.ts`: singleton in-memory state seed and holder.
- `domain/events.ts`: event CRUD.
- `domain/overrides.ts`: override CRUD.
- `domain/family-store.ts`: barrel re-export to preserve import path stability.

## Agent rule for this folder

- Keep API signatures backward-compatible when possible.
- Keep persistence concerns in `domain/store-state.ts` (or repository replacement), not in `api/*`.
- Keep data semantics fixed: `shift_overrides` is Source of Truth for shift/home/notification, `family_events` is auxiliary schedule data.
