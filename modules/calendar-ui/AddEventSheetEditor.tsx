"use client";

import { useState } from "react";
import { StructuredFieldsSection } from "@/modules/calendar-ui/AddEventSheetSections";
import type { CalendarSubjectMember } from "@/modules/calendar-ui/calendar-subject-types";
import type { StructuredOverrideFormState } from "@/modules/calendar-ui/structured-override";
import { PrimaryButton } from "@/modules/ui/components";

interface AddEventSheetEditorProps {
  initialForm: StructuredOverrideFormState;
  saving: boolean;
  error: string | null;
  submitLabel: string;
  subjectMembers?: CalendarSubjectMember[];
  onSubmit: (form: StructuredOverrideFormState) => void;
}

export function AddEventSheetEditor({
  initialForm,
  saving,
  error,
  submitLabel,
  subjectMembers = [],
  onSubmit,
}: AddEventSheetEditorProps) {
  const [form, setForm] = useState<StructuredOverrideFormState>(initialForm);

  return (
    <>
      <StructuredFieldsSection form={form} setForm={setForm} subjectMembers={subjectMembers} />
      {error ? (
        <p role="alert" className="mt-2 text-[12px] text-[#ff3b30]">
          {error}
        </p>
      ) : null}
      <PrimaryButton onClick={() => onSubmit(form)} disabled={saving} className="mt-5">
        {saving ? "저장 중..." : submitLabel}
      </PrimaryButton>
    </>
  );
}
