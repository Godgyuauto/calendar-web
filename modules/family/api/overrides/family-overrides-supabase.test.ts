import { describe, expect, it } from "vitest";
import type { FamilyAuthContext } from "../_common/auth-context";
import {
  buildShiftOverrideInsertPayload,
  buildShiftOverrideMutationQuery,
} from "./family-overrides-supabase-payload";

const auth: FamilyAuthContext = {
  familyId: "family-1",
  userId: "author-1",
  accessToken: "token",
};

describe("family shift override supabase payloads", () => {
  it("records the current user as creator while targeting a selected member", () => {
    const payload = buildShiftOverrideInsertPayload(auth, {
      userId: "target-1",
      date: "2026-05-09",
      overrideType: "vacation",
      overrideShift: "OFF",
      label: "연차",
      startTime: "2026-05-09T00:00:00.000Z",
      endTime: "2026-05-09T08:00:00.000Z",
      note: "memo",
    });

    expect(payload).toMatchObject({
      family_id: "family-1",
      user_id: "target-1",
      created_by: "author-1",
      date: "2026-05-09",
      override_type: "vacation",
      override_shift: "OFF",
      label: "연차",
    });
  });

  it("defaults the target member to the creator for legacy personal schedules", () => {
    const payload = buildShiftOverrideInsertPayload(auth, {
      date: "2026-05-09",
      overrideType: "custom",
      overrideShift: null,
      label: "개인 일정",
    });

    expect(payload.user_id).toBe("author-1");
    expect(payload.created_by).toBe("author-1");
  });

  it("does not constrain family mutation queries to the creator user_id", () => {
    const query = buildShiftOverrideMutationQuery(auth, "override-1", {
      select: "id",
    });

    expect(query.get("id")).toBe("eq.override-1");
    expect(query.get("family_id")).toBe("eq.family-1");
    expect(query.get("select")).toBe("id");
    expect(query.has("user_id")).toBe(false);
  });
});
