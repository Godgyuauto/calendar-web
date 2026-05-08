export const ANNUAL_LEAVE_HOURS_PER_DAY = 8;

export interface AnnualLeaveUsage {
  hours: number;
}

export interface AnnualLeaveBalanceInput {
  totalDays: number;
  usedHoursBeforeApp: number;
  appUsages: AnnualLeaveUsage[];
}

export interface AnnualLeaveBalance {
  totalHours: number;
  usedHours: number;
  remainingHours: number;
  remainingDays: number;
  remainingExtraHours: number;
  remainingLabel: string;
}

function toWholeHours(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.floor(value));
}

function formatRemainingLabel(days: number, hours: number): string {
  return hours > 0 ? `${days}개 ${hours}시간` : `${days}개`;
}

export function calculateAnnualLeaveBalance(
  input: AnnualLeaveBalanceInput,
): AnnualLeaveBalance {
  const totalHours = toWholeHours(input.totalDays * ANNUAL_LEAVE_HOURS_PER_DAY);
  const usedHours = input.appUsages.reduce(
    (sum, usage) => sum + toWholeHours(usage.hours),
    toWholeHours(input.usedHoursBeforeApp),
  );
  const remainingHours = Math.max(0, totalHours - usedHours);
  const remainingDays = Math.floor(remainingHours / ANNUAL_LEAVE_HOURS_PER_DAY);
  const remainingExtraHours = remainingHours % ANNUAL_LEAVE_HOURS_PER_DAY;

  return {
    totalHours,
    usedHours,
    remainingHours,
    remainingDays,
    remainingExtraHours,
    remainingLabel: formatRemainingLabel(remainingDays, remainingExtraHours),
  };
}
