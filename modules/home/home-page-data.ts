import { CalendarCell, buildMonthCalendarGrid } from "@/modules/calendar";
import type { FamilyEvent } from "@/modules/family";
import {
  getApiAuthFailure,
  resolveFamilyAuthContextFromToken,
} from "@/modules/family/api/_common";
import { readAuthProfileFromSupabase } from "@/modules/family/api/settings";
import { listFamilyEventsFromSupabase } from "@/modules/family/api/events";
import { listShiftOverridesFromSupabase } from "@/modules/family/api/overrides";
import { getFamilyRepositoryFailure } from "@/modules/family/api/_common";
import { buildFamilyCalendarRealtimeTopic } from "@/modules/family/api/_common/family-realtime-topic";
import {
  DEFAULT_SHIFT_PATTERN_V1,
  DayShiftSummary,
  type ShiftOverride,
  getMonthShiftSummary,
  getTodayShiftSummary,
} from "@/modules/shift";
import { getServerAccessTokenFromCookies } from "@/modules/home/access-token";
import {
  buildAnnualLeaveHomeData,
  type AnnualLeaveHomeData,
} from "@/modules/home/home-annual-leave";
import { readAnnualLeaveMetadataForHome } from "@/modules/home/home-annual-leave-metadata";
import { toMonthRangeInSeoul, toYearDateRange } from "@/modules/home/home-date-range";
import { readHomeFamilyCache, writeHomeFamilyCache } from "@/modules/home/home-family-cache";
import { pickRoutineEventsInWindow } from "@/modules/home/home-routine-events";
import {
  buildUpcomingScheduleItems,
  getUpcomingWindow,
  type UpcomingScheduleItem,
} from "@/modules/home/upcoming-schedule";
import { getSeoulMonth, getSeoulYear, toSeoulDateKey } from "@/modules/home/utils/date";

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

interface FamilyReadModel {
  displayName: string;
  overrides: ShiftOverride[];
  routineEvents: FamilyEvent[];
  upcomingEvents: UpcomingScheduleItem[];
  realtimeTopic: string | null;
  annualLeave: AnnualLeaveHomeData | null;
}

function emptyFamilyReadModel(): FamilyReadModel {
  return {
    displayName: "나",
    overrides: [],
    routineEvents: [],
    upcomingEvents: [],
    realtimeTopic: null,
    annualLeave: null,
  };
}

async function readFamilyModelFromSupabase(
  currentYear: number,
  currentMonth: number,
  now: Date,
): Promise<FamilyReadModel> {
  const accessToken = await getServerAccessTokenFromCookies();
  if (!accessToken) {
    return emptyFamilyReadModel();
  }

  let auth: Awaited<ReturnType<typeof resolveFamilyAuthContextFromToken>>;
  try {
    auth = await resolveFamilyAuthContextFromToken(accessToken);
  } catch (error) {
    const failure = getApiAuthFailure(error);
    if (failure) {
      return emptyFamilyReadModel();
    }

    throw error;
  }

  const nowMs = Date.now();
  const cacheKey = `${auth.familyId}:${auth.userId}:${currentYear}-${String(currentMonth).padStart(2, "0")}`;
  const cached = readHomeFamilyCache<FamilyReadModel>(cacheKey, nowMs);
  if (cached) {
    return cached;
  }

  let displayName = "나";
  let routineEvents: FamilyEvent[];
  let upcomingEvents: UpcomingScheduleItem[];
  let overrides: ShiftOverride[];
  let annualLeave: AnnualLeaveHomeData | null;
  const realtimeTopic = buildFamilyCalendarRealtimeTopic(auth.familyId);
  const monthRange = toMonthRangeInSeoul(currentYear, currentMonth);
  const yearRange = toYearDateRange(currentYear);
  const monthStartMs = new Date(monthRange.startInclusive).getTime();
  const monthEndMs = new Date(monthRange.endExclusive).getTime();
  const upcomingWindow = getUpcomingWindow(toSeoulDateKey(now));
  try {
    const [profile, monthEvents, monthOverrides, weekOverrides, yearMineOverrides, leaveMetadata] =
      await Promise.all([
      readAuthProfileFromSupabase(auth),
      listFamilyEventsFromSupabase(auth, {
        startTimeGte: monthRange.startInclusive,
        limit: 64,
      }),
      listShiftOverridesFromSupabase(auth, { year: currentYear, month: currentMonth }),
      listShiftOverridesFromSupabase(auth, {
        startDateGte: upcomingWindow.startDateKey,
        startDateLt: upcomingWindow.endDateKey,
      }),
      listShiftOverridesFromSupabase(auth, {
        startDateGte: yearRange.startDateKey,
        startDateLt: yearRange.endDateKey,
        scope: "mine",
      }),
      readAnnualLeaveMetadataForHome(auth.userId, auth.accessToken),
    ]);
    displayName = profile.displayName ?? "나";
    routineEvents = pickRoutineEventsInWindow(monthEvents, monthStartMs, monthEndMs);
    upcomingEvents = buildUpcomingScheduleItems({
      events: monthEvents,
      overrides: weekOverrides,
      window: upcomingWindow,
    });
    overrides = monthOverrides;
    annualLeave = buildAnnualLeaveHomeData(leaveMetadata, yearMineOverrides, currentYear);
  } catch (error) {
    const failure = getFamilyRepositoryFailure(error);
    if (failure) {
      return emptyFamilyReadModel();
    }

    throw error;
  }

  const model: FamilyReadModel = {
    displayName,
    overrides,
    routineEvents,
    upcomingEvents,
    realtimeTopic,
    annualLeave,
  };
  writeHomeFamilyCache(cacheKey, model, nowMs);
  return model;
}

export async function getHomePageData(now: Date = new Date()): Promise<HomePageData> {
  const currentYear = getSeoulYear(now);
  const currentMonth = getSeoulMonth(now);
  const todayKey = toSeoulDateKey(now);

  const familyModel = await readFamilyModelFromSupabase(currentYear, currentMonth, now);

  const monthRows = getMonthShiftSummary({
    year: currentYear,
    month: currentMonth,
    overrides: familyModel.overrides,
    pattern: DEFAULT_SHIFT_PATTERN_V1,
  });

  const todaySummary = getTodayShiftSummary({
    overrides: familyModel.overrides,
    pattern: DEFAULT_SHIFT_PATTERN_V1,
  });

  const calendarCells = buildMonthCalendarGrid({
    year: currentYear,
    month: currentMonth,
    shifts: monthRows,
  });

  return {
    displayName: familyModel.displayName,
    currentYear,
    currentMonth,
    todayKey,
    monthRows,
    todaySummary,
    monthOverrides: familyModel.overrides,
    routineEvents: familyModel.routineEvents,
    upcomingEvents: familyModel.upcomingEvents,
    calendarCells,
    realtimeTopic: familyModel.realtimeTopic,
    annualLeave: familyModel.annualLeave,
  };
}
export { DEFAULT_SHIFT_PATTERN_V1 };
