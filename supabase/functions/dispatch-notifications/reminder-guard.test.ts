import { describe, expect, it } from "vitest";
import { remindersMatch } from "./reminder-guard";

describe("notification reminder guard", () => {
  it("matches Seoul datetime-local reminder with the same UTC database timestamp", () => {
    expect(remindersMatch("2026-05-14T18:40", "2026-05-14T09:40:00+00:00")).toBe(true);
  });

  it("does not match different reminder times", () => {
    expect(remindersMatch("2026-05-14T18:40", "2026-05-14T09:45:00+00:00")).toBe(false);
  });
});
