import { describe, expect, it } from "vitest";
import type { ShiftOverride } from "@/modules/shift";
import { buildStructuredOverrideNotificationBody } from "./structured-override-notification";

describe("structured override notification body", () => {
  it("includes optional subject and actor labels for downstream telegram delivery", () => {
    const override: ShiftOverride = {
      id: "override-1",
      date: "2026-06-04",
      overrideType: "custom",
      overrideShift: null,
      label: "민규 엄지발톱 케어",
      note: JSON.stringify({
        schema: "calendar_override_v1",
        event_type: "custom",
        shift_change: "KEEP",
        title: "민규 엄지발톱 케어",
        subject_type: "member",
        subject_user_id: "member-1",
      }),
    };

    const payload = buildStructuredOverrideNotificationBody(override, {
      subjectLabel: "민규",
      actorLabel: "윤정",
    });

    expect(payload).toMatchObject({
      subject_label: "민규",
      actor_label: "윤정",
    });
  });
});
