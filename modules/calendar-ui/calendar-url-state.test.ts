import { describe, expect, it } from "vitest";
import {
  buildDayHref,
  buildMonthHref,
  normalizeDateKey,
  offsetMonth,
  parseViewMode,
} from "./calendar-url-state";

describe("calendar URL state", () => {
  it("normalizes valid date keys and rejects impossible dates", () => {
    expect(normalizeDateKey("2026-05-04")).toBe("2026-05-04");
    expect(normalizeDateKey("2026-02-30")).toBeUndefined();
    expect(normalizeDateKey("2026-5-4")).toBeUndefined();
  });

  it("parses view mode with month fallback", () => {
    expect(parseViewMode("day")).toBe("day");
    expect(parseViewMode("week")).toBe("week");
    expect(parseViewMode("bad")).toBe("month");
  });

  it("offsets months across year boundaries", () => {
    expect(offsetMonth(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
    expect(offsetMonth(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
  });

  it("builds month href without sheet state", () => {
    const params = new URLSearchParams("add=2026-05-04&view=day");
    expect(buildMonthHref("/calendar", params, 2026, 6)).toBe(
      "/calendar?view=day&year=2026&month=6",
    );
  });

  it("builds day href that preserves day view across month changes", () => {
    const params = new URLSearchParams("view=month&foo=bar");
    expect(buildDayHref("/calendar", params, "2026-05-04")).toBe(
      "/calendar?view=day&foo=bar&year=2026&month=5&day=2026-05-04",
    );
  });
});
