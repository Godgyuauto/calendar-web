import { describe, expect, it } from "vitest";
import {
  getFormValidationError,
  getTimeRangeError,
} from "@/modules/calendar-ui/add-event-sheet-utils";
import type { StructuredOverrideFormState } from "@/modules/calendar-ui/structured-override";

function form(overrides: Partial<StructuredOverrideFormState>): StructuredOverrideFormState {
  return {
    eventType: "vacation",
    shiftChange: "KEEP",
    startDate: "2026-04-29",
    endDate: "2026-04-29",
    startAt: "",
    endAt: "",
    remindAt: "",
    title: "",
    memo: "",
    ...overrides,
  };
}

describe("getTimeRangeError", () => {
  it("allows an empty optional time range", () => {
    expect(getTimeRangeError(form({}))).toBeNull();
  });

  it("requires start and end time together", () => {
    expect(getTimeRangeError(form({ startAt: "22:30" }))).toBe(
      "시작/종료 시간을 함께 입력해주세요.",
    );
  });

  it("rejects a same-day range whose end is not after start", () => {
    expect(getTimeRangeError(form({ startAt: "22:30", endAt: "03:10" }))).toBe(
      "시작/종료 시간을 확인해주세요.",
    );
  });

  it("allows an overnight range that ends on the next day", () => {
    expect(
      getTimeRangeError(
        form({
          startAt: "22:30",
          endDate: "2026-04-30",
          endAt: "03:10",
        }),
      ),
    ).toBeNull();
  });
});

describe("getFormValidationError", () => {
  it("requires a title when the event type is custom", () => {
    expect(getFormValidationError(form({ eventType: "custom" }))).toBe(
      "일정 제목을 입력해주세요.",
    );
  });

  it("allows a custom event when a title is provided", () => {
    expect(getFormValidationError(form({ eventType: "custom", title: "회식" }))).toBeNull();
  });
});
