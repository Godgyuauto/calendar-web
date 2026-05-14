import { describe, expect, it } from "vitest";
import type { ShiftOverride } from "@/modules/shift";
import { buildTelegramOverrideMutationText } from "./telegram-registration-dispatch";

describe("telegram registration notification", () => {
  it("builds a registration message with reminder details", () => {
    const override: ShiftOverride = {
      id: "override-1",
      date: "2026-05-29",
      overrideType: "custom",
      overrideShift: null,
      label: "회식",
      startTime: "2026-05-29T18:00:00+09:00",
      endTime: "2026-05-29T20:00:00+09:00",
      note: JSON.stringify({
        schema: "calendar_override_v1",
        event_type: "custom",
        shift_change: "KEEP",
        all_day: false,
        start_at: "2026-05-29T18:00",
        end_at: "2026-05-29T20:00",
        remind_at: "2026-05-29T17:30",
        title: "팀 회식",
        memo: "",
      }),
    };

    const text = buildTelegramOverrideMutationText(override, {
      mode: "create",
      subjectLabel: "민규",
      actorLabel: "윤정",
    });

    expect(text).toContain("일정 등록됨");
    expect(text).toContain("주체: 민규");
    expect(text).toContain("추가자: 윤정");
    expect(text).toContain("제목: 팀 회식");
    expect(text).toContain("일정 유형: 커스텀");
    expect(text).toContain("근무조 변경: 유지");
    expect(text).toContain("대상 날짜: 2026-05-29");
    expect(text).toContain("시간:");
    expect(text).toContain("알림:");
    expect(text).toContain("Asia/Seoul");
  });

  it("marks all-day schedules without a reminder", () => {
    const override: ShiftOverride = {
      date: "2026-05-29",
      overrideType: "business",
      overrideShift: null,
      label: "출장",
      note: JSON.stringify({
        schema: "calendar_override_v1",
        event_type: "business",
        shift_change: "KEEP",
        all_day: true,
        start_at: null,
        end_at: null,
        remind_at: null,
        title: "외근",
      }),
    };

    const text = buildTelegramOverrideMutationText(override, {
      mode: "create",
      subjectLabel: "우리",
      actorLabel: "민규",
    });

    expect(text).toContain("주체: 우리");
    expect(text).toContain("추가자: 민규");
    expect(text).toContain("제목: 외근");
    expect(text).toContain("시간: 종일");
    expect(text).toContain("알림: 없음");
  });

  it("builds an update message with modifier details", () => {
    const override: ShiftOverride = {
      id: "override-1",
      date: "2026-05-29",
      overrideType: "custom",
      overrideShift: null,
      label: "회식",
      note: JSON.stringify({
        schema: "calendar_override_v1",
        event_type: "custom",
        shift_change: "KEEP",
        all_day: true,
        remind_at: null,
        title: "팀 회식 수정",
      }),
    };

    const text = buildTelegramOverrideMutationText(override, {
      mode: "update",
      subjectLabel: "민규",
      actorLabel: "윤정",
    });

    expect(text).toContain("일정 수정됨");
    expect(text).toContain("주체: 민규");
    expect(text).toContain("수정자: 윤정");
    expect(text).toContain("제목: 팀 회식 수정");
  });
});
