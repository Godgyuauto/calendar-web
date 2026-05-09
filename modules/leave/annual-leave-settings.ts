export const ANNUAL_LEAVE_METADATA_KEYS = {
  year: "annual_leave_year",
  totalHours: "annual_leave_total_hours",
  usedHoursBeforeApp: "annual_leave_used_before_app_hours",
  trackingStartDate: "annual_leave_tracking_start_date",
} as const;

export interface AnnualLeaveSettings {
  year: number;
  totalHours: number;
  usedHoursBeforeApp: number;
  trackingStartDate: string;
}

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

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

export function getDefaultAnnualLeaveTrackingStartDate(year: number): string {
  return year === 2026 ? "2026-05-01" : `${year}-01-01`;
}

function readDateKey(value: unknown): string | null {
  return typeof value === "string" && DATE_KEY_PATTERN.test(value) ? value : null;
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
    trackingStartDate:
      readDateKey(metadata[ANNUAL_LEAVE_METADATA_KEYS.trackingStartDate]) ??
      getDefaultAnnualLeaveTrackingStartDate(
        readWholeNumber(metadata[ANNUAL_LEAVE_METADATA_KEYS.year]) ?? fallbackYear,
      ),
  };
}

export function toAnnualLeaveMetadata(
  settings: AnnualLeaveSettings,
): Record<string, number | string> {
  return {
    [ANNUAL_LEAVE_METADATA_KEYS.year]: settings.year,
    [ANNUAL_LEAVE_METADATA_KEYS.totalHours]: settings.totalHours,
    [ANNUAL_LEAVE_METADATA_KEYS.usedHoursBeforeApp]: settings.usedHoursBeforeApp,
    [ANNUAL_LEAVE_METADATA_KEYS.trackingStartDate]: settings.trackingStartDate,
  };
}
