import { describe, expect, it } from "vitest";
import { validateFamilyName } from "./family-name-validation";

describe("validateFamilyName", () => {
  it("trims a valid family name", () => {
    expect(validateFamilyName("  우리 가족  ")).toEqual({
      ok: true,
      familyName: "우리 가족",
    });
  });

  it("rejects blank names", () => {
    expect(validateFamilyName(" ")).toEqual({
      ok: false,
      message: "가족 이름을 입력해주세요.",
    });
  });

  it("rejects names over 40 characters", () => {
    expect(validateFamilyName("가".repeat(41))).toEqual({
      ok: false,
      message: "가족 이름은 40자 이내로 입력해주세요.",
    });
  });
});
