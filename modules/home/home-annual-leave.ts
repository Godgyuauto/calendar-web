import {
  ANNUAL_LEAVE_HOURS_PER_DAY,
  calculateAnnualLeaveBalance,
} from "@/modules/leave/annual-leave";
import { parseAnnualLeaveSettings } from "@/modules/leave/annual-leave-settings";
import {
  getAnnualLeaveUsageDetailsFromOverrides,
  getAnnualLeaveUsagesFromOverrides,
} from "@/modules/leave/annual-leave-usage";
import type { ShiftOverride } from "@/modules/shift";

export interface AnnualLeaveHistoryItem {
  date: string;
  amountLabel: string;
}

export interface AnnualLeaveHomeData {
  year: number;
  totalDays: number;
  usedHours: number;
  remainingLabel: string;
  history: AnnualLeaveHistoryItem[];
}

function formatHistoryAmount(input: {
  hours: number;
  deductionLabel: string;
  exemptReason: "public_holiday" | "company_holiday" | null;
}): string {
  if (input.exemptReason === "public_holiday") {
    return "공휴일 · 차감 없음";
  }
  if (input.exemptReason === "company_holiday") {
    return "회사 휴일 · 차감 없음";
  }
  return `${input.deductionLabel}(${input.hours}시간)`;
}

export function buildAnnualLeaveHomeData(
  metadata: Record<string, unknown>,
  overrides: ShiftOverride[],
  fallbackYear: number,
  targetUserId?: string,
): AnnualLeaveHomeData | null {
  const settings = parseAnnualLeaveSettings(metadata, fallbackYear);
  if (settings.totalHours <= 0) {
    return null;
  }

  const trackedOverrides = overrides.filter(
    (override) => override.date >= settings.trackingStartDate,
  );
  const appUsages = getAnnualLeaveUsagesFromOverrides(trackedOverrides, settings.year, {
    targetUserId,
  });
  const history = getAnnualLeaveUsageDetailsFromOverrides(
    trackedOverrides,
    settings.year,
    { targetUserId },
  )
    .slice()
    .sort((first, second) => first.date.localeCompare(second.date))
    .map((usage) => ({
      date: usage.date,
      amountLabel: formatHistoryAmount(usage),
    }));
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
    history,
  };
}
