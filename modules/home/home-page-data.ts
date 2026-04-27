import { CalendarCell, buildMonthCalendarGrid } from "@/modules/calendar";
import type { FamilyEvent } from "@/modules/family";
import {
  getApiAuthFailure,
  resolveFamilyAuthContextFromToken,
} from "@/modules/family/api/auth-context";
import { readAuthProfileFromSupabase } from "@/modules/family/api/family-auth-profile-supabase";
import { listFamilyEventsFromSupabase } from "@/modules/family/api/family-events-supabase";
import { listShiftOverridesFromSupabase } from "@/modules/family/api/family-overrides-supabase";
import { getFamilyRepositoryFailure } from "@/modules/family/api/family-supabase-common";
import {
  DEFAULT_SHIFT_PATTERN_V1,
  DayShiftSummary,
  type ShiftOverride,
  getMonthShiftSummary,
  getTodayShiftSummary,
} from "@/modules/shift";
import { getServerAccessTokenFromCookies } from "@/modules/home/access-token";
import { readHomeFamilyCache, writeHomeFamilyCache } from "@/modules/home/home-family-cache";
import { getSeoulMonth, getSeoulYear, toSeoulDateKey } from "@/modules/home/utils/date";

export interface HomePageData {
  displayName: string;
  currentYear: number;
  currentMonth: number;
  todayKey: string;
  monthRows: DayShiftSummary[];
  todaySummary: DayShiftSummary;
  routineEvents: FamilyEvent[];
  upcomingEvents: FamilyEvent[];
  calendarCells: CalendarCell[];
}

interface FamilyReadModel {
  displayName: string;
  overrides: ShiftOverride[];
  routineEvents: FamilyEvent[];
  upcomingEvents: FamilyEvent[];
}

function emptyFamilyReadModel(): FamilyReadModel {
  return {
    displayName: "나",
    overrides: [],
    routineEvents: [],
    upcomingEvents: [],
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
  let upcomingEvents: FamilyEvent[];
  let overrides: ShiftOverride[];
  const monthRange = toMonthRangeInSeoul(currentYear, currentMonth);
  const monthStartMs = new Date(monthRange.startInclusive).getTime();
  const monthEndMs = new Date(monthRange.endExclusive).getTime();
  const nowMsEpoch = now.getTime();
  try {
    const [profile, monthAndUpcomingEvents, monthOverrides] = await Promise.all([
      readAuthProfileFromSupabase(auth),
      listFamilyEventsFromSupabase(auth, {
        startTimeGte: monthRange.startInclusive,
        limit: 64,
      }),
      listShiftOverridesFromSupabase(auth, { year: currentYear, month: currentMonth }),
    ]);
    displayName = profile.displayName ?? "나";
    routineEvents = monthAndUpcomingEvents
      .filter(
        (event) =>
          event.isRoutine && (() => {
            const startMs = new Date(event.startTime).getTime();
            return startMs >= monthStartMs && startMs < monthEndMs;
          })(),
      )
      .slice(0, 8);
    upcomingEvents = monthAndUpcomingEvents
      .filter(
        (event) =>
          !event.isRoutine && new Date(event.startTime).getTime() >= nowMsEpoch,
      )
      .slice(0, 4);
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
    routineEvents: familyModel.routineEvents,
    upcomingEvents: familyModel.upcomingEvents,
    calendarCells,
  };
}

export { DEFAULT_SHIFT_PATTERN_V1 };
