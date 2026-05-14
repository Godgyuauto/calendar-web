const TIME_ZONE = "Asia/Seoul";

export type NotificationJobTextInput = {
  title: string;
  body: string;
  remind_at: string;
};

type StructuredOverrideNotificationBodyV1 = {
  schema: "override_notification_v1";
  date: string;
  title: string;
  event_type: string;
  event_type_label: string;
  shift_change: string;
  shift_change_label: string;
  subject_label?: string;
  actor_label?: string;
};

function formatSeoulTime(iso: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: TIME_ZONE, dateStyle: "medium", timeStyle: "short",
  }).format(new Date(iso));
}

function readOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseStructuredBody(rawBody: string): StructuredOverrideNotificationBodyV1 | null {
  try {
    const parsed = JSON.parse(rawBody) as Partial<StructuredOverrideNotificationBodyV1>;
    if (
      parsed.schema !== "override_notification_v1" ||
      typeof parsed.date !== "string" ||
      typeof parsed.title !== "string" ||
      typeof parsed.event_type !== "string" ||
      typeof parsed.event_type_label !== "string" ||
      typeof parsed.shift_change !== "string" ||
      typeof parsed.shift_change_label !== "string"
    ) {
      return null;
    }

    return {
      schema: "override_notification_v1",
      date: parsed.date,
      title: parsed.title,
      event_type: parsed.event_type,
      event_type_label: parsed.event_type_label,
      shift_change: parsed.shift_change,
      shift_change_label: parsed.shift_change_label,
      subject_label: readOptionalString(parsed.subject_label),
      actor_label: readOptionalString(parsed.actor_label),
    };
  } catch {
    return null;
  }
}

export function buildTelegramTextForNotificationJob(job: NotificationJobTextInput): string {
  const structured = parseStructuredBody(job.body);
  if (structured) {
    const lines = [
      job.title,
      structured.subject_label ? `주체: ${structured.subject_label}` : "",
      structured.actor_label ? `추가자: ${structured.actor_label}` : "",
      `제목: ${structured.title}`,
      `일정 유형: ${structured.event_type_label}`,
      `근무조 변경: ${structured.shift_change_label}`,
      `대상 날짜: ${structured.date}`,
      `알림 시간: ${formatSeoulTime(job.remind_at)} (${TIME_ZONE})`,
    ].filter((line) => line.trim().length > 0);
    return lines.join("\n");
  }

  const lines = [
    job.title,
    job.body,
    `알림 시간: ${formatSeoulTime(job.remind_at)} (${TIME_ZONE})`,
  ].filter((line) => line.trim().length > 0);
  return lines.join("\n");
}
