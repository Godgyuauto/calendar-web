import { describe, expect, it } from "vitest";
import {
  ANNUAL_LEAVE_METADATA_KEYS,
  parseAnnualLeaveSettings,
  toAnnualLeaveMetadata,
} from "@/modules/leave/annual-leave-settings";

describe("annual leave settings metadata", () => {
  it("defaults to the current year with no configured leave", () => {
    expect(parseAnnualLeaveSettings({}, 2026)).toEqual({
      year: 2026,
      totalHours: 0,
      usedHoursBeforeApp: 0,
    });
  });

  it("parses total and already-used hours from auth metadata", () => {
    expect(
      parseAnnualLeaveSettings(
        {
          annual_leave_year: 2026,
          annual_leave_total_hours: 120,
          annual_leave_used_before_app_hours: 9,
        },
        2026,
      ),
    ).toEqual({
      year: 2026,
      totalHours: 120,
      usedHoursBeforeApp: 9,
    });
  });

  it("serializes settings with stable metadata keys", () => {
    expect(
      toAnnualLeaveMetadata({
        year: 2026,
        totalHours: 120,
        usedHoursBeforeApp: 1,
      }),
    ).toEqual({
      [ANNUAL_LEAVE_METADATA_KEYS.year]: 2026,
      [ANNUAL_LEAVE_METADATA_KEYS.totalHours]: 120,
      [ANNUAL_LEAVE_METADATA_KEYS.usedHoursBeforeApp]: 1,
    });
  });
});
