import { describe, expect, it } from "vitest";
import { isSystemMemberProfile } from "./member-visibility";

describe("isSystemMemberProfile", () => {
  it("identifies verification and automation accounts", () => {
    expect(
      isSystemMemberProfile({
        email: "codex.verify.release@example.com",
        displayName: null,
      }),
    ).toBe(true);
    expect(
      isSystemMemberProfile({
        email: null,
        displayName: "push.sender.20260425",
      }),
    ).toBe(true);
  });

  it("keeps real user profiles visible", () => {
    expect(
      isSystemMemberProfile({
        email: "dbswjd8930@naver.com",
        displayName: "전윤정",
      }),
    ).toBe(false);
  });
});
