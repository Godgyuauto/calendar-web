import {
  ANNUAL_LEAVE_HOURS_PER_DAY,
  calculateAnnualLeaveBalance,
} from "@/modules/leave/annual-leave";
import { parseAnnualLeaveSettings } from "@/modules/leave/annual-leave-settings";
import { getAnnualLeaveUsagesFromOverrides } from "@/modules/leave/annual-leave-usage";
import type { ShiftOverride } from "@/modules/shift";

export interface AnnualLeaveHomeData {
  year: number;
  totalDays: number;
  usedHours: number;
  remainingLabel: string;
}

export function buildAnnualLeaveHomeData(
  metadata: Record<string, unknown>,
  overrides: ShiftOverride[],
  fallbackYear: number,
): AnnualLeaveHomeData | null {
  const settings = parseAnnualLeaveSettings(metadata, fallbackYear);
  if (settings.totalHours <= 0) {
    return null;
  }

  const appUsages = getAnnualLeaveUsagesFromOverrides(overrides, settings.year);
  const balance = calculateAnnualLeaveBalance({
    totalDays: settings.totalHours / ANNUAL_LEAVE_HOURS_PER_DAY,
    usedHoursBeforeApp: settings.usedHoursBeforeApp,
    appUsages,
  });

  return {
    year: settings.year,
    totalDays: Math.floor(settings.totalHours / ANNUAL_LEAVE_HOURS_PER_DAY),
    usedHours: balance.usedHours,
    remainingLabel: balance.remainingLabel,
  };
}
