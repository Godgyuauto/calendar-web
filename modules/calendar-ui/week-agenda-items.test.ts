import { describe, expect, it } from "vitest";
import type { CalendarCell } from "@/modules/calendar";
import type { ShiftOverride } from "@/modules/shift";
import { buildWeekAgendaDays, getWeekDateKeys, offsetWeek } from "./week-agenda-items";

function cell(input: Partial<CalendarCell> & Pick<CalendarCell, "date">): CalendarCell {
  return {
    day: Number(input.date.slice(8, 10)),
    weekday: 0,
    isCurrentMonth: true,
    ...input,
  };
}

function override(input: Partial<ShiftOverride>): ShiftOverride {
  return {
    id: "override-1",
    date: "2026-05-04",
    overrideType: "custom",
    overrideShift: "OFF",
    label: "회식",
    ...input,
  };
}

describe("week agenda items", () => {
  it("builds a Sunday-start week around the selected date", () => {
    expect(getWeekDateKeys("2026-05-04")).toEqual([
      "2026-05-03",
      "2026-05-04",
      "2026-05-05",
      "2026-05-06",
      "2026-05-07",
      "2026-05-08",
      "2026-05-09",
    ]);
  });

  it("offsets by whole weeks", () => {
    expect(offsetWeek("2026-05-04", 1)).toBe("2026-05-11");
    expect(offsetWeek("2026-05-04", -1)).toBe("2026-04-27");
  });

  it("attaches shifts and day items", () => {
    const days = buildWeekAgendaDays({
      dateKey: "2026-05-04",
      todayKey: "2026-05-04",
      calendarCells: [
        cell({
          date: "2026-05-04",
          shift: { date: "2026-05-04", baseShift: "B", finalShift: "OFF" },
        }),
      ],
      overrides: [override({ startTime: "2026-05-04T09:00", endTime: "2026-05-04T10:00" })],
    });

    expect(days[1]).toMatchObject({
      dateKey: "2026-05-04",
      weekdayLabel: "월",
      isToday: true,
      shift: { finalShift: "OFF" },
    });
    expect(days[1].items[0]).toMatchObject({ title: "회식", timeLabel: "09:00 - 10:00" });
  });
});
