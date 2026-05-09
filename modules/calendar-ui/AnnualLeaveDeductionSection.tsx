"use client";

import type { Dispatch, SetStateAction } from "react";
import type { StructuredOverrideFormState } from "@/modules/calendar-ui/structured-override";
import { normalizeLeaveDeduction } from "@/modules/leave/annual-leave-deduction";
import { isKoreanPublicHoliday } from "@/modules/leave/korean-public-holidays";
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
  const publicHoliday = isKoreanPublicHoliday(form.startDate);
  const exempt = publicHoliday || (form.leaveExemptFromDeduction ?? false);

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
      <label className="mt-2 flex items-center gap-2 rounded-[12px] bg-[#f2f2f7] px-3 py-2">
        <input
          type="checkbox"
          checked={exempt}
          disabled={publicHoliday}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              leaveExemptFromDeduction: event.target.checked,
            }))
          }
          className="h-4 w-4 accent-[#007AFF]"
        />
        <span className="text-[12px] font-semibold text-[#6e6e73]">
          {publicHoliday ? "공휴일이라 차감 없음" : "회사 휴일로 차감 없음"}
        </span>
      </label>
    </>
  );
}
