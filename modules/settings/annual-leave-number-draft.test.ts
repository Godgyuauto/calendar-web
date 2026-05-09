import { describe, expect, it } from "vitest";
import {
  numberToDraft,
  parseIntegerDraft,
  sanitizeIntegerDraft,
} from "@/modules/settings/annual-leave-number-draft";

describe("annual leave number drafts", () => {
  it("keeps an empty draft so zero can be cleared in the UI", () => {
    expect(sanitizeIntegerDraft("")).toBe("");
    expect(parseIntegerDraft("")).toBeNull();
  });

  it("keeps numeric drafts and parses them on save", () => {
    expect(sanitizeIntegerDraft("14")).toBe("14");
    expect(parseIntegerDraft("14")).toBe(14);
    expect(numberToDraft(0)).toBe("0");
  });
});
