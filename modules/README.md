# modules

Feature-oriented application code lives here.

## Boundaries

- `calendar`: calendar grid and date layout helpers.
- `family`: family events and shift override domain + API handlers.
- `home`: home screen composition and UI pieces.
- `shift`: pure shift engine (pattern and override merge).

## Why this exists

This folder keeps feature code out of `app/` so route/page entries stay thin and easy to scan.
