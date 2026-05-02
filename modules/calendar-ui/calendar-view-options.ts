import type { ViewMode } from "@/modules/calendar-ui/calendar-url-state";

export const CALENDAR_VIEW_OPTIONS: { value: ViewMode; label: string }[] = [
  { value: "month", label: "월" },
  { value: "week", label: "주" },
  { value: "day", label: "일" },
];
