import { describe, expect, it } from "vitest";
import { validateProfileUpdateForm } from "./profile-update-validation";

describe("validateProfileUpdateForm", () => {
  it("accepts a trimmed display name", () => {
    const result = validateProfileUpdateForm({ displayName: "  윤정  " });

    expect(result).toEqual({ ok: true, data: { displayName: "윤정" } });
  });

  it("rejects an empty display name", () => {
    const result = validateProfileUpdateForm({ displayName: "   " });

    expect(result).toEqual({
      ok: false,
      message: "이름을 입력해주세요.",
    });
  });
});
