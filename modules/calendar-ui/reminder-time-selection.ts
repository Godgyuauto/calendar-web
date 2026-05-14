export {
  CLOCK_MINUTE_OPTIONS as REMINDER_MINUTE_OPTIONS,
  commitClockMinuteDraft as commitReminderMinuteDraft,
  normalizeClockMinuteDraft as normalizeReminderMinuteDraft,
  toClockTimeParts as toReminderTimeParts,
  toClockTimeValue as toReminderTimeValue,
  type ClockPeriod as ReminderPeriod,
  type ClockTimeParts as ReminderTimeParts,
} from "@/modules/calendar-ui/clock-time-selection";
