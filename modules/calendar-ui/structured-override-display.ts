import { parseStructuredNote, toDateTimeLocalOrNull } from "@/modules/calendar-ui/structured-override-note";
import { getEventTypeOption } from "@/modules/calendar-ui/structured-override-options";
import type {
  OverrideRecordLike,
  StructuredOverrideDisplay,
} from "@/modules/calendar-ui/structured-override-types";

export function toStructuredOverrideDisplay(
  override: OverrideRecordLike,
): StructuredOverrideDisplay {
  const note = parseStructuredNote(override.note, {
    eventType: override.overrideType,
    shiftChange: override.overrideShift ?? "KEEP",
  });
  const eventType = note?.event_type ?? override.overrideType;
  return {
    title: note ? note.title : override.label.trim(),
    eventType,
    shiftChange: note?.shift_change ?? override.overrideShift ?? "KEEP",
    allDay: note?.all_day ?? !(override.startTime || override.endTime),
    startAt: note?.start_at ?? toDateTimeLocalOrNull(override.startTime),
    endAt: note?.end_at ?? toDateTimeLocalOrNull(override.endTime),
    remindAt: note?.remind_at ?? null,
    memo: note?.memo ?? "",
  };
}

export function getMonthGridOverrideLabel(override: OverrideRecordLike): string {
  const note = parseStructuredNote(override.note, {
    eventType: override.overrideType,
    shiftChange: override.overrideShift ?? "KEEP",
  });

  if (note) {
    const title = note.title.trim();
    const eventTypeLabel = getEventTypeOption(note.event_type).label;
    const shiftChangeLabel = note.shift_change === "KEEP" ? "유지" : note.shift_change;

    if (title) {
      return `${title} · ${eventTypeLabel}/${shiftChangeLabel}`;
    }

    return note.shift_change === "KEEP"
      ? eventTypeLabel
      : `${eventTypeLabel}/${shiftChangeLabel}`;
  }
  return override.label.trim();
}
