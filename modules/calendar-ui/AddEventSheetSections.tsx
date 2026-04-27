"use client";

import type { Dispatch, SetStateAction } from "react";
import type { ExistingOverride } from "@/modules/calendar-ui/use-existing-override";
import {
  EVENT_TYPE_OPTIONS,
  SHIFT_CHANGE_OPTIONS,
  getEventTypeOption,
  toStructuredOverrideDisplay,
  type StructuredOverrideFormState,
} from "@/modules/calendar-ui/structured-override";
import {
  Chip,
  SectionLabel,
  TextField,
} from "@/modules/ui/components";

interface ExistingOverrideSectionProps {
  existingLoading: boolean;
  existingOverride: ExistingOverride | null;
  existingError: string | null;
  onSwitchToCreate?: () => void;
}

interface StructuredFieldsSectionProps {
  form: StructuredOverrideFormState;
  setForm: Dispatch<SetStateAction<StructuredOverrideFormState>>;
}

function formatDateTimeLabel(value: string | null): string {
  if (!value) {
    return "-";
  }

  const compact = value.replace(" ", "T").slice(0, 16);
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(compact)) {
    return compact.slice(5).replace("T", " ");
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(parsed);
}

function formatTimeOnly(value: string | null): string {
  const label = formatDateTimeLabel(value);
  if (label === "-") {
    return label;
  }

  const timeMatch = label.match(/(\d{2}:\d{2})$/);
  return timeMatch ? timeMatch[1] : label;
}

export function ExistingOverrideSection({
  existingLoading,
  existingOverride,
  existingError,
  onSwitchToCreate,
}: ExistingOverrideSectionProps) {
  const existingDisplay = existingOverride ? toStructuredOverrideDisplay(existingOverride) : null;

  return (
    <>
      <SectionLabel className="px-0">이 날 일정</SectionLabel>
      {existingLoading ? (
        <p className="text-[12px] text-[#8e8e93]">불러오는 중...</p>
      ) : existingOverride && existingDisplay ? (
        <div className="rounded-[13px] border-[1.5px] border-[#e8e8e8] bg-[#f9f9f9] px-3.5 py-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[14px] font-semibold text-[#1a1a1a]">
              {existingDisplay.title || getEventTypeOption(existingDisplay.eventType).label}
            </p>
            <span className="rounded-[6px] bg-[#fff2e8] px-2 py-0.5 text-[11px] font-semibold text-[#c05621]">
              {getEventTypeOption(existingDisplay.eventType).label}
            </span>
          </div>
          <p className="mt-1 text-[12px] text-[#8e8e93]">
            {existingDisplay.shiftChange === "KEEP"
              ? "근무조 유지"
              : `근무조 ${existingDisplay.shiftChange}`}
            {" · "}
            {existingDisplay.memo || "메모 없음"}
          </p>
          {existingDisplay.startAt && existingDisplay.endAt ? (
            <p className="mt-1 text-[12px] text-[#8e8e93]">
              시간: {formatTimeOnly(existingDisplay.startAt)} ~{" "}
              {formatTimeOnly(existingDisplay.endAt)}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="rounded-[13px] border-[1.5px] border-dashed border-[#e5e5ea] bg-[#fafafa] px-3.5 py-5 text-center">
          <p className="text-[13px] text-[#8e8e93]">등록된 일정이 없습니다.</p>
          {onSwitchToCreate ? (
            <button
              type="button"
              onClick={onSwitchToCreate}
              className="mt-2 text-[12px] font-semibold text-[#007AFF]"
            >
              일정 추가하기 →
            </button>
          ) : null}
        </div>
      )}
      {existingError ? (
        <p role="alert" className="mt-1 text-[12px] text-[#ff3b30]">
          {existingError}
        </p>
      ) : null}
    </>
  );
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

      <SectionLabel className="px-0">시간 (선택)</SectionLabel>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <TextField
          type="time"
          value={form.startAt}
          placeholder="09:00"
          className="text-center"
          onChange={(event) =>
            setForm((current) => ({ ...current, startAt: event.target.value }))
          }
        />
        <span className="text-[12px] font-semibold text-[#8e8e93]">→</span>
        <TextField
          type="time"
          value={form.endAt}
          placeholder="18:00"
          className="text-center"
          onChange={(event) =>
            setForm((current) => ({ ...current, endAt: event.target.value }))
          }
        />
      </div>

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
