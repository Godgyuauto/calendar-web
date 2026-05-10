import type { OverrideSubjectType } from "@/modules/family/domain/structured-override-note-types";
import type { CalendarSubjectMember } from "./calendar-subject-types";

export const SHARED_SUBJECT_COLOR = "#5856D6";
const FALLBACK_SUBJECT_COLOR = "#ff9500";

export function getScheduleSubjectName(
  subjectType: OverrideSubjectType | null | undefined,
  subjectUserId: string | null | undefined,
  members: CalendarSubjectMember[],
): string {
  if (subjectType === "shared") {
    return "우리";
  }
  return members.find((member) => member.userId === subjectUserId)?.name ?? "개인";
}

export function getScheduleSubjectColor(
  subjectType: OverrideSubjectType | null | undefined,
  subjectUserId: string | null | undefined,
  members: CalendarSubjectMember[],
): string {
  if (subjectType === "shared") {
    return SHARED_SUBJECT_COLOR;
  }
  return members.find((member) => member.userId === subjectUserId)?.color ?? FALLBACK_SUBJECT_COLOR;
}
