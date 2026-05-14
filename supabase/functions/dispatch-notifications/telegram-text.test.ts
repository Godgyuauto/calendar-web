import { describe, expect, it } from "vitest";
import { buildTelegramTextForNotificationJob } from "./telegram-text";

describe("dispatch notification telegram text", () => {
  it("renders subject and creator when structured body has new labels", () => {
    const text = buildTelegramTextForNotificationJob({
      title: "일정 알림 · 민규 엄지발톱 케어",
      body: JSON.stringify({
        schema: "override_notification_v1",
        date: "2026-06-04",
        title: "민규 엄지발톱 케어",
        event_type: "custom",
        event_type_label: "커스텀",
        shift_change: "KEEP",
        shift_change_label: "유지",
        subject_label: "민규",
        actor_label: "윤정",
      }),
      remind_at: "2026-06-04T03:30:00.000Z",
    });

    expect(text).toContain("주체: 민규");
    expect(text).toContain("추가자: 윤정");
    expect(text).toContain("제목: 민규 엄지발톱 케어");
  });

  it("keeps legacy structured body valid when labels are missing", () => {
    const text = buildTelegramTextForNotificationJob({
      title: "일정 알림 · 기존 일정",
      body: JSON.stringify({
        schema: "override_notification_v1",
        date: "2026-06-04",
        title: "기존 일정",
        event_type: "custom",
        event_type_label: "커스텀",
        shift_change: "KEEP",
        shift_change_label: "유지",
      }),
      remind_at: "2026-06-04T03:30:00.000Z",
    });

    expect(text).not.toContain("주체:");
    expect(text).not.toContain("추가자:");
    expect(text).toContain("제목: 기존 일정");
  });
});
