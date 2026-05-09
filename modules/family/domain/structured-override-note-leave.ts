import type { LeaveDeductionLabel } from "@/modules/leave/annual-leave-deduction";

export function readNumber(source: Record<string, unknown>, keys: readonly string[]): number | null {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }
  return null;
}

export function readLeaveDeductionLabel(value: string | null): LeaveDeductionLabel | null {
  return value === "연차" || value === "반차" || value === "시간 연차" ? value : null;
}
