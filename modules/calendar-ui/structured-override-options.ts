import type { ShiftCode } from "@/modules/shift";
import type { EventTypeOption } from "@/modules/calendar-ui/structured-override-types";
import type { OverrideType } from "@/modules/shift";

export const EVENT_TYPE_OPTIONS: EventTypeOption[] = [
  { id: "vacation", emoji: "🏖", label: "휴가" },
  { id: "training", emoji: "📚", label: "교육" },
  { id: "swap", emoji: "🔄", label: "교대" },
  { id: "extra", emoji: "⏰", label: "추가근무" },
  { id: "sick", emoji: "🏥", label: "병가" },
  { id: "business", emoji: "✈️", label: "출장" },
  { id: "custom", emoji: "✏️", label: "커스텀" },
];

export const OFF_REASON_OPTIONS: EventTypeOption[] = EVENT_TYPE_OPTIONS.filter((option) =>
  ["vacation", "sick", "custom"].includes(option.id),
);

export const SHIFT_CHANGE_OPTIONS: (ShiftCode | "KEEP")[] = ["A", "B", "C", "OFF", "KEEP"];

export function getEventTypeOption(type: OverrideType): EventTypeOption {
  return EVENT_TYPE_OPTIONS.find((option) => option.id === type) ?? EVENT_TYPE_OPTIONS[0];
}
