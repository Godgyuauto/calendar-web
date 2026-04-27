# MODULE_README (supabase)

## Why this folder exists

Tracks schema/RLS state separate from application runtime code.

## What goes here

- `migrations/*.sql`: append-only schema/RLS changes.
- `README.md`: high-level migration rules and latest sync note.

## Agent safe edit guide

- Add new SQL files only; do not rewrite existing migration history.
- If live Supabase was patched via MCP/SQL editor, reflect it with one new migration file immediately.
