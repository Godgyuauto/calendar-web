import { describe, expect, it } from "vitest";
import { isKoreanPublicHoliday } from "@/modules/leave/korean-public-holidays";

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
});
