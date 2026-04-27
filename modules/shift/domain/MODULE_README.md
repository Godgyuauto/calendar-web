# MODULE_README (modules/shift/domain)

## Why this code was written this way

- `date-key.ts` exists to centralize timezone/date-key conversion and avoid duplicated parsing logic.
- `shift-resolver.ts` owns algorithm paths so policy changes are localized.
- `shift-engine.ts` keeps old import paths stable after modularization.

## Safe edit guide

- Change constants in `constants.ts` when pattern/version updates.
- Change merge policy in `shift-resolver.ts` when override behavior changes.
