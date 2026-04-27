export function isISODateKey(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function isISODateTime(value: string): boolean {
  return !Number.isNaN(new Date(value).getTime());
}

export function validateEventWindow(startTime: string, endTime: string): void {
  if (!isISODateTime(startTime) || !isISODateTime(endTime)) {
    throw new Error("startTime/endTime must be valid ISO datetime strings.");
  }

  if (new Date(endTime).getTime() <= new Date(startTime).getTime()) {
    throw new Error("endTime must be greater than startTime.");
  }
}
