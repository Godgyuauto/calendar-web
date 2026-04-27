# MODULE_README (modules)

## What was placed here

- Domain logic and feature-level API handlers were moved under feature folders.
- `app/*` files only re-export or compose these modules.
- `push/` holds shared web-push client logic used by both home and settings.

## Why this structure was chosen

- Faster maintenance: each feature can be edited without reading unrelated code.
- Lower merge risk: teams can work on different module folders in parallel.
- Prevents over-refactor: contributors can change only the module they own.

## Agent rule for this folder

- Do not move feature logic back into `app/` entries.
- Keep cross-feature imports minimal and explicit.
