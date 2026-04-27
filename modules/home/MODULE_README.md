# MODULE_README (modules/home)

## Folder intent

- Keep home screen UI assembly isolated from domain and API code.
- Allow quick UI edits without touching `app/page.tsx` or domain modules.
- Routine events are rendered in a dedicated timeline block to avoid cluttering the main month grid.
- Read family events/overrides from Supabase through shared auth-context to keep one persistence path.

## Key files

- `HomePage.tsx`: async server component entry for `/`.
- `home-page-data.ts`: builds the view model by combining Supabase reads + shift/calendar functions.
- `home-family-cache.ts`: short-lived in-memory read cache; mutation routes invalidate by family scope.
- `access-token.ts`: cookie token extraction helper for server-side auth context resolution.
