import { describe, expect, it } from "vitest";
import { validateAnnualLeaveSettingsForm } from "@/modules/leave/annual-leave-settings-validation";

describe("validateAnnualLeaveSettingsForm", () => {
  it("converts total days and current remaining leave into already-used hours", () => {
    const result = validateAnnualLeaveSettingsForm({
      year: 2026,
      totalDays: 15,
      remainingDays: 14,
      remainingHours: 7,
    });

    expect(result).toEqual({
      ok: true,
      data: {
        year: 2026,
        totalHours: 120,
        usedHoursBeforeApp: 1,
      },
    });
  });

  it("rejects remaining leave that exceeds total leave", () => {
    const result = validateAnnualLeaveSettingsForm({
      year: 2026,
      totalDays: 15,
      remainingDays: 15,
      remainingHours: 1,
    });

    expect(result.ok).toBe(false);
  });
});
