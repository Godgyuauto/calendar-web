# lib compat removal backup

Date: 2026-04-28

This directory preserves the removed `lib/` compatibility shim files as `*.bak`.
They are intentionally not valid TypeScript source paths, so `tsconfig.json` and
ESLint do not treat them as runtime code.

Removal reason:
- Runtime imports now use `@/modules/*` directly.
- Final source grep before deletion found zero active `@/lib/*` references.
- The old `lib/` files were one-line re-export shims only.

Restore reference:
- `lib/calendar-grid.ts` -> `lib/calendar-grid.ts.bak`
- `lib/family-store.ts` -> `lib/family-store.ts.bak`
- `lib/shift-engine.ts` -> `lib/shift-engine.ts.bak`
- `lib/CLAUDE.md` -> `lib/CLAUDE.md.bak`
- `lib/MODULE_README.md` -> `lib/MODULE_README.md.bak`
- `lib/README.md` -> `lib/README.md.bak`
