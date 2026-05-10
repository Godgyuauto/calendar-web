import { describe, expect, it } from "vitest";
import type { ShiftOverride } from "@/modules/shift";
import { buildMonthGridOverrideBadges } from "./month-grid-overrides";

function override(input: Partial<ShiftOverride> & Pick<ShiftOverride, "label">): ShiftOverride {
  return {
    date: "2026-05-04",
    overrideType: "custom",
    overrideShift: "OFF",
    ...input,
  };
}

describe("buildMonthGridOverrideBadges", () => {
  it("shows the latest override label and a count for additional day overrides", () => {
    const badges = buildMonthGridOverrideBadges({
      cellDate: "2026-05-04",
      primaryOverride: override({ label: "글램핑", createdAt: "2026-05-01T09:00:00.000Z" }),
      monthOverrides: [
        override({ label: "서윤이 소풍", createdAt: "2026-05-01T08:00:00.000Z" }),
        override({ label: "글램핑", createdAt: "2026-05-01T09:00:00.000Z" }),
      ],
    });

    expect(badges).toMatchObject({ label: "글램핑", additionalCount: 1 });
  });

  it("does not count overrides from other dates", () => {
    const badges = buildMonthGridOverrideBadges({
      cellDate: "2026-05-04",
      primaryOverride: override({ label: "글램핑" }),
      monthOverrides: [
        override({ label: "글램핑" }),
        override({ date: "2026-05-05", label: "다음날" }),
      ],
    });

    expect(badges).toMatchObject({ label: "글램핑", additionalCount: 0 });
  });

  it("uses subject member color for the badge", () => {
    const badges = buildMonthGridOverrideBadges({
      cellDate: "2026-05-04",
      primaryOverride: override({
        label: "윤정 일정",
        userId: "yunjung",
        note: JSON.stringify({
          schema: "calendar_override_v1",
          event_type: "custom",
          shift_change: "KEEP",
          all_day: true,
          title: "윤정 일정",
          memo: "",
          subject_type: "member",
          subject_user_id: "yunjung",
          leave_targets: [],
        }),
      }),
      monthOverrides: [override({ label: "윤정 일정", userId: "yunjung" })],
      subjectMembers: [
        { userId: "yunjung", name: "윤정", working: false, color: "#FF2D55", isSelf: false },
      ],
    });

    expect(badges?.color).toBe("#FF2D55");
  });
});
