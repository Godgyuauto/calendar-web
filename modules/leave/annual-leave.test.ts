import { describe, expect, it } from "vitest";
import { calculateAnnualLeaveBalance } from "@/modules/leave/annual-leave";

describe("calculateAnnualLeaveBalance", () => {
  it("converts one hour of annual leave into 14 days and 7 hours remaining from 15 days", () => {
    const balance = calculateAnnualLeaveBalance({
      totalDays: 15,
      usedHoursBeforeApp: 1,
      appUsages: [],
    });

    expect(balance.totalHours).toBe(120);
    expect(balance.usedHours).toBe(1);
    expect(balance.remainingHours).toBe(119);
    expect(balance.remainingDays).toBe(14);
    expect(balance.remainingExtraHours).toBe(7);
    expect(balance.remainingLabel).toBe("14개 7시간");
  });

  it("adds app usage to the already-used hours configured in settings", () => {
    const balance = calculateAnnualLeaveBalance({
      totalDays: 15,
      usedHoursBeforeApp: 8,
      appUsages: [{ hours: 4 }, { hours: 1 }],
    });

    expect(balance.usedHours).toBe(13);
    expect(balance.remainingLabel).toBe("13개 3시간");
  });
});
