import { describe, expect, it } from "vitest";
import { buildMemberRows, type MemberAuthProfile } from "./members-page-row-builder";
import type { FamilyMemberReadModel } from "@/modules/family/api/members/family-members-settings-supabase";

const members: FamilyMemberReadModel[] = [
  {
    id: "self-row",
    userId: "self-user",
    role: "admin",
    createdAt: "2026-05-01T00:00:00Z",
    working: true,
  },
  {
    id: "wife-row",
    userId: "wife-user",
    role: "editor",
    createdAt: "2026-05-02T00:00:00Z",
    working: true,
  },
  {
    id: "orphan-row",
    userId: "orphan-user",
    role: "editor",
    createdAt: "2026-05-03T00:00:00Z",
    working: true,
  },
];

describe("buildMemberRows", () => {
  it("keeps current auth users and filters orphaned family member rows", () => {
    const profiles = new Map<string, MemberAuthProfile>([
      ["self-user", { userId: "self-user", email: "me@example.com", displayName: "민규" }],
      ["wife-user", { userId: "wife-user", email: "wife@example.com", displayName: "전윤정" }],
    ]);

    const rows = buildMemberRows({
      members,
      profiles,
      selfUserId: "self-user",
      selfDisplayName: "민규",
      todayKey: "2026-05-06",
      weekDateKeys: ["2026-05-03", "2026-05-04", "2026-05-05", "2026-05-06", "2026-05-07", "2026-05-08", "2026-05-09"],
      overrides: [],
    });

    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.name)).toEqual(["민규", "전윤정"]);
    expect(rows.map((row) => row.roleLabel)).toEqual(["가족마스터", "가족원"]);
  });

  it("falls back to the email prefix for a member without display name", () => {
    const profiles = new Map<string, MemberAuthProfile>([
      ["self-user", { userId: "self-user", email: "me@example.com", displayName: "민규" }],
      ["wife-user", { userId: "wife-user", email: "wife@example.com", displayName: null }],
    ]);

    const rows = buildMemberRows({
      members: members.slice(0, 2),
      profiles,
      selfUserId: "self-user",
      selfDisplayName: "민규",
      todayKey: "2026-05-06",
      weekDateKeys: ["2026-05-03", "2026-05-04", "2026-05-05", "2026-05-06", "2026-05-07", "2026-05-08", "2026-05-09"],
      overrides: [],
    });

    expect(rows[1]?.name).toBe("wife");
  });
});
