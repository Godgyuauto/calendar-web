# MODULE_README (app/api)

## Why this folder is thin

Each route file should remain a minimal re-export so feature API code stays inside `modules/*/api`.

Current routes include:
- `/api/events`, `/api/overrides`, `/api/shifts/today`, `/api/shifts/month`
- `/api/push/subscriptions`
- `/api/members` (GET/PATCH)
- `/api/settings/summary`
- `/api/auth/login`, `/api/auth/logout`, `/api/auth/refresh`, `/api/auth/signup`
- `/api/onboarding/family`, `/api/onboarding/invite`
- `/api/invites`
