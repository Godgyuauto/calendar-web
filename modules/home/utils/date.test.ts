import { describe, expect, it } from "vitest";
import { toKoreanDateTime, toKoreanDateWithWeekday } from "@/modules/home/utils/date";

describe("home date formatting", () => {
  it("treats datetime-local values as Seoul time on the server", () => {
    expect(toKoreanDateTime("2026-05-04T09:00")).toBe("5. 4. 09:00");
  });

  it("keeps offset-aware timestamps in Seoul time", () => {
    expect(toKoreanDateTime("2026-05-04T09:00:00+09:00")).toBe("5. 4. 09:00");
  });

  it("formats all-day fallback dates with a weekday", () => {
    expect(toKoreanDateWithWeekday("2026-05-04T00:00:00+09:00")).toBe("5. 4. (월)");
  });
});
