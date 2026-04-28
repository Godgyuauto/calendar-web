import { describe, expect, it } from "vitest";
import type { DayShiftSummary } from "@/modules/shift";
import { buildMonthCalendarGrid } from "./calendar-grid";

function makeShift(date: string): DayShiftSummary {
  return { date, baseShift: "A", finalShift: "A" };
}

describe("buildMonthCalendarGrid — cell count", () => {
  it("always returns exactly 42 cells", () => {
    for (const [year, month] of [[2026, 1], [2026, 2], [2026, 4], [2026, 12]] as const) {
      const cells = buildMonthCalendarGrid({ year, month, shifts: [] });
      expect(cells).toHaveLength(42);
    }
  });
});

describe("buildMonthCalendarGrid — current month cells", () => {
  it("marks exactly 30 cells as current month for April 2026", () => {
    const cells = buildMonthCalendarGrid({ year: 2026, month: 4, shifts: [] });
    const current = cells.filter((c) => c.isCurrentMonth);
    expect(current).toHaveLength(30);
  });

  it("marks exactly 31 cells as current month for January 2026", () => {
    const cells = buildMonthCalendarGrid({ year: 2026, month: 1, shifts: [] });
    const current = cells.filter((c) => c.isCurrentMonth);
    expect(current).toHaveLength(31);
  });

  it("first current-month cell for April 2026 is 2026-04-01", () => {
    const cells = buildMonthCalendarGrid({ year: 2026, month: 4, shifts: [] });
    const first = cells.find((c) => c.isCurrentMonth);
    expect(first?.date).toBe("2026-04-01");
    expect(first?.day).toBe(1);
  });

  it("last current-month cell for April 2026 is 2026-04-30", () => {
    const cells = buildMonthCalendarGrid({ year: 2026, month: 4, shifts: [] });
    const current = cells.filter((c) => c.isCurrentMonth);
    const last = current[current.length - 1];
    expect(last?.date).toBe("2026-04-30");
    expect(last?.day).toBe(30);
  });
});

describe("buildMonthCalendarGrid — weekday alignment", () => {
  it("weekday increments 0-6 in order across all 42 cells", () => {
    const cells = buildMonthCalendarGrid({ year: 2026, month: 4, shifts: [] });
    cells.forEach((cell, idx) => {
      expect(cell.weekday).toBe(idx % 7);
    });
  });

  it("first cell weekday equals the weekday of the first calendar row start", () => {
    const cells = buildMonthCalendarGrid({ year: 2026, month: 4, shifts: [] });
    expect(cells[0].weekday).toBe(0);
  });
});

describe("buildMonthCalendarGrid — leading/trailing cells", () => {
  it("leading cells are marked isCurrentMonth=false", () => {
    const cells = buildMonthCalendarGrid({ year: 2026, month: 4, shifts: [] });
    const firstCurrent = cells.findIndex((c) => c.isCurrentMonth);
    const leading = cells.slice(0, firstCurrent);
    expect(leading.every((c) => !c.isCurrentMonth)).toBe(true);
  });

  it("trailing cells are marked isCurrentMonth=false", () => {
    const cells = buildMonthCalendarGrid({ year: 2026, month: 4, shifts: [] });
    const lastCurrentIdx = [...cells].reverse().findIndex((c) => c.isCurrentMonth);
    const trailing = cells.slice(42 - lastCurrentIdx);
    expect(trailing.every((c) => !c.isCurrentMonth)).toBe(true);
  });

  it("leading cells come from the previous month", () => {
    const cells = buildMonthCalendarGrid({ year: 2026, month: 4, shifts: [] });
    const firstCurrentIdx = cells.findIndex((c) => c.isCurrentMonth);
    const leading = cells.slice(0, firstCurrentIdx);
    expect(leading.every((c) => c.date.startsWith("2026-03"))).toBe(true);
  });

  it("trailing cells come from the next month", () => {
    const cells = buildMonthCalendarGrid({ year: 2026, month: 4, shifts: [] });
    const lastCurrentIdx = 41 - [...cells].reverse().findIndex((c) => c.isCurrentMonth);
    const trailing = cells.slice(lastCurrentIdx + 1);
    expect(trailing.every((c) => c.date.startsWith("2026-05"))).toBe(true);
  });
});

describe("buildMonthCalendarGrid — month boundary wrap", () => {
  it("leading cells for January wrap to December of previous year", () => {
    const cells = buildMonthCalendarGrid({ year: 2026, month: 1, shifts: [] });
    const leading = cells.slice(0, cells.findIndex((c) => c.isCurrentMonth));
    expect(leading.every((c) => c.date.startsWith("2025-12"))).toBe(true);
  });

  it("trailing cells for December wrap to January of next year", () => {
    const cells = buildMonthCalendarGrid({ year: 2026, month: 12, shifts: [] });
    const lastCurrentIdx = 41 - [...cells].reverse().findIndex((c) => c.isCurrentMonth);
    const trailing = cells.slice(lastCurrentIdx + 1);
    expect(trailing.every((c) => c.date.startsWith("2027-01"))).toBe(true);
  });
});

describe("buildMonthCalendarGrid — shift attachment", () => {
  it("attaches shift data to the matching current-month cell", () => {
    const shift = makeShift("2026-04-21");
    const cells = buildMonthCalendarGrid({ year: 2026, month: 4, shifts: [shift] });
    const cell = cells.find((c) => c.date === "2026-04-21");
    expect(cell?.shift).toBe(shift);
  });

  it("leaves shift undefined for cells that have no matching shift", () => {
    const cells = buildMonthCalendarGrid({ year: 2026, month: 4, shifts: [] });
    const cell = cells.find((c) => c.date === "2026-04-01");
    expect(cell?.shift).toBeUndefined();
  });

  it("attaches multiple shifts to their respective cells", () => {
    const s1 = makeShift("2026-04-01");
    const s2 = makeShift("2026-04-30");
    const cells = buildMonthCalendarGrid({ year: 2026, month: 4, shifts: [s1, s2] });
    expect(cells.find((c) => c.date === "2026-04-01")?.shift).toBe(s1);
    expect(cells.find((c) => c.date === "2026-04-30")?.shift).toBe(s2);
  });
});
