import { describe, expect, it } from "vitest";
import {
  commitClockMinuteDraft,
  commitClockTimeDraft,
  normalizeClockMinuteDraft,
  normalizeClockTimeDraft,
  toClockTimeParts,
  toClockTimeValue,
} from "@/modules/calendar-ui/clock-time-selection";

describe("clock time selection", () => {
  it("maps 24-hour time to AM/PM selector parts", () => {
    expect(toClockTimeParts("00:05")).toEqual({ period: "AM", hour12: 12, minute: "05" });
    expect(toClockTimeParts("09:30")).toEqual({ period: "AM", hour12: 9, minute: "30" });
    expect(toClockTimeParts("12:00")).toEqual({ period: "PM", hour12: 12, minute: "00" });
    expect(toClockTimeParts("23:55")).toEqual({ period: "PM", hour12: 11, minute: "55" });
  });

  it("maps AM/PM selector parts back to a 24-hour time value", () => {
    expect(toClockTimeValue({ period: "AM", hour12: 12, minute: "05" })).toBe("00:05");
    expect(toClockTimeValue({ period: "AM", hour12: 9, minute: "30" })).toBe("09:30");
    expect(toClockTimeValue({ period: "PM", hour12: 12, minute: "00" })).toBe("12:00");
    expect(toClockTimeValue({ period: "PM", hour12: 11, minute: "55" })).toBe("23:55");
  });

  it("keeps direct minute draft editable before commit", () => {
    expect(normalizeClockMinuteDraft("7")).toBe("7");
    expect(normalizeClockMinuteDraft("05")).toBe("05");
    expect(normalizeClockMinuteDraft("ab12cd")).toBe("12");
    expect(normalizeClockMinuteDraft("")).toBe("");
  });

  it("normalizes direct minute draft on commit", () => {
    expect(commitClockMinuteDraft("7")).toBe("07");
    expect(commitClockMinuteDraft("05")).toBe("05");
    expect(commitClockMinuteDraft("99")).toBe("59");
    expect(commitClockMinuteDraft("")).toBe("00");
  });

  it("keeps direct time draft editable before commit", () => {
    expect(normalizeClockTimeDraft("7")).toBe("7");
    expect(normalizeClockTimeDraft("7:3")).toBe("7:3");
    expect(normalizeClockTimeDraft("07:37")).toBe("07:37");
    expect(normalizeClockTimeDraft("ab0737cd")).toBe("0737");
  });

  it("normalizes direct time draft on commit", () => {
    expect(commitClockTimeDraft("7")).toBe("07:00");
    expect(commitClockTimeDraft("730")).toBe("07:30");
    expect(commitClockTimeDraft("07:37")).toBe("07:37");
    expect(commitClockTimeDraft("25:99")).toBe("23:59");
    expect(commitClockTimeDraft("", "18:30")).toBe("18:30");
  });
});
