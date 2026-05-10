import { buildMonthCalendarGrid } from "@/modules/calendar";
import type { FamilyEvent } from "@/modules/family";
import {
  getApiAuthFailure,
  resolveFamilyAuthContextFromToken,
} from "@/modules/family/api/_common";
import { readAuthProfileFromSupabase } from "@/modules/family/api/settings";
import { listFamilyEventsFromSupabase } from "@/modules/family/api/events";
import { listFamilyMembersFromSupabase } from "@/modules/family/api/members";
import { listShiftOverridesFromSupabase } from "@/modules/family/api/overrides";
import { getFamilyRepositoryFailure } from "@/modules/family/api/_common";
import { buildFamilyCalendarRealtimeTopic } from "@/modules/family/api/_common/family-realtime-topic";
import {
  DEFAULT_SHIFT_PATTERN_V1,
  type ShiftOverride,
  getMonthShiftSummary,
  getTodayShiftSummary,
} from "@/modules/shift";
import { getServerAccessTokenFromCookies } from "@/modules/home/access-token";
import { buildAnnualLeaveHomeData } from "@/modules/home/home-annual-leave";
import { readAnnualLeaveMetadataForHome } from "@/modules/home/home-annual-leave-metadata";
import { toMonthRangeInSeoul, toYearDateRange } from "@/modules/home/home-date-range";
import { readHomeFamilyCache, writeHomeFamilyCache } from "@/modules/home/home-family-cache";
import { pickRoutineEventsInWindow } from "@/modules/home/home-routine-events";
import {
  buildUpcomingScheduleItems,
  getUpcomingWindow,
  type UpcomingScheduleItem,
} from "@/modules/home/upcoming-schedule";
import type { FamilyReadModel, HomePageData } from "@/modules/home/home-page-types";
import { getSeoulMonth, getSeoulYear, toSeoulDateKey } from "@/modules/home/utils/date";

export type { HomePageData } from "@/modules/home/home-page-types";

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
  let annualLeave: FamilyReadModel["annualLeave"];
  const realtimeTopic = buildFamilyCalendarRealtimeTopic(auth.familyId);
  const monthRange = toMonthRangeInSeoul(currentYear, currentMonth);
  const yearRange = toYearDateRange(currentYear);
  const monthStartMs = new Date(monthRange.startInclusive).getTime();
  const monthEndMs = new Date(monthRange.endExclusive).getTime();
  const upcomingWindow = getUpcomingWindow(toSeoulDateKey(now));
  try {
    const [profile, members, monthEvents, monthOverrides, weekOverrides, yearOverrides] =
      await Promise.all([
        readAuthProfileFromSupabase(auth),
        listFamilyMembersFromSupabase(auth),
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
        }),
      ]);
    const selfMember = members.find((member) => member.userId === auth.userId);
    const leaveTargetUserId =
      selfMember?.working !== false
        ? auth.userId
        : members.find((member) => member.working)?.userId ?? auth.userId;
    const leaveMetadata = await readAnnualLeaveMetadataForHome(
      leaveTargetUserId,
      auth.accessToken,
    );
    displayName = profile.displayName ?? "나";
    routineEvents = pickRoutineEventsInWindow(monthEvents, monthStartMs, monthEndMs);
    upcomingEvents = buildUpcomingScheduleItems({
      events: monthEvents,
      overrides: weekOverrides,
      window: upcomingWindow,
    });
    overrides = monthOverrides;
    annualLeave = buildAnnualLeaveHomeData(
      leaveMetadata,
      yearOverrides,
      currentYear,
      leaveTargetUserId,
    );
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
