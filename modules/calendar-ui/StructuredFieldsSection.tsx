"use client";

import type { Dispatch, SetStateAction } from "react";
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

      <SectionLabel className="px-0">일정 제목 (선택)</SectionLabel>
      <TextField
        value={form.title}
        onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
        placeholder="예: 연차, 직무 교육"
      />

      <SectionLabel className="px-0">메모 (선택)</SectionLabel>
      <TextField
        value={form.memo}
        onChange={(event) => setForm((current) => ({ ...current, memo: event.target.value }))}
        placeholder="메모 입력"
      />

      <SectionLabel className="px-0">알림 시각 (선택)</SectionLabel>
      <TextField
        type="datetime-local"
        value={form.remindAt}
        onChange={(event) => setForm((current) => ({ ...current, remindAt: event.target.value }))}
      />
    </>
  );
}
