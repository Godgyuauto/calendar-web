import { describe, expect, it } from "vitest";
import type { ShiftOverride } from "@/modules/shift";
import {
  getAnnualLeaveUsageDetailsFromOverrides,
  getAnnualLeaveUsagesFromOverrides,
} from "@/modules/leave/annual-leave-usage";

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
    createdAt: input.createdAt ?? "2026-05-01T00:00:00+09:00",
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

  it("uses explicit annual leave deduction hours before time range", () => {
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
            leave_deduction_hours: 4,
            leave_deduction_label: "반차",
          }),
        }),
      ],
      2026,
    );

    expect(usages).toEqual([{ hours: 4 }]);
  });

  it("deducts annual leave once per date using the earliest vacation event", () => {
    const usages = getAnnualLeaveUsagesFromOverrides(
      [
        override({
          id: "late-half-day",
          startTime: "2026-05-09T18:00:00+09:00",
          endTime: "2026-05-09T22:00:00+09:00",
          note: JSON.stringify({
            schema: "calendar_override_v1",
            event_type: "vacation",
            shift_change: "OFF",
            all_day: false,
            start_at: "2026-05-09T18:00",
            end_at: "2026-05-09T22:00",
            leave_deduction_hours: 4,
            leave_deduction_label: "반차",
          }),
        }),
        override({
          id: "early-full-day",
          startTime: "2026-05-09T09:00:00+09:00",
          endTime: "2026-05-09T17:00:00+09:00",
          note: JSON.stringify({
            schema: "calendar_override_v1",
            event_type: "vacation",
            shift_change: "OFF",
            all_day: false,
            start_at: "2026-05-09T09:00",
            end_at: "2026-05-09T17:00",
            leave_deduction_hours: 8,
            leave_deduction_label: "연차",
          }),
        }),
      ],
      2026,
    );

    expect(usages).toEqual([{ hours: 8 }]);
  });

  it("uses the next earliest vacation event when the earliest one is absent", () => {
    const usages = getAnnualLeaveUsagesFromOverrides(
      [
        override({
          id: "late-half-day",
          startTime: "2026-05-09T18:00:00+09:00",
          endTime: "2026-05-09T22:00:00+09:00",
          note: JSON.stringify({
            schema: "calendar_override_v1",
            event_type: "vacation",
            shift_change: "OFF",
            all_day: false,
            start_at: "2026-05-09T18:00",
            end_at: "2026-05-09T22:00",
            leave_deduction_hours: 4,
            leave_deduction_label: "반차",
          }),
        }),
      ],
      2026,
    );

    expect(usages).toEqual([{ hours: 4 }]);
  });

  it("does not deduct annual leave on Korean public holidays", () => {
    const usages = getAnnualLeaveUsagesFromOverrides(
      [
        override({
          date: "2026-05-05",
          note: JSON.stringify({
            schema: "calendar_override_v1",
            event_type: "vacation",
            shift_change: "OFF",
            all_day: true,
            leave_deduction_hours: 8,
            leave_deduction_label: "연차",
          }),
        }),
      ],
      2026,
    );

    expect(usages).toEqual([{ hours: 0 }]);
  });

  it("does not deduct annual leave when marked as a company holiday", () => {
    const usages = getAnnualLeaveUsagesFromOverrides(
      [
        override({
          date: "2026-05-08",
          note: JSON.stringify({
            schema: "calendar_override_v1",
            event_type: "vacation",
            shift_change: "OFF",
            all_day: true,
            leave_deduction_hours: 8,
            leave_deduction_label: "연차",
            leave_exempt_from_deduction: true,
          }),
        }),
      ],
      2026,
    );

    expect(usages).toEqual([{ hours: 0 }]);
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

  it("deducts shared annual leave only for the requested worker target", () => {
    const details = getAnnualLeaveUsageDetailsFromOverrides(
      [
        override({
          userId: "creator-user",
          note: JSON.stringify({
            schema: "calendar_override_v1",
            event_type: "vacation",
            shift_change: "OFF",
            subject_type: "shared",
            leave_targets: [
              {
                user_id: "worker-1",
                deduction_hours: 8,
                deduction_label: "연차",
                exempt_from_deduction: false,
              },
            ],
          }),
        }),
      ],
      2026,
      { targetUserId: "worker-1" },
    );

    expect(details).toEqual([
      {
        date: "2026-05-04",
        hours: 8,
        deductionLabel: "연차",
        exemptReason: null,
      },
    ]);
  });

  it("ignores annual leave targets for other workers", () => {
    const usages = getAnnualLeaveUsagesFromOverrides(
      [
        override({
          userId: "creator-user",
          note: JSON.stringify({
            schema: "calendar_override_v1",
            event_type: "vacation",
            shift_change: "OFF",
            subject_type: "shared",
            leave_targets: [
              {
                user_id: "worker-1",
                deduction_hours: 8,
                deduction_label: "연차",
                exempt_from_deduction: false,
              },
            ],
          }),
        }),
      ],
      2026,
      { targetUserId: "worker-2" },
    );

    expect(usages).toEqual([]);
  });

  it("deducts once per date independently for each worker target", () => {
    const overrides = [
      override({
        id: "shared-late",
        startTime: "2026-05-04T18:00:00+09:00",
        note: JSON.stringify({
          schema: "calendar_override_v1",
          event_type: "vacation",
          shift_change: "OFF",
          subject_type: "shared",
          leave_targets: [
            {
              user_id: "worker-1",
              deduction_hours: 4,
              deduction_label: "반차",
              exempt_from_deduction: false,
            },
            {
              user_id: "worker-2",
              deduction_hours: 8,
              deduction_label: "연차",
              exempt_from_deduction: false,
            },
          ],
        }),
      }),
      override({
        id: "shared-early",
        startTime: "2026-05-04T09:00:00+09:00",
        note: JSON.stringify({
          schema: "calendar_override_v1",
          event_type: "vacation",
          shift_change: "OFF",
          subject_type: "shared",
          leave_targets: [
            {
              user_id: "worker-1",
              deduction_hours: 2,
              deduction_label: "시간 연차",
              exempt_from_deduction: false,
            },
          ],
        }),
      }),
    ];

    expect(getAnnualLeaveUsagesFromOverrides(overrides, 2026, { targetUserId: "worker-1" }))
      .toEqual([{ hours: 2 }]);
    expect(getAnnualLeaveUsagesFromOverrides(overrides, 2026, { targetUserId: "worker-2" }))
      .toEqual([{ hours: 8 }]);
  });
});
