import { describe, expect, it } from "vitest";
import type { FamilyEvent } from "@/modules/family";
import type { ShiftOverride } from "@/modules/shift";
import {
  buildUpcomingScheduleItems,
  getUpcomingWindow,
} from "@/modules/home/upcoming-schedule";

function event(overrides: Partial<FamilyEvent>): FamilyEvent {
  return {
    id: "event-1",
    familyId: "family-1",
    title: "가족 일정",
    startTime: "2026-04-30T10:00:00+09:00",
    endTime: "2026-04-30T11:00:00+09:00",
    isRoutine: false,
    createdBy: "user-1",
    createdAt: "2026-04-29T00:00:00+09:00",
    ...overrides,
  };
}

function override(overrides: Partial<ShiftOverride>): ShiftOverride {
  return {
    id: "override-1",
    userId: "user-1",
    date: "2026-04-30",
    overrideType: "custom",
    overrideShift: null,
    label: "회식",
    startTime: null,
    endTime: null,
    note: null,
    createdAt: "2026-04-29T00:00:00+09:00",
    ...overrides,
  };
}

describe("getUpcomingWindow", () => {
  it("uses today inclusive and seven days exclusive across month boundaries", () => {
    expect(getUpcomingWindow("2026-04-29")).toEqual({
      startDateKey: "2026-04-29",
      endDateKey: "2026-05-06",
      startIso: "2026-04-29T00:00:00+09:00",
      endIso: "2026-05-06T00:00:00+09:00",
    });
  });
});

describe("buildUpcomingScheduleItems", () => {
  const window = getUpcomingWindow("2026-04-29");

  it("combines family events and calendar overrides for the next week", () => {
    const items = buildUpcomingScheduleItems({
      window,
      events: [event({ id: "event-1", title: "교육" })],
      overrides: [override({ id: "override-1", label: "회식" })],
    });

    expect(items.map((item) => item.title)).toEqual(["회식", "교육"]);
  });

  it("excludes routine events and items outside the seven-day window", () => {
    const items = buildUpcomingScheduleItems({
      window,
      events: [
        event({ id: "routine", isRoutine: true }),
        event({ id: "late", startTime: "2026-05-06T09:00:00+09:00" }),
      ],
      overrides: [
        override({ id: "today", date: "2026-04-29" }),
        override({ id: "late", date: "2026-05-06" }),
      ],
    });

    expect(items.map((item) => item.id)).toEqual(["override:today"]);
  });

  it("keeps timed overrides ordered by their actual start time", () => {
    const items = buildUpcomingScheduleItems({
      window,
      events: [event({ id: "event-1", startTime: "2026-04-30T20:00:00+09:00" })],
      overrides: [
        override({
          id: "timed",
          label: "저녁",
          startTime: "2026-04-30T18:00",
          endTime: "2026-04-30T19:00",
        }),
      ],
    });

    expect(items.map((item) => item.title)).toEqual(["저녁", "가족 일정"]);
  });
});
