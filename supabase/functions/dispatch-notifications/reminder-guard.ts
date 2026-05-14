const DATETIME_LOCAL_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

export function normalizeReminderIso(raw: string | null | undefined): string | null {
  if (!raw) {
    return null;
  }
  const value = raw.trim();
  if (!value) {
    return null;
  }

  const date = new Date(DATETIME_LOCAL_PATTERN.test(value) ? `${value}:00+09:00` : value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function remindersMatch(
  sourceReminder: string | null | undefined,
  jobReminder: string | null | undefined,
): boolean {
  const source = normalizeReminderIso(sourceReminder);
  const job = normalizeReminderIso(jobReminder);
  return Boolean(source && job && source === job);
}
