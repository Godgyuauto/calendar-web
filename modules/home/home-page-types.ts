import type { CalendarCell } from "@/modules/calendar";
import type { FamilyEvent } from "@/modules/family";
import type { AnnualLeaveHomeData } from "@/modules/home/home-annual-leave";
import type { UpcomingScheduleItem } from "@/modules/home/upcoming-schedule";
import type { DayShiftSummary, ShiftOverride } from "@/modules/shift";

export interface HomePageData {
  displayName: string;
  currentYear: number;
  currentMonth: number;
  todayKey: string;
  monthRows: DayShiftSummary[];
  todaySummary: DayShiftSummary;
  monthOverrides: ShiftOverride[];
  routineEvents: FamilyEvent[];
  upcomingEvents: UpcomingScheduleItem[];
  calendarCells: CalendarCell[];
  realtimeTopic: string | null;
  annualLeave: AnnualLeaveHomeData | null;
}

export interface FamilyReadModel {
  displayName: string;
  overrides: ShiftOverride[];
  routineEvents: FamilyEvent[];
  upcomingEvents: UpcomingScheduleItem[];
  realtimeTopic: string | null;
  annualLeave: AnnualLeaveHomeData | null;
}
