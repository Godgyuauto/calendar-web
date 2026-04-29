import type { StructuredOverrideFormState } from "@/modules/calendar-ui/structured-override";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isDateTimeRangeInvalid(form: StructuredOverrideFormState): boolean {
  if (!DATE_PATTERN.test(form.startDate) || !DATE_PATTERN.test(form.endDate)) {
    return true;
  }

  const startUnix = new Date(`${form.startDate}T${form.startAt}`).getTime();
  const endUnix = new Date(`${form.endDate}T${form.endAt}`).getTime();
  if (Number.isNaN(startUnix) || Number.isNaN(endUnix)) {
    return true;
  }

  return endUnix <= startUnix;
}

export function formatKoreanDate(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
    timeZone: "Asia/Seoul",
  }).format(date);
}

export function getTimeRangeError(form: StructuredOverrideFormState): string | null {
  const hasStartAt = form.startAt.trim().length > 0;
  const hasEndAt = form.endAt.trim().length > 0;
  if (!hasStartAt && !hasEndAt) {
    return null;
  }
  if (hasStartAt !== hasEndAt) {
    return "시작/종료 시간을 함께 입력해주세요.";
  }
  return isDateTimeRangeInvalid(form)
    ? "시작/종료 시간을 확인해주세요."
    : null;
}
