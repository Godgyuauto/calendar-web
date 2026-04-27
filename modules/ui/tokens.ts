// Apple HIG-inspired design tokens. Source of truth for colors/radius/shadow.
// Keep in sync with app/globals.css when CSS variables change.

export const COLORS = {
  primary: "#007AFF",
  primaryDark: "#0051a8",
  success: "#34c759",
  warning: "#ff9500",
  destructive: "#ff3b30",

  background: "#f2f2f7",
  card: "#ffffff",
  separator: "#e5e5ea",

  labelPrimary: "#1a1a1a",
  labelSecondary: "#8e8e93",
  labelTertiary: "#c7c7cc",

  surfaceSunken: "#f6f6f8",
  surfaceElevated: "#f9f9f9",
} as const;

// Shift palette mirrors wireframe color convention.
// A = warm coral-orange, B = green, C = violet, OFF = neutral gray.
export const SHIFT_PALETTE = {
  A: { bg: "#fff2e8", fg: "#c05621", dot: "#ff9500" },
  B: { bg: "#e8f5e9", fg: "#2e7d32", dot: "#34c759" },
  C: { bg: "#ede7f6", fg: "#5b21b6", dot: "#7c4dff" },
  OFF: { bg: "#f5f5f5", fg: "#757575", dot: "#8e8e93" },
} as const;

export const RADII = {
  chip: 8,
  input: 10,
  card: 14,
  largeCard: 18,
  button: 13,
  sheet: 22,
} as const;

export const SHADOWS = {
  cardHover: "0 8px 24px rgba(0,0,0,0.04)",
  fab: "0 6px 18px rgba(0,122,255,0.35)",
} as const;

export type ShiftPaletteKey = keyof typeof SHIFT_PALETTE;
