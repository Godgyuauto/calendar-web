import { ANNUAL_LEAVE_HOURS_PER_DAY } from "@/modules/leave/annual-leave";
import type { AnnualLeaveSettings } from "@/modules/leave/annual-leave-settings";

export type AnnualLeaveSettingsValidationResult =
  | { ok: true; data: AnnualLeaveSettings }
  | { ok: false; message: string };

function readWholeNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.floor(value);
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.floor(parsed) : null;
  }
  return null;
}

export function validateAnnualLeaveSettingsForm(
  body: Record<string, unknown>,
): AnnualLeaveSettingsValidationResult {
  const year = readWholeNumber(body.year);
  const totalDays = readWholeNumber(body.totalDays);
  const remainingDays = readWholeNumber(body.remainingDays);
  const remainingHours = readWholeNumber(body.remainingHours);

  if (!year || year < 2020 || year > 2100) {
    return { ok: false, message: "연도를 확인해주세요." };
  }
  if (totalDays === null || totalDays < 0 || totalDays > 60) {
    return { ok: false, message: "총 연차 개수를 확인해주세요." };
  }
  if (remainingDays === null || remainingDays < 0 || remainingDays > 60) {
    return { ok: false, message: "남은 연차 개수를 확인해주세요." };
  }
  if (
    remainingHours === null ||
    remainingHours < 0 ||
    remainingHours >= ANNUAL_LEAVE_HOURS_PER_DAY
  ) {
    return { ok: false, message: "남은 시간을 0~7시간으로 입력해주세요." };
  }

  const totalHours = totalDays * ANNUAL_LEAVE_HOURS_PER_DAY;
  const remainingTotalHours =
    remainingDays * ANNUAL_LEAVE_HOURS_PER_DAY + remainingHours;
  if (remainingTotalHours > totalHours) {
    return { ok: false, message: "남은 연차가 총 연차보다 많을 수 없습니다." };
  }

  return {
    ok: true,
    data: {
      year,
      totalHours,
      usedHoursBeforeApp: totalHours - remainingTotalHours,
    },
  };
}
