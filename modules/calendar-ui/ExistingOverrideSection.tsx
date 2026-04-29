"use client";

import type { ExistingOverride } from "@/modules/calendar-ui/use-existing-override";
import {
  getEventTypeOption,
  toStructuredOverrideDisplay,
} from "@/modules/calendar-ui/structured-override";
import { SectionLabel } from "@/modules/ui/components";

interface ExistingOverrideSectionProps {
  existingLoading: boolean;
  existingOverride: ExistingOverride | null;
  existingError: string | null;
  onSwitchToCreate?: () => void;
  onEditExisting?: () => void;
  onDeleteExisting?: () => void;
  deletingExisting?: boolean;
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

export function ExistingOverrideSection({
  existingLoading,
  existingOverride,
  existingError,
  onSwitchToCreate,
  onEditExisting,
  onDeleteExisting,
  deletingExisting = false,
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
              시간: {formatDateTimeLabel(existingDisplay.startAt)} ~{" "}
              {formatDateTimeLabel(existingDisplay.endAt)}
            </p>
          ) : null}
          <div className="mt-3 flex gap-2">
            {onEditExisting ? (
              <button
                type="button"
                onClick={onEditExisting}
                disabled={deletingExisting}
                className="min-h-10 flex-1 touch-manipulation rounded-[10px] border border-[#007AFF] px-3 py-2 text-[13px] font-semibold text-[#007AFF] active:bg-[#eaf3ff] disabled:cursor-not-allowed disabled:opacity-60"
              >
                수정하기
              </button>
            ) : null}
            {onDeleteExisting ? (
              <button
                type="button"
                onClick={onDeleteExisting}
                disabled={deletingExisting}
                className="min-h-10 flex-1 touch-manipulation rounded-[10px] border border-[#ff3b30] px-3 py-2 text-[13px] font-semibold text-[#ff3b30] active:bg-[#fff0ef] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingExisting ? "삭제 중..." : "삭제하기"}
              </button>
            ) : null}
          </div>
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
