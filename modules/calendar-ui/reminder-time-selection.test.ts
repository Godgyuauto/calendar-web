import { describe, expect, it } from "vitest";
import {
  normalizeReminderMinuteInput,
  toReminderTimeParts,
  toReminderTimeValue,
} from "@/modules/calendar-ui/reminder-time-selection";

describe("reminder time selection", () => {
  it("maps 24-hour time to AM/PM selector parts", () => {
    expect(toReminderTimeParts("00:05")).toEqual({ period: "AM", hour12: 12, minute: "05" });
    expect(toReminderTimeParts("09:30")).toEqual({ period: "AM", hour12: 9, minute: "30" });
    expect(toReminderTimeParts("12:00")).toEqual({ period: "PM", hour12: 12, minute: "00" });
    expect(toReminderTimeParts("23:55")).toEqual({ period: "PM", hour12: 11, minute: "55" });
  });

  it("maps AM/PM selector parts back to a 24-hour time value", () => {
    expect(toReminderTimeValue({ period: "AM", hour12: 12, minute: "05" })).toBe("00:05");
    expect(toReminderTimeValue({ period: "AM", hour12: 9, minute: "30" })).toBe("09:30");
    expect(toReminderTimeValue({ period: "PM", hour12: 12, minute: "00" })).toBe("12:00");
    expect(toReminderTimeValue({ period: "PM", hour12: 11, minute: "55" })).toBe("23:55");
  });

  it("normalizes direct minute input", () => {
    expect(normalizeReminderMinuteInput("7")).toBe("07");
    expect(normalizeReminderMinuteInput("05")).toBe("05");
    expect(normalizeReminderMinuteInput("99")).toBe("59");
    expect(normalizeReminderMinuteInput("ab12cd")).toBe("12");
    expect(normalizeReminderMinuteInput("")).toBe("00");
  });
});
