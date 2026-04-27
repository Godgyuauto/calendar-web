import type { ShiftCode, ShiftPatternConfig } from "@/modules/shift/domain/types";

export const DEFAULT_TIME_ZONE = "Asia/Seoul";

export const DAY_IN_MS = 24 * 60 * 60 * 1000;

export const DEFAULT_SHIFT_PATTERN_V1: ShiftPatternConfig = {
  patternId: "hynix_4team_3shift",
  version: "1.0",
  seedDate: "2026-04-21",
  shiftCycle: [
    "A",
    "A",
    "A",
    "A",
    "A",
    "A",
    "OFF",
    "OFF",
    "B",
    "B",
    "B",
    "B",
    "B",
    "B",
    "OFF",
    "OFF",
    "C",
    "C",
    "C",
    "C",
    "C",
    "C",
    "OFF",
    "OFF",
  ],
};

export const SHIFT_LABELS_KO: Record<ShiftCode, string> = {
  A: "A조 (07:00-15:00)",
  B: "B조 (15:00-23:00)",
  C: "C조 (23:00-07:00)",
  OFF: "휴무",
};

export const SHIFT_COLORS: Record<ShiftCode, string> = {
  A: "#2563eb",
  B: "#f97316",
  C: "#7c3aed",
  OFF: "#64748b",
};
