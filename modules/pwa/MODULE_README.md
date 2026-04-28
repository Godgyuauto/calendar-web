# MODULE_README (modules/pwa)

## Public files

- `cache-version.ts`: source-of-truth cache version string used by release verification.
- `service-worker-update.ts`: browser-side update activation helpers used by `app/sw-register.tsx`.

## Rules

- `public/sw.js` is a static browser file and cannot import TypeScript modules.
- When the app UI, route shell, public assets, or service worker behavior changes, bump both:
  - `modules/pwa/cache-version.ts`
  - `public/sw.js`
- `pnpm run verify:pwa` fails if those values drift or if key update safeguards are removed.
