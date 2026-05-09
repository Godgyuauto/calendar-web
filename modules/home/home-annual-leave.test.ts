import { describe, expect, it } from "vitest";
import type { ShiftOverride } from "@/modules/shift";
import { buildAnnualLeaveHomeData } from "@/modules/home/home-annual-leave";
import { ANNUAL_LEAVE_METADATA_KEYS } from "@/modules/leave/annual-leave-settings";

function vacation(input: Partial<ShiftOverride>): ShiftOverride {
  return {
    id: "override-1",
    userId: "user-1",
    date: input.date ?? "2026-05-04",
    overrideType: "vacation",
    overrideShift: "OFF",
    label: "휴가",
    startTime: input.startTime ?? null,
    endTime: input.endTime ?? null,
    note: input.note ?? null,
    createdAt: "2026-05-01T00:00:00+09:00",
  };
}

describe("buildAnnualLeaveHomeData", () => {
  it("subtracts previous usage and app vacation usage from annual leave", () => {
    const data = buildAnnualLeaveHomeData(
      {
        [ANNUAL_LEAVE_METADATA_KEYS.year]: 2026,
        [ANNUAL_LEAVE_METADATA_KEYS.totalHours]: 120,
        [ANNUAL_LEAVE_METADATA_KEYS.usedHoursBeforeApp]: 1,
      },
      [
        vacation({
          startTime: "2026-05-04T10:00",
          endTime: "2026-05-04T15:00",
          note: JSON.stringify({
            schema: "calendar_override_v1",
            event_type: "vacation",
            shift_change: "OFF",
            all_day: false,
            start_at: "2026-05-04T10:00",
            end_at: "2026-05-04T15:00",
          }),
        }),
      ],
      2026,
    );

    expect(data).toMatchObject({
      totalDays: 15,
      usedHours: 6,
      remainingLabel: "14개 2시간",
    });
  });

  it("does not subtract 2026 vacation overrides before May", () => {
    const data = buildAnnualLeaveHomeData(
      {
        [ANNUAL_LEAVE_METADATA_KEYS.year]: 2026,
        [ANNUAL_LEAVE_METADATA_KEYS.totalHours]: 120,
        [ANNUAL_LEAVE_METADATA_KEYS.usedHoursBeforeApp]: 0,
      },
      [
        vacation({ date: "2026-04-30" }),
        vacation({ date: "2026-05-04" }),
      ],
      2026,
    );

    expect(data).toMatchObject({
      usedHours: 8,
      remainingLabel: "14개",
    });
  });

  it("returns null before annual leave is configured", () => {
    expect(buildAnnualLeaveHomeData({}, [], 2026)).toBeNull();
  });
});
