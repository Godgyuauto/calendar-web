import { describe, expect, it } from "vitest";
import { isISODateKey, isISODateTime, validateEventWindow } from "./validators";

describe("isISODateKey", () => {
  it("returns true for a valid YYYY-MM-DD string", () => {
    expect(isISODateKey("2026-04-28")).toBe(true);
    expect(isISODateKey("2000-01-01")).toBe(true);
  });

  it("returns false for non-date strings", () => {
    expect(isISODateKey("20260428")).toBe(false);
    expect(isISODateKey("2026/04/28")).toBe(false);
    expect(isISODateKey("2026-4-28")).toBe(false);
    expect(isISODateKey("")).toBe(false);
    expect(isISODateKey("hello")).toBe(false);
  });
});

describe("isISODateTime", () => {
  it("returns true for valid ISO datetime strings", () => {
    expect(isISODateTime("2026-04-28T12:00:00Z")).toBe(true);
    expect(isISODateTime("2026-04-28T21:00:00+09:00")).toBe(true);
    expect(isISODateTime("2026-04-28")).toBe(true);
  });

  it("returns false for invalid datetime strings", () => {
    expect(isISODateTime("not-a-date")).toBe(false);
    expect(isISODateTime("")).toBe(false);
  });
});

describe("validateEventWindow", () => {
  it("passes when endTime is strictly after startTime", () => {
    expect(() =>
      validateEventWindow("2026-04-28T09:00:00Z", "2026-04-28T17:00:00Z"),
    ).not.toThrow();
  });

  it("throws when endTime equals startTime", () => {
    expect(() =>
      validateEventWindow("2026-04-28T09:00:00Z", "2026-04-28T09:00:00Z"),
    ).toThrow("endTime must be greater than startTime");
  });

  it("throws when endTime is before startTime", () => {
    expect(() =>
      validateEventWindow("2026-04-28T17:00:00Z", "2026-04-28T09:00:00Z"),
    ).toThrow("endTime must be greater than startTime");
  });

  it("throws when startTime is not a valid datetime", () => {
    expect(() =>
      validateEventWindow("bad-start", "2026-04-28T17:00:00Z"),
    ).toThrow("valid ISO datetime");
  });

  it("throws when endTime is not a valid datetime", () => {
    expect(() =>
      validateEventWindow("2026-04-28T09:00:00Z", "bad-end"),
    ).toThrow("valid ISO datetime");
  });
});
