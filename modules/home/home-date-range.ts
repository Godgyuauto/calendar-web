export function toMonthRangeInSeoul(
  currentYear: number,
  currentMonth: number,
): { startInclusive: string; endExclusive: string } {
  const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
  const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
  const mm = String(currentMonth).padStart(2, "0");
  const nextMm = String(nextMonth).padStart(2, "0");
  return {
    startInclusive: `${currentYear}-${mm}-01T00:00:00+09:00`,
    endExclusive: `${nextYear}-${nextMm}-01T00:00:00+09:00`,
  };
}

export function toYearDateRange(
  year: number,
): { startDateKey: string; endDateKey: string } {
  return {
    startDateKey: `${year}-01-01`,
    endDateKey: `${year + 1}-01-01`,
  };
}
