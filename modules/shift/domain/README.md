# modules/shift/domain

Pure scheduling logic for shift pattern resolution.

## Structure

- `types.ts`: shift and override type definitions.
- `constants.ts`: default pattern and label/color maps.
- `date-key.ts`: parse/format/normalize date keys.
- `shift-resolver.ts`: base shift + override merge calculations.
- `shift-engine.ts`: barrel export for compatibility.
