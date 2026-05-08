import { describe, expect, it } from "vitest";
import type { ShiftOverride } from "@/modules/shift";
import { getAnnualLeaveUsagesFromOverrides } from "@/modules/leave/annual-leave-usage";

function override(input: Partial<ShiftOverride>): ShiftOverride {
  return {
    id: input.id ?? "override-1",
    userId: "user-1",
    date: input.date ?? "2026-05-04",
    overrideType: input.overrideType ?? "vacation",
    overrideShift: input.overrideShift ?? "OFF",
    label: input.label ?? "휴가",
    startTime: input.startTime ?? null,
    endTime: input.endTime ?? null,
    note: input.note ?? null,
    createdAt: "2026-05-01T00:00:00+09:00",
  };
}

describe("getAnnualLeaveUsagesFromOverrides", () => {
  it("counts all-day vacation as one annual leave day", () => {
    const usages = getAnnualLeaveUsagesFromOverrides([override({})], 2026);

    expect(usages).toEqual([{ hours: 8 }]);
  });

  it("counts timed vacation by whole hours capped at one day", () => {
    const usages = getAnnualLeaveUsagesFromOverrides(
      [
        override({
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

    expect(usages).toEqual([{ hours: 5 }]);
  });

  it("ignores non-vacation overrides and other years", () => {
    const usages = getAnnualLeaveUsagesFromOverrides(
      [
        override({ overrideType: "sick" }),
        override({ date: "2025-12-31" }),
      ],
      2026,
    );

    expect(usages).toEqual([]);
  });
});
