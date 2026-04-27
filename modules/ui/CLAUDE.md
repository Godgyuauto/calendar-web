# modules/ui — Shared UI primitives

iOS/Apple HIG-flavored design system shared by every feature module. This is
the **only** module that defines raw colors, radii, and shadows. Feature
modules (home/members/settings/calendar-ui/auth/onboarding) compose these
primitives — they MUST NOT re-declare design tokens or hand-roll their own
buttons/cards/inputs.

## Public API

Import from the barrel:

```ts
import {
  Card, SettingsGroupCard,
  PrimaryButton, SecondaryButton,
  TextField,
  SegmentControl,
  TabBar, NavBar,
  Toggle, BottomSheet,
  Chip,
  SectionLabel, SettingsRow,
  CalendarIcon, BellIcon, PersonIcon, ChatIcon, GearIcon,
  PlusIcon, ChevronLeftIcon, ChevronRightIcon, CloseIcon, UserPlusIcon,
} from "@/modules/ui/components";
```

Tokens (rarely needed — prefer the components above):

```ts
import { COLORS, SHIFT_PALETTE, RADII, SHADOWS } from "@/modules/ui/tokens";
```

## File map

```
modules/ui/
├── CLAUDE.md               ← you are here
├── tokens.ts               ← COLORS / SHIFT_PALETTE / RADII / SHADOWS
└── components/
    ├── index.ts            ← barrel (update when adding a primitive)
    ├── Card.tsx            ← Card, SettingsGroupCard
    ├── PrimaryButton.tsx   ← PrimaryButton, SecondaryButton
    ├── TextField.tsx       ← filled gray-100 input
    ├── SegmentControl.tsx  ← generic typed pill segment (A/B/C/OFF etc.)
    ├── TabBar.tsx          ← sticky bottom nav, 4 tabs
    ├── NavBar.tsx          ← 44px top bar, title + icon slots
    ├── Toggle.tsx          ← 44×26 iOS switch
    ├── BottomSheet.tsx     ← dim + rounded-top sheet, ESC/backdrop close
    ├── Chip.tsx            ← pill / segment chip, blue when active
    ├── SectionLabel.tsx    ← SectionLabel + SettingsRow
    └── icons.tsx           ← SF-style 24×24 line icons
```

## Design tokens — the source of truth

`tokens.ts` is deliberately small. Every color used in a component must come
from `COLORS` or `SHIFT_PALETTE`, or be a documented one-off (e.g. #f5f5f5
hairline inside SettingsRow). If you find yourself reaching for a new color,
**add it to `tokens.ts` first** so the palette stays auditable.

| Token           | Hex      | Role                                    |
|-----------------|----------|-----------------------------------------|
| PRIMARY         | #007AFF  | CTA fill, active chips/segments         |
| BG              | #f2f2f7  | App background                          |
| CARD            | #ffffff  | Card surface                            |
| SEPARATOR       | #e5e5ea  | Borders / hairlines                     |
| LABEL_PRIMARY   | #1a1a1a  | Default text                            |
| LABEL_SECONDARY | #8e8e93  | Captions, inactive tab labels           |
| SUCCESS         | #34c759  | Toggle-on                               |
| DANGER          | #ff3b30  | Destructive row (sign out)              |

Shift palette keys (`A` / `B` / `C` / `OFF`) each carry `bg`, `fg`, and
`accent` — use these anywhere a shift is rendered so the color story stays
consistent between mini-calendar, event pills, and pattern previews.

## Apple HIG guardrails we honor

- **Corner radii** from `RADII`: 8 / 10 / 14 / 22 / 999 (pill). Don't invent.
- **Touch targets** ≥ 44px tall. TabBar, SettingsRow, PrimaryButton, Toggle
  are all designed around this — don't shrink them.
- **Hairline separators** only between items in the same card. Between cards
  use the #f2f2f7 background gap instead.
- **Single accent (blue)** per screen. Don't combine a blue CTA with another
  accent color for unrelated emphasis.
- **Motion:** none yet. When we add it, use `transition` + short durations
  (≤200ms). Avoid spring physics — this is a web app, not a native iOS app.

## Agent-safe edit guide

When modifying this module, in priority order:

1. **Never add a new color literal outside `tokens.ts`.** If you need one,
   extend `tokens.ts` with a named entry and import it.
2. **Never add a component file without adding it to `components/index.ts`.**
   Deep imports are banned — if an import bypasses the barrel it's a bug.
3. **Keep each primitive ≤ ~120 lines.** If a file grows past that, split
   concerns (e.g. subcomponents → sibling files, behavior → hook).
4. **No feature logic in here.** This module is pure presentation. Anything
   that reads auth, calls `/api/*`, or owns app state belongs in a feature
   module (home/members/settings/…), which then composes these primitives.
5. **`"use client"` is per-file, not default.** Server-renderable primitives
   (Card, SectionLabel, icons, NavBar) intentionally omit it. Add it only if
   the component uses state / effects / event handlers that React would
   otherwise refuse on the server.

## Adding a new primitive — checklist

- [ ] One primitive per file in `components/`
- [ ] Props interface named `<Name>Props`, exported only if consumers need it
- [ ] All colors come from `tokens.ts` (or are a documented hairline)
- [ ] `"use client"` only if the component actually needs it
- [ ] Barrel export added to `components/index.ts`
- [ ] If semantics are non-obvious, a one-sentence comment above the export

## Known gaps (to resolve with user approval)

- **Dark mode**: tokens.ts is light-theme only. Adding dark mode requires a
  CSS-variable overhaul across every primitive — don't attempt piecemeal.
- **Animation**: no `framer-motion` dependency yet. If we add one, it goes
  here, and every motion API in the app flows through this module.
- **Icon set**: ~10 icons hand-drawn. If we cross ~15 we should move to a
  maintained icon package (lucide-react) — absolute rule #5 requires user
  approval before adding that dep.
