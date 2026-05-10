import { describe, expect, it } from "vitest";
import {
  getScheduleSubjectColor,
  getScheduleSubjectName,
  SHARED_SUBJECT_COLOR,
} from "./calendar-subject-visuals";
import type { CalendarSubjectMember } from "./calendar-subject-types";

const members: CalendarSubjectMember[] = [
  { userId: "mingyu", name: "민규", working: true, color: "#007AFF", isSelf: true },
  { userId: "yunjung", name: "윤정", working: false, color: "#FF2D55", isSelf: false },
];

describe("calendar subject visuals", () => {
  it("uses the member color and name for personal schedules", () => {
    expect(getScheduleSubjectColor("member", "yunjung", members)).toBe("#FF2D55");
    expect(getScheduleSubjectName("member", "yunjung", members)).toBe("윤정");
  });

  it("uses a shared color and label for shared schedules", () => {
    expect(getScheduleSubjectColor("shared", null, members)).toBe(SHARED_SUBJECT_COLOR);
    expect(getScheduleSubjectName("shared", null, members)).toBe("우리");
  });
});
