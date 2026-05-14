import type { ShiftOverride } from "@/modules/shift";
import type { OverrideType, ShiftCode } from "@/modules/shift";
import { parseStructuredOverrideNote } from "@/modules/family/domain/structured-override-note";

type ShiftChange = ShiftCode | "KEEP";

export interface StructuredOverrideNotificationBodyV1 {
  schema: "override_notification_v1";
  date: string;
  title: string;
  event_type: OverrideType;
  event_type_label: string;
  shift_change: ShiftChange;
  shift_change_label: string;
  subject_label?: string;
  actor_label?: string;
}

const EVENT_TYPE_LABELS: Record<OverrideType, string> = {
  vacation: "휴가",
  training: "교육",
  swap: "교대",
  extra: "추가근무",
  sick: "병가",
  business: "출장",
  custom: "커스텀",
};

export function buildStructuredOverrideNotificationBody(
  override: ShiftOverride,
  labels?: {
    subjectLabel?: string | null;
    actorLabel?: string | null;
  },
): StructuredOverrideNotificationBodyV1 {
  const structured = parseStructuredOverrideNote(override.note, {
    eventType: override.overrideType,
    shiftChange: override.overrideShift ?? "KEEP",
  });
  const eventType = structured?.event_type ?? override.overrideType;
  const shiftChange = structured?.shift_change ?? override.overrideShift ?? "KEEP";
  const eventTypeLabel = EVENT_TYPE_LABELS[eventType];
  const shiftChangeLabel = shiftChange === "KEEP" ? "유지" : shiftChange;
  const titleCandidate = structured?.title?.trim() ?? override.label.trim();

  const payload: StructuredOverrideNotificationBodyV1 = {
    schema: "override_notification_v1",
    date: override.date,
    title: titleCandidate.length > 0 ? titleCandidate : eventTypeLabel,
    event_type: eventType,
    event_type_label: eventTypeLabel,
    shift_change: shiftChange,
    shift_change_label: shiftChangeLabel,
  };
  const subjectLabel = labels?.subjectLabel?.trim();
  const actorLabel = labels?.actorLabel?.trim();
  if (subjectLabel) {
    payload.subject_label = subjectLabel;
  }
  if (actorLabel) {
    payload.actor_label = actorLabel;
  }

  return payload;
}
