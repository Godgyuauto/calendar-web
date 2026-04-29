"use client";

import type { Dispatch, SetStateAction } from "react";
import { ReminderSection } from "@/modules/calendar-ui/ReminderSection";
import { TimeRangeSection } from "@/modules/calendar-ui/TimeRangeSection";
import {
  EVENT_TYPE_OPTIONS,
  SHIFT_CHANGE_OPTIONS,
  type StructuredOverrideFormState,
} from "@/modules/calendar-ui/structured-override";
import {
  Chip,
  SectionLabel,
  TextField,
} from "@/modules/ui/components";

interface StructuredFieldsSectionProps {
  form: StructuredOverrideFormState;
  setForm: Dispatch<SetStateAction<StructuredOverrideFormState>>;
}

export function StructuredFieldsSection({ form, setForm }: StructuredFieldsSectionProps) {
  const isCustom = form.eventType === "custom";

  return (
    <>
      <SectionLabel className="px-0">일정 유형</SectionLabel>
      <div className="grid grid-cols-3 gap-2">
        {EVENT_TYPE_OPTIONS.map((option) => (
          <Chip
            key={option.id}
            active={form.eventType === option.id}
            onClick={() => setForm((current) => ({ ...current, eventType: option.id }))}
            className="w-full flex-col !px-2 !py-2"
          >
            <span className="text-[16px] leading-none">{option.emoji}</span>
            <span className="mt-0.5 text-[11px]">{option.label}</span>
          </Chip>
        ))}
      </div>

      {isCustom ? (
        <>
          <SectionLabel className="px-0">커스텀 일정명</SectionLabel>
          <TextField
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            placeholder="예: 회식, 가족 모임"
            aria-required="true"
          />
        </>
      ) : null}

      <SectionLabel className="px-0">근무조 변경</SectionLabel>
      <div className="flex gap-1.5">
        {SHIFT_CHANGE_OPTIONS.map((option) => (
          <Chip
            key={option}
            active={form.shiftChange === option}
            onClick={() => setForm((current) => ({ ...current, shiftChange: option }))}
            variant="segment"
          >
            {option === "KEEP" ? "유지" : option}
          </Chip>
        ))}
      </div>

      <TimeRangeSection form={form} setForm={setForm} />

      {!isCustom ? (
        <>
          <SectionLabel className="px-0">일정 제목 (선택)</SectionLabel>
          <TextField
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            placeholder="예: 연차, 직무 교육"
          />
        </>
      ) : null}

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
