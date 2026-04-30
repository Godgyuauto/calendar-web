export type ViewMode = "month" | "week" | "day";

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const VIEW_MODES = new Set<ViewMode>(["month", "week", "day"]);

export function offsetMonth(
  year: number,
  month: number,
  offset: number,
): { year: number; month: number } {
  const date = new Date(Date.UTC(year, month - 1 + offset, 1));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
}

export function normalizeDateKey(rawDate: string | null | undefined): string | undefined {
  if (!rawDate || !DATE_KEY_PATTERN.test(rawDate)) {
    return undefined;
  }

  const [year, month, day] = rawDate.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() + 1 !== month ||
    parsed.getUTCDate() !== day
  ) {
    return undefined;
  }
  return rawDate;
}

export function parseViewMode(rawView: string | null | undefined): ViewMode {
  return rawView && VIEW_MODES.has(rawView as ViewMode) ? (rawView as ViewMode) : "month";
}

export function buildMonthHref(
  pathname: string,
  baseParams: URLSearchParams,
  year: number,
  month: number,
): string {
  const params = new URLSearchParams(baseParams.toString());
  params.set("year", String(year));
  params.set("month", String(month));
  params.delete("add");
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function buildDayHref(
  pathname: string,
  baseParams: URLSearchParams,
  dateKey: string,
): string {
  const [year, month] = dateKey.split("-").map(Number);
  const params = new URLSearchParams(baseParams.toString());
  params.set("year", String(year));
  params.set("month", String(month));
  params.set("view", "day");
  params.set("day", dateKey);
  params.delete("add");
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}
