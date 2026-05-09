import { describe, expect, it } from "vitest";
import {
  getKoreanPublicHoliday,
  isKoreanPublicHoliday,
} from "@/modules/leave/korean-public-holidays";

describe("isKoreanPublicHoliday", () => {
  it("recognizes 2026 official and substitute public holidays", () => {
    expect(isKoreanPublicHoliday("2026-05-01")).toBe(true);
    expect(isKoreanPublicHoliday("2026-05-05")).toBe(true);
    expect(isKoreanPublicHoliday("2026-05-25")).toBe(true);
    expect(isKoreanPublicHoliday("2026-07-17")).toBe(true);
    expect(isKoreanPublicHoliday("2026-10-05")).toBe(true);
  });

  it("does not treat ordinary weekends as public holidays", () => {
    expect(isKoreanPublicHoliday("2026-05-02")).toBe(false);
    expect(isKoreanPublicHoliday("2026-05-03")).toBe(false);
  });

  it("returns the official public holiday display name", () => {
    expect(getKoreanPublicHoliday("2026-05-05")).toEqual({ name: "어린이날" });
    expect(getKoreanPublicHoliday("2026-05-25")).toEqual({
      name: "부처님오신날 대체공휴일",
    });
    expect(getKoreanPublicHoliday("2026-05-02")).toBeNull();
  });
});
