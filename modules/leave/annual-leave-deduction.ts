export type LeaveDeductionLabel = "연차" | "반차" | "시간 연차";

export interface LeaveDeduction {
  hours: number;
  label: LeaveDeductionLabel;
}

export function normalizeLeaveDeduction(hours: number): LeaveDeduction {
  const safeHours = Math.min(8, Math.max(1, Math.trunc(hours)));
  if (safeHours === 8) {
    return { hours: 8, label: "연차" };
  }
  if (safeHours === 4) {
    return { hours: 4, label: "반차" };
  }
  return { hours: safeHours, label: "시간 연차" };
}
