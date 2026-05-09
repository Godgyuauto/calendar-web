"use client";

import type { Dispatch, SetStateAction } from "react";
import { AnnualLeaveDeductionSection } from "@/modules/calendar-ui/AnnualLeaveDeductionSection";
import { ReminderSection } from "@/modules/calendar-ui/ReminderSection";
import { TimeRangeSection } from "@/modules/calendar-ui/TimeRangeSection";
import {
  OFF_REASON_OPTIONS,
  SHIFT_CHANGE_OPTIONS,
  type StructuredOverrideFormState,
} from "@/modules/calendar-ui/structured-override";
import {
  Chip,
  SectionLabel,
  TextField,
} from "@/modules/ui/components";
import type { OverrideType, ShiftCode } from "@/modules/shift";

interface StructuredFieldsSectionProps {
  form: StructuredOverrideFormState;
  setForm: Dispatch<SetStateAction<StructuredOverrideFormState>>;
}

const OFF_REASON_IDS = new Set<OverrideType>(["vacation", "sick", "custom"]);

function withAnnualLeaveDefaults(
  current: StructuredOverrideFormState,
): StructuredOverrideFormState {
  return {
    ...current,
    leaveDeductionHours: current.leaveDeductionHours ?? 8,
    leaveDeductionLabel: current.leaveDeductionLabel ?? "연차",
    leaveExemptFromDeduction: current.leaveExemptFromDeduction ?? false,
  };
}

function eventTypeForShiftChange(
  shiftChange: ShiftCode | "KEEP",
  currentEventType: OverrideType,
): OverrideType {
  if (shiftChange === "OFF") {
    return OFF_REASON_IDS.has(currentEventType) ? currentEventType : "vacation";
  }
  if (shiftChange === "KEEP") {
    return OFF_REASON_IDS.has(currentEventType) ? "custom" : currentEventType;
  }
  return OFF_REASON_IDS.has(currentEventType) ? "swap" : currentEventType;
}

export function StructuredFieldsSection({ form, setForm }: StructuredFieldsSectionProps) {
  const isCustom = form.eventType === "custom";
  const isOffChange = form.shiftChange === "OFF";

  return (
    <>
      <SectionLabel className="px-0">근무조 변경</SectionLabel>
      <div className="flex gap-1.5">
        {SHIFT_CHANGE_OPTIONS.map((option) => (
          <Chip
            key={option}
            active={form.shiftChange === option}
            onClick={() =>
              setForm((current) => {
                const nextEventType = eventTypeForShiftChange(option, current.eventType);
                const next = { ...current, shiftChange: option, eventType: nextEventType };
                return nextEventType === "vacation" ? withAnnualLeaveDefaults(next) : next;
              })
            }
            variant="segment"
          >
            {option === "KEEP" ? "유지" : option}
          </Chip>
        ))}
      </div>

      {isOffChange ? (
        <>
          <SectionLabel className="px-0">OFF 사유</SectionLabel>
          <div className="grid grid-cols-3 gap-2">
            {OFF_REASON_OPTIONS.map((option) => (
              <Chip
                key={option.id}
                active={form.eventType === option.id}
                onClick={() =>
                  setForm((current) =>
                    option.id === "vacation"
                      ? withAnnualLeaveDefaults({ ...current, eventType: option.id })
                      : { ...current, eventType: option.id },
                  )
                }
                className="w-full flex-col !px-2 !py-2"
              >
                <span className="text-[16px] leading-none">{option.emoji}</span>
                <span className="mt-0.5 text-[11px]">{option.label}</span>
              </Chip>
            ))}
          </div>
          {form.eventType === "vacation" ? (
            <AnnualLeaveDeductionSection form={form} setForm={setForm} />
          ) : null}
        </>
      ) : null}

      <TimeRangeSection form={form} setForm={setForm} />

      <SectionLabel className="px-0">{isCustom ? "일정 제목" : "일정 제목 (선택)"}</SectionLabel>
      <TextField
        value={form.title}
        onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
        placeholder={isOffChange ? "예: 연차, 가족 일정" : "예: 회식, 직무 교육"}
        aria-required={isCustom ? "true" : undefined}
      />

      <SectionLabel className="px-0">메모 (선택)</SectionLabel>
      <TextField
        value={form.memo}
        onChange={(event) => setForm((current) => ({ ...current, memo: event.target.value }))}
        placeholder="메모 입력"
      />

      <ReminderSection form={form} setForm={setForm} />
    </>
  );
}
