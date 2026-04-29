import { describe, expect, it } from "vitest";
import {
  toOverrideSubmitPayload,
  toStructuredOverrideFormState,
} from "@/modules/calendar-ui/structured-override-form";

describe("structured override form mapping", () => {
  it("uses the selected date as the default start and end date", () => {
    const form = toStructuredOverrideFormState({ dateKey: "2026-04-29" });

    expect(form.startDate).toBe("2026-04-29");
    expect(form.endDate).toBe("2026-04-29");
    expect(form.startAt).toBe("");
    expect(form.endAt).toBe("");
  });

  it("hydrates an overnight range into separate date and time inputs", () => {
    const form = toStructuredOverrideFormState({
      dateKey: "2026-04-29",
      override: {
        date: "2026-04-29",
        overrideType: "business",
        overrideShift: null,
        label: "출장",
        note: JSON.stringify({
          schema: "calendar_override_v1",
          event_type: "business",
          shift_change: "KEEP",
          all_day: false,
          start_at: "2026-04-29T22:30",
          end_at: "2026-04-30T03:10",
          remind_at: null,
          title: "야간 출장",
          memo: "",
        }),
      },
    });

    expect(form.startDate).toBe("2026-04-29");
    expect(form.startAt).toBe("22:30");
    expect(form.endDate).toBe("2026-04-30");
    expect(form.endAt).toBe("03:10");
  });

  it("submits a range that can end on the next day", () => {
    const payload = toOverrideSubmitPayload("2026-04-29", {
      eventType: "extra",
      shiftChange: "KEEP",
      startDate: "2026-04-29",
      endDate: "2026-04-30",
      startAt: "22:30",
      endAt: "03:10",
      remindAt: "",
      title: "야간 지원",
      memo: "다음날 종료",
    });
    const note = JSON.parse(payload.note) as {
      start_at: string;
      end_at: string;
      all_day: boolean;
    };

    expect(payload.startTime).toBe("2026-04-29T22:30");
    expect(payload.endTime).toBe("2026-04-30T03:10");
    expect(note.start_at).toBe("2026-04-29T22:30");
    expect(note.end_at).toBe("2026-04-30T03:10");
    expect(note.all_day).toBe(false);
  });

  it("stores a custom event title as both label and structured title", () => {
    const payload = toOverrideSubmitPayload("2026-04-30", {
      eventType: "custom",
      shiftChange: "KEEP",
      startDate: "2026-04-30",
      endDate: "2026-04-30",
      startAt: "",
      endAt: "",
      remindAt: "",
      title: "회식",
      memo: "제조랑 회식",
    });
    const note = JSON.parse(payload.note) as {
      event_type: string;
      title: string;
      memo: string;
    };

    expect(payload.overrideType).toBe("custom");
    expect(payload.label).toBe("회식");
    expect(note.event_type).toBe("custom");
    expect(note.title).toBe("회식");
    expect(note.memo).toBe("제조랑 회식");
  });
});
