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

    expect(badges).toEqual({ label: "글램핑", additionalCount: 1 });
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

    expect(badges).toEqual({ label: "글램핑", additionalCount: 0 });
  });
});
