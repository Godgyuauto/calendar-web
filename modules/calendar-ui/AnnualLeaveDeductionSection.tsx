"use client";

import type { Dispatch, SetStateAction } from "react";
import type { StructuredOverrideFormState } from "@/modules/calendar-ui/structured-override";
import { normalizeLeaveDeduction } from "@/modules/leave/annual-leave-deduction";
import { Chip, SectionLabel } from "@/modules/ui/components";

interface AnnualLeaveDeductionSectionProps {
  form: StructuredOverrideFormState;
  setForm: Dispatch<SetStateAction<StructuredOverrideFormState>>;
}

const HOURLY_OPTIONS = [1, 2, 3, 5, 6, 7];

function setDeduction(hours: number) {
  const deduction = normalizeLeaveDeduction(hours);
  return (current: StructuredOverrideFormState): StructuredOverrideFormState => ({
    ...current,
    leaveDeductionHours: deduction.hours,
    leaveDeductionLabel: deduction.label,
  });
}

export function AnnualLeaveDeductionSection({
  form,
  setForm,
}: AnnualLeaveDeductionSectionProps) {
  const hours = form.leaveDeductionHours ?? 8;

  return (
    <>
      <SectionLabel className="px-0">연차 차감</SectionLabel>
      <div className="grid grid-cols-2 gap-2">
        <Chip active={hours === 8} onClick={() => setForm(setDeduction(8))} variant="segment">
          연차
        </Chip>
        <Chip active={hours === 4} onClick={() => setForm(setDeduction(4))} variant="segment">
          반차
        </Chip>
      </div>
      <div className="mt-2 grid grid-cols-6 gap-1.5">
        {HOURLY_OPTIONS.map((option) => (
          <Chip
            key={option}
            active={hours === option}
            onClick={() => setForm(setDeduction(option))}
            className="!px-1 !py-2 text-[11px]"
            variant="segment"
          >
            {option}h
          </Chip>
        ))}
      </div>
    </>
  );
}
