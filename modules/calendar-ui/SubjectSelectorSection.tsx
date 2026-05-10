"use client";

import type { Dispatch, SetStateAction } from "react";
import type { CalendarSubjectMember } from "@/modules/calendar-ui/calendar-subject-types";
import type { StructuredOverrideFormState } from "@/modules/calendar-ui/structured-override";
import { Chip, SectionLabel } from "@/modules/ui/components";

interface SubjectSelectorSectionProps {
  form: StructuredOverrideFormState;
  setForm: Dispatch<SetStateAction<StructuredOverrideFormState>>;
  members: CalendarSubjectMember[];
}

export function SubjectSelectorSection({
  form,
  setForm,
  members,
}: SubjectSelectorSectionProps) {
  if (members.length === 0) {
    return null;
  }

  const selectedSubjectType = form.subjectType ?? "member";
  const selectedUserId =
    form.subjectUserId ??
    members.find((member) => member.isSelf)?.userId ??
    members[0]?.userId ??
    null;

  return (
    <>
      <SectionLabel className="px-0">일정 주체</SectionLabel>
      <div className="grid grid-cols-3 gap-2">
        {members.map((member) => (
          <Chip
            key={member.userId}
            active={selectedSubjectType === "member" && selectedUserId === member.userId}
            onClick={() =>
              setForm((current) => ({
                ...current,
                subjectType: "member",
                subjectUserId: member.userId,
              }))
            }
            className="w-full"
          >
            {member.name}
          </Chip>
        ))}
        <Chip
          active={selectedSubjectType === "shared"}
          onClick={() =>
            setForm((current) => ({
              ...current,
              subjectType: "shared",
              subjectUserId: null,
            }))
          }
          className="w-full"
        >
          우리
        </Chip>
      </div>
    </>
  );
}
