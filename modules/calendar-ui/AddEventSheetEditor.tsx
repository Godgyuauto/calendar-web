"use client";

import { useState } from "react";
import { StructuredFieldsSection } from "@/modules/calendar-ui/AddEventSheetSections";
import type { StructuredOverrideFormState } from "@/modules/calendar-ui/structured-override";
import { PrimaryButton } from "@/modules/ui/components";

interface AddEventSheetEditorProps {
  initialForm: StructuredOverrideFormState;
  saving: boolean;
  error: string | null;
  submitLabel: string;
  onSubmit: (form: StructuredOverrideFormState) => void;
}

export function AddEventSheetEditor({
  initialForm,
  saving,
  error,
  submitLabel,
  onSubmit,
}: AddEventSheetEditorProps) {
  const [form, setForm] = useState<StructuredOverrideFormState>(initialForm);

  return (
    <>
      <StructuredFieldsSection form={form} setForm={setForm} />
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
