import { describe, expect, it } from "vitest";
import { parseDisplayName } from "./auth-profile-metadata";

describe("parseDisplayName", () => {
  it("reads Supabase signup display_name metadata", () => {
    expect(parseDisplayName({ display_name: "전윤정" })).toBe("전윤정");
  });

  it("falls back to name metadata", () => {
    expect(parseDisplayName({ name: "민규" })).toBe("민규");
  });
});
