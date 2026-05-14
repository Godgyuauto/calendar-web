import { describe, expect, it } from "vitest";
import {
  commitReminderMinuteDraft,
  normalizeReminderMinuteDraft,
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

  it("keeps direct minute draft editable before commit", () => {
    expect(normalizeReminderMinuteDraft("7")).toBe("7");
    expect(normalizeReminderMinuteDraft("05")).toBe("05");
    expect(normalizeReminderMinuteDraft("ab12cd")).toBe("12");
    expect(normalizeReminderMinuteDraft("")).toBe("");
  });

  it("normalizes direct minute draft on commit", () => {
    expect(commitReminderMinuteDraft("7")).toBe("07");
    expect(commitReminderMinuteDraft("05")).toBe("05");
    expect(commitReminderMinuteDraft("99")).toBe("59");
    expect(commitReminderMinuteDraft("")).toBe("00");
  });
});
