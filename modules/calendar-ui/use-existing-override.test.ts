import { describe, expect, it } from "vitest";
import type { ExistingOverride } from "./use-existing-override";
import { pickExistingOverride } from "./use-existing-override";

function override(input: Partial<ExistingOverride>): ExistingOverride {
  return {
    id: "override-1",
    date: "2026-05-04",
    overrideType: "custom",
    overrideShift: "OFF",
    label: "일정",
    ...input,
  };
}

describe("pickExistingOverride", () => {
  it("selects the exact override id when provided", () => {
    const selected = pickExistingOverride(
      [
        override({ id: "older", createdAt: "2026-05-04T09:00:00+09:00" }),
        override({ id: "newer", createdAt: "2026-05-04T10:00:00+09:00" }),
      ],
      "2026-05-04",
      "older",
    );

    expect(selected?.id).toBe("older");
  });

  it("does not fall back to another override when the selected id is stale", () => {
    const selected = pickExistingOverride(
      [override({ id: "newer", createdAt: "2026-05-04T10:00:00+09:00" })],
      "2026-05-04",
      "deleted",
    );

    expect(selected).toBeNull();
  });

  it("keeps latest-created fallback for date-only opens", () => {
    const selected = pickExistingOverride(
      [
        override({ id: "older", createdAt: "2026-05-04T09:00:00+09:00" }),
        override({ id: "newer", createdAt: "2026-05-04T10:00:00+09:00" }),
      ],
      "2026-05-04",
    );

    expect(selected?.id).toBe("newer");
  });
});
