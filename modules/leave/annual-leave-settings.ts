export const ANNUAL_LEAVE_METADATA_KEYS = {
  year: "annual_leave_year",
  totalHours: "annual_leave_total_hours",
  usedHoursBeforeApp: "annual_leave_used_before_app_hours",
} as const;

export interface AnnualLeaveSettings {
  year: number;
  totalHours: number;
  usedHoursBeforeApp: number;
}

function readWholeNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.floor(value));
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : null;
  }
  return null;
}

export function parseAnnualLeaveSettings(
  metadata: Record<string, unknown>,
  fallbackYear: number,
): AnnualLeaveSettings {
  return {
    year: readWholeNumber(metadata[ANNUAL_LEAVE_METADATA_KEYS.year]) ?? fallbackYear,
    totalHours: readWholeNumber(metadata[ANNUAL_LEAVE_METADATA_KEYS.totalHours]) ?? 0,
    usedHoursBeforeApp:
      readWholeNumber(metadata[ANNUAL_LEAVE_METADATA_KEYS.usedHoursBeforeApp]) ?? 0,
  };
}

export function toAnnualLeaveMetadata(
  settings: AnnualLeaveSettings,
): Record<string, number> {
  return {
    [ANNUAL_LEAVE_METADATA_KEYS.year]: settings.year,
    [ANNUAL_LEAVE_METADATA_KEYS.totalHours]: settings.totalHours,
    [ANNUAL_LEAVE_METADATA_KEYS.usedHoursBeforeApp]: settings.usedHoursBeforeApp,
  };
}
