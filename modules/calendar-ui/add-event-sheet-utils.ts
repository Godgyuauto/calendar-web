import type { StructuredOverrideFormState } from "@/modules/calendar-ui/structured-override";

function isDateTimeRangeInvalid(dateKey: string, startAt: string, endAt: string): boolean {
  const startUnix = new Date(`${dateKey}T${startAt}`).getTime();
  const endUnix = new Date(`${dateKey}T${endAt}`).getTime();
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

export function getTimeRangeError(
  dateKey: string,
  form: StructuredOverrideFormState,
): string | null {
  const hasStartAt = form.startAt.trim().length > 0;
  const hasEndAt = form.endAt.trim().length > 0;
  if (!hasStartAt && !hasEndAt) {
    return null;
  }
  if (hasStartAt !== hasEndAt) {
    return "시작/종료 시간을 함께 입력해주세요.";
  }
  return isDateTimeRangeInvalid(dateKey, form.startAt, form.endAt)
    ? "시작/종료 시간을 확인해주세요."
    : null;
}
