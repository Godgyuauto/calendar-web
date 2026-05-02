import { describe, expect, it } from "vitest";
import type { ShiftOverride } from "@/modules/shift";
import { buildDayAgendaItems, formatDayAgendaTime } from "./day-agenda-items";

function override(input: Partial<ShiftOverride>): ShiftOverride {
  return {
    id: "override-1",
    date: "2026-05-04",
    overrideType: "custom",
    overrideShift: "OFF",
    label: "일정",
    ...input,
  };
}

describe("formatDayAgendaTime", () => {
  it("formats all-day items", () => {
    expect(formatDayAgendaTime(null, null, true)).toBe("종일");
  });

  it("formats same-day ranges with time only", () => {
    expect(
      formatDayAgendaTime("2026-05-04T09:00", "2026-05-04T15:00", false),
    ).toBe("09:00 - 15:00");
  });

  it("keeps date context for overnight ranges", () => {
    expect(
      formatDayAgendaTime("2026-05-04T23:00", "2026-05-05T03:00", false),
    ).toBe("5.4 23:00 - 5.5 03:00");
  });
});

describe("buildDayAgendaItems", () => {
  it("filters by selected day and sorts timed items", () => {
    const items = buildDayAgendaItems("2026-05-04", [
      override({
        id: "late",
        label: "저녁",
        startTime: "2026-05-04T18:00:00+09:00",
        endTime: "2026-05-04T19:00:00+09:00",
      }),
      override({
        id: "other-day",
        date: "2026-05-05",
        label: "다른 날",
      }),
      override({
        id: "early",
        label: "아침",
        startTime: "2026-05-04T09:00:00+09:00",
        endTime: "2026-05-04T10:00:00+09:00",
      }),
    ]);

    expect(items.map((item) => item.id)).toEqual(["early", "late"]);
    expect(items.map((item) => item.timeLabel)).toEqual([
      "09:00 - 10:00",
      "18:00 - 19:00",
    ]);
  });

  it("uses structured note title and memo when present", () => {
    const items = buildDayAgendaItems("2026-05-04", [
      override({
        label: "fallback",
        note: JSON.stringify({
          schema: "calendar_override_v1",
          event_type: "vacation",
          shift_change: "OFF",
          all_day: false,
          start_at: "2026-05-04T09:00",
          end_at: "2026-05-04T15:00",
          title: "서윤이 소풍",
          memo: "세종 베어트리파크",
        }),
      }),
    ]);

    expect(items[0]).toMatchObject({
      actionLabel: "상세/관리",
      title: "서윤이 소풍",
      typeLabel: "휴가",
      shiftLabel: "근무조 OFF",
      memo: "세종 베어트리파크",
      timeLabel: "09:00 - 15:00",
    });
  });
});
