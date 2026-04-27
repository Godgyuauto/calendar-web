# MODULE_README (modules/shift)

## What was moved and why

- Large shift engine file was split into `types/constants/date-key/resolver`.
- Split reason: reduce file size and separate stable model definitions from algorithm changes.

## Agent rule for this folder

- Keep `domain/*` pure (no DB/network or side effects).
- Keep timezone and date-key behavior consistent to avoid schedule drift.
