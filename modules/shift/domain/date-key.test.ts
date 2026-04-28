import { describe, expect, it } from "vitest";
import { formatDateKey, normalizeDateKey, parseDateKey } from "./date-key";

describe("parseDateKey", () => {
  it("returns UTC midnight for a valid date key", () => {
    const result = parseDateKey("2026-04-21");
    expect(result.toISOString()).toBe("2026-04-21T00:00:00.000Z");
  });

  it("throws for an invalid format", () => {
    expect(() => parseDateKey("20260421")).toThrow("Invalid date key");
    expect(() => parseDateKey("2026/04/21")).toThrow("Invalid date key");
    expect(() => parseDateKey("")).toThrow("Invalid date key");
  });

  it("handles month/day boundary correctly (Dec → Jan)", () => {
    const dec31 = parseDateKey("2025-12-31");
    const jan01 = parseDateKey("2026-01-01");
    expect(jan01.getTime() - dec31.getTime()).toBe(24 * 60 * 60 * 1000);
  });
});

describe("formatDateKey", () => {
  it("formats a UTC midnight date to YYYY-MM-DD in Asia/Seoul", () => {
    const date = new Date(Date.UTC(2026, 3, 21)); // 2026-04-21 UTC
    expect(formatDateKey(date, "Asia/Seoul")).toBe("2026-04-21");
  });

  it("shifts to next calendar day for UTC dates that are KST next day", () => {
    // 2026-04-20 15:00 UTC = 2026-04-21 00:00 KST
    const date = new Date(Date.UTC(2026, 3, 20, 15, 0, 0));
    expect(formatDateKey(date, "Asia/Seoul")).toBe("2026-04-21");
  });
});

describe("normalizeDateKey", () => {
  it("passes a string through unchanged", () => {
    expect(normalizeDateKey("2026-04-21", "Asia/Seoul")).toBe("2026-04-21");
  });

  it("formats a Date using the given timeZone", () => {
    const date = new Date(Date.UTC(2026, 3, 21));
    expect(normalizeDateKey(date, "Asia/Seoul")).toBe("2026-04-21");
  });
});
