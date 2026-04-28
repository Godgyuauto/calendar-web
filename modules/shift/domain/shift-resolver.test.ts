import { describe, expect, it } from "vitest";
import { DEFAULT_SHIFT_PATTERN_V1 } from "./constants";
import { getMonthShiftSummary, getShiftForDate, resolveDayShift } from "./shift-resolver";
import type { ShiftCode, ShiftOverride } from "./types";

// seedDate = 2026-04-21 (A-shift start)
// cycle:  A×6 → OFF×2 → B×6 → OFF×2 → C×6 → OFF×2 (24 days total)

describe("getShiftForDate — base cycle", () => {
  it("returns A for the seed date (offset 0)", () => {
    expect(getShiftForDate("2026-04-21")).toBe("A");
  });

  it("returns A for the last day of the A block (offset 5)", () => {
    expect(getShiftForDate("2026-04-26")).toBe("A");
  });

  it("returns OFF for offset 6", () => {
    expect(getShiftForDate("2026-04-27")).toBe("OFF");
  });

  it("returns OFF for offset 7", () => {
    expect(getShiftForDate("2026-04-28")).toBe("OFF");
  });

  it("returns B for offset 8", () => {
    expect(getShiftForDate("2026-04-29")).toBe("B");
  });

  it("returns B for offset 13 (last B day)", () => {
    expect(getShiftForDate("2026-05-04")).toBe("B");
  });

  it("returns OFF for offset 14", () => {
    expect(getShiftForDate("2026-05-05")).toBe("OFF");
  });

  it("returns C for offset 16", () => {
    expect(getShiftForDate("2026-05-07")).toBe("C");
  });

  it("returns C for offset 21 (last C day)", () => {
    expect(getShiftForDate("2026-05-12")).toBe("C");
  });

  it("returns OFF for offset 22", () => {
    expect(getShiftForDate("2026-05-13")).toBe("OFF");
  });

  it("wraps at offset 24 back to A", () => {
    expect(getShiftForDate("2026-05-15")).toBe("A");
  });
});

describe("getShiftForDate — before seed date (negative offset)", () => {
  it("handles offset -1 correctly (cycle index 23 = OFF)", () => {
    expect(getShiftForDate("2026-04-20")).toBe("OFF");
  });

  it("handles offset -8 correctly (cycle index 16 = C)", () => {
    expect(getShiftForDate("2026-04-13")).toBe("C");
  });
});

describe("getShiftForDate — custom pattern", () => {
  it("uses the provided pattern instead of default", () => {
    const customPattern = {
      ...DEFAULT_SHIFT_PATTERN_V1,
      seedDate: "2026-04-21",
      shiftCycle: ["B", "B", "B", "B", "B", "B", "OFF", "OFF",
                   "C", "C", "C", "C", "C", "C", "OFF", "OFF",
                   "A", "A", "A", "A", "A", "A", "OFF", "OFF"] as ShiftCode[],
    };
    // offset 0 → B under custom pattern
    expect(getShiftForDate("2026-04-21", customPattern)).toBe("B");
  });
});

describe("resolveDayShift — no overrides", () => {
  it("finalShift equals baseShift when no overrides", () => {
    const result = resolveDayShift("2026-04-21");
    expect(result.baseShift).toBe("A");
    expect(result.finalShift).toBe("A");
    expect(result.override).toBeUndefined();
  });

  it("sets date to the requested date key", () => {
    const result = resolveDayShift("2026-04-28");
    expect(result.date).toBe("2026-04-28");
  });
});

describe("resolveDayShift — with overrides", () => {
  const makeOverride = (
    date: string,
    overrideShift: ShiftOverride["overrideShift"],
    createdAt?: string,
  ): ShiftOverride => ({
    id: "ov1",
    date,
    overrideType: "vacation",
    overrideShift,
    label: "휴가",
    createdAt: createdAt ?? "2026-04-21T00:00:00Z",
  });

  it("applies a matching override (A → vacation, shift: null falls back to baseShift)", () => {
    const override = makeOverride("2026-04-21", null);
    const result = resolveDayShift("2026-04-21", { overrides: [override] });
    // overrideShift null → falls back to baseShift
    expect(result.finalShift).toBe("A");
    expect(result.override).toBe(override);
  });

  it("applies explicit overrideShift when set", () => {
    const override = makeOverride("2026-04-29", "C"); // B day → C override
    const result = resolveDayShift("2026-04-29", { overrides: [override] });
    expect(result.baseShift).toBe("B");
    expect(result.finalShift).toBe("C");
    expect(result.override).toBe(override);
  });

  it("ignores overrides for different dates", () => {
    const override = makeOverride("2026-04-22", "C");
    const result = resolveDayShift("2026-04-21", { overrides: [override] });
    expect(result.finalShift).toBe("A");
    expect(result.override).toBeUndefined();
  });

  it("picks the most recent override when multiple exist for same day", () => {
    const older = makeOverride("2026-04-21", "B", "2026-04-21T08:00:00Z");
    const newer = makeOverride("2026-04-21", "C", "2026-04-21T10:00:00Z");
    const result = resolveDayShift("2026-04-21", { overrides: [older, newer] });
    expect(result.finalShift).toBe("C");
    expect(result.override).toBe(newer);
  });

  it("treats missing createdAt as timestamp 0 (lower priority)", () => {
    const noDate: ShiftOverride = { date: "2026-04-21", overrideType: "sick", overrideShift: "B", label: "병가" };
    const withDate = makeOverride("2026-04-21", "C", "2026-04-21T00:00:01Z");
    const result = resolveDayShift("2026-04-21", { overrides: [noDate, withDate] });
    expect(result.finalShift).toBe("C");
    expect(result.override).toBe(withDate);
  });
});

describe("getMonthShiftSummary", () => {
  it("returns 30 entries for April 2026", () => {
    const rows = getMonthShiftSummary({ year: 2026, month: 4 });
    expect(rows).toHaveLength(30);
  });

  it("returns 28 entries for February 2026", () => {
    const rows = getMonthShiftSummary({ year: 2026, month: 2 });
    expect(rows).toHaveLength(28);
  });

  it("first entry of April 2026 is 2026-04-01", () => {
    const rows = getMonthShiftSummary({ year: 2026, month: 4 });
    expect(rows[0].date).toBe("2026-04-01");
  });

  it("last entry of April 2026 is 2026-04-30", () => {
    const rows = getMonthShiftSummary({ year: 2026, month: 4 });
    expect(rows[29].date).toBe("2026-04-30");
  });

  it("applies provided overrides to the correct day", () => {
    const override: ShiftOverride = {
      date: "2026-04-21",
      overrideType: "vacation",
      overrideShift: "OFF",
      label: "휴가",
    };
    const rows = getMonthShiftSummary({ year: 2026, month: 4, overrides: [override] });
    const day21 = rows.find((r) => r.date === "2026-04-21");
    expect(day21?.finalShift).toBe("OFF");
    expect(day21?.override).toBe(override);
  });
});
