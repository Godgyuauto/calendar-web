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
import { readHomeFamilyCache, writeHomeFamilyCache } from "@/modules/home/home-family-cache";
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
}

interface FamilyReadModel {
  displayName: string;
  overrides: ShiftOverride[];
  routineEvents: FamilyEvent[];
  upcomingEvents: UpcomingScheduleItem[];
  realtimeTopic: string | null;
}

function emptyFamilyReadModel(): FamilyReadModel {
  return {
    displayName: "나",
    overrides: [],
    routineEvents: [],
    upcomingEvents: [],
    realtimeTopic: null,
  };
}

function toMonthRangeInSeoul(
  currentYear: number,
  currentMonth: number,
): { startInclusive: string; endExclusive: string } {
  const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
  const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
  const mm = String(currentMonth).padStart(2, "0");
  const nextMm = String(nextMonth).padStart(2, "0");
  return {
    startInclusive: `${currentYear}-${mm}-01T00:00:00+09:00`,
    endExclusive: `${nextYear}-${nextMm}-01T00:00:00+09:00`,
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
  const realtimeTopic = buildFamilyCalendarRealtimeTopic(auth.familyId);
  const monthRange = toMonthRangeInSeoul(currentYear, currentMonth);
  const monthStartMs = new Date(monthRange.startInclusive).getTime();
  const monthEndMs = new Date(monthRange.endExclusive).getTime();
  const upcomingWindow = getUpcomingWindow(toSeoulDateKey(now));
  try {
    const [profile, monthEvents, monthOverrides, weekOverrides] = await Promise.all([
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
    ]);
    displayName = profile.displayName ?? "나";
    routineEvents = monthEvents
      .filter(
        (event) =>
          event.isRoutine && (() => {
            const startMs = new Date(event.startTime).getTime();
            return startMs >= monthStartMs && startMs < monthEndMs;
          })(),
      )
      .slice(0, 8);
    upcomingEvents = buildUpcomingScheduleItems({
      events: monthEvents,
      overrides: weekOverrides,
      window: upcomingWindow,
    });
    overrides = monthOverrides;
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
  };
}
export { DEFAULT_SHIFT_PATTERN_V1 };
