import { describe, expect, it } from "vitest";
import {
  toOverrideSubmitPayload,
  toStructuredOverrideFormState,
} from "@/modules/calendar-ui/structured-override-form";

describe("structured override form mapping", () => {
  it("uses the selected date as the default start and end date", () => {
    const form = toStructuredOverrideFormState({ dateKey: "2026-04-29" });

    expect(form.eventType).toBe("custom");
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

    expect(payload.startTime).toBe("2026-04-29T22:30:00+09:00");
    expect(payload.endTime).toBe("2026-04-30T03:10:00+09:00");
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

  it("stores a member subject as structured metadata and target user", () => {
    const payload = toOverrideSubmitPayload("2026-05-09", {
      eventType: "custom",
      shiftChange: "KEEP",
      subjectType: "member",
      subjectUserId: "member-1",
      startDate: "2026-05-09",
      endDate: "2026-05-09",
      startAt: "",
      endAt: "",
      remindAt: "",
      title: "개인 일정",
      memo: "",
    });
    const note = JSON.parse(payload.note) as {
      subject_type: string;
      subject_user_id: string;
    };

    expect(payload.userId).toBe("member-1");
    expect(note.subject_type).toBe("member");
    expect(note.subject_user_id).toBe("member-1");
  });

  it("hydrates a shared subject from structured metadata", () => {
    const form = toStructuredOverrideFormState({
      dateKey: "2026-05-09",
      override: {
        date: "2026-05-09",
        overrideType: "custom",
        overrideShift: null,
        label: "가족 일정",
        userId: "member-1",
        note: JSON.stringify({
          schema: "calendar_override_v1",
          event_type: "custom",
          shift_change: "KEEP",
          all_day: true,
          start_at: null,
          end_at: null,
          remind_at: null,
          title: "가족 일정",
          memo: "",
          subject_type: "shared",
          subject_user_id: null,
          leave_targets: [],
        }),
      },
    });

    expect(form.subjectType).toBe("shared");
    expect(form.subjectUserId).toBeNull();
  });

  it("stores default annual leave as eight deductible hours", () => {
    const payload = toOverrideSubmitPayload("2026-05-09", {
      eventType: "vacation",
      shiftChange: "OFF",
      subjectType: "member",
      subjectUserId: "member-1",
      startDate: "2026-05-09",
      endDate: "2026-05-09",
      startAt: "",
      endAt: "",
      remindAt: "",
      title: "",
      memo: "",
      leaveDeductionHours: 8,
      leaveDeductionLabel: "연차",
      leaveExemptFromDeduction: false,
    });
    const note = JSON.parse(payload.note) as {
      leave_deduction_hours: number;
      leave_deduction_label: string;
      leave_targets: unknown[];
    };

    expect(note.leave_deduction_hours).toBe(8);
    expect(note.leave_deduction_label).toBe("연차");
    expect(note.leave_targets).toEqual([
      {
        user_id: "member-1",
        deduction_hours: 8,
        deduction_label: "연차",
        exempt_from_deduction: false,
      },
    ]);
  });

  it("stores shared vacation leave targets per selected worker", () => {
    const payload = toOverrideSubmitPayload("2026-05-09", {
      eventType: "vacation",
      shiftChange: "OFF",
      subjectType: "shared",
      subjectUserId: null,
      startDate: "2026-05-09",
      endDate: "2026-05-09",
      startAt: "",
      endAt: "",
      remindAt: "",
      title: "가족 휴가",
      memo: "",
      leaveTargets: [
        {
          user_id: "worker-1",
          deduction_hours: 4,
          deduction_label: "반차",
          exempt_from_deduction: false,
        },
      ],
    });
    const note = JSON.parse(payload.note) as {
      subject_type: string;
      subject_user_id: string | null;
      leave_targets: unknown[];
    };

    expect(payload.userId).toBeUndefined();
    expect(note.subject_type).toBe("shared");
    expect(note.subject_user_id).toBeNull();
    expect(note.leave_targets).toEqual([
      {
        user_id: "worker-1",
        deduction_hours: 4,
        deduction_label: "반차",
        exempt_from_deduction: false,
      },
    ]);
  });

  it("uses the earliest same-day vacation as the default annual leave deduction", () => {
    const form = toStructuredOverrideFormState({
      dateKey: "2026-05-09",
      sameDayOverrides: [
        {
          date: "2026-05-09",
          overrideType: "vacation",
          overrideShift: "OFF",
          label: "저녁 일정",
          startTime: "2026-05-09T18:00:00+09:00",
          endTime: "2026-05-09T22:00:00+09:00",
          note: JSON.stringify({
            schema: "calendar_override_v1",
            event_type: "vacation",
            shift_change: "OFF",
            all_day: false,
            start_at: "2026-05-09T18:00",
            end_at: "2026-05-09T22:00",
            leave_deduction_hours: 4,
            leave_deduction_label: "반차",
          }),
        },
        {
          date: "2026-05-09",
          overrideType: "vacation",
          overrideShift: "OFF",
          label: "오전 일정",
          startTime: "2026-05-09T09:00:00+09:00",
          endTime: "2026-05-09T17:00:00+09:00",
          note: JSON.stringify({
            schema: "calendar_override_v1",
            event_type: "vacation",
            shift_change: "OFF",
            all_day: false,
            start_at: "2026-05-09T09:00",
            end_at: "2026-05-09T17:00",
            leave_deduction_hours: 2,
            leave_deduction_label: "시간 연차",
          }),
        },
      ],
    });

    expect(form.eventType).toBe("custom");
    expect(form.leaveDeductionHours).toBe(2);
    expect(form.leaveDeductionLabel).toBe("시간 연차");
  });

  it("normalizes four hourly leave hours to half-day leave", () => {
    const payload = toOverrideSubmitPayload("2026-05-09", {
      eventType: "vacation",
      shiftChange: "OFF",
      startDate: "2026-05-09",
      endDate: "2026-05-09",
      startAt: "12:30",
      endAt: "17:00",
      remindAt: "",
      title: "",
      memo: "",
      leaveDeductionHours: 4,
      leaveDeductionLabel: "시간 연차",
      leaveExemptFromDeduction: false,
    });
    const note = JSON.parse(payload.note) as {
      leave_deduction_hours: number;
      leave_deduction_label: string;
    };

    expect(note.leave_deduction_hours).toBe(4);
    expect(note.leave_deduction_label).toBe("반차");
  });
});
