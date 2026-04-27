"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AddEventSheetEditor } from "@/modules/calendar-ui/AddEventSheetEditor";
import { useExistingOverride } from "@/modules/calendar-ui/use-existing-override";
import {
  ExistingOverrideSection,
} from "@/modules/calendar-ui/AddEventSheetSections";
import {
  toOverrideSubmitPayload,
  toStructuredOverrideFormState,
  type StructuredOverrideFormState,
} from "@/modules/calendar-ui/structured-override";
import {
  BottomSheet,
  CalendarIcon,
  CloseIcon,
} from "@/modules/ui/components";

interface AddEventSheetProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  // Default ISO date (YYYY-MM-DD) shown in the header.
  defaultDate: string;
  initialTab: "existing" | "create";
}

function formatKoreanDate(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
    timeZone: "Asia/Seoul",
  }).format(date);
}

function isDateTimeRangeInvalid(dateKey: string, startAt: string, endAt: string): boolean {
  const startUnix = new Date(`${dateKey}T${startAt}`).getTime();
  const endUnix = new Date(`${dateKey}T${endAt}`).getTime();
  if (Number.isNaN(startUnix) || Number.isNaN(endUnix)) {
    return true;
  }

  return endUnix <= startUnix;
}

function getTimeRangeError(
  dateKey: string,
  form: StructuredOverrideFormState,
): string | null {
  const hasStartAt = form.startAt.trim().length > 0;
  const hasEndAt = form.endAt.trim().length > 0;
  if (!hasStartAt && !hasEndAt) {
    return null;
  }
  if (hasStartAt !== hasEndAt) {
    return "시작/종료 시간을 함께 입력해주세요.";
  }
  return isDateTimeRangeInvalid(dateKey, form.startAt, form.endAt)
    ? "시작/종료 시간을 확인해주세요."
    : null;
}

// Bottom sheet for adding/editing an override entry on the selected date.
// Submits structured fields via /api/overrides payload + note JSON metadata.
export function AddEventSheet({
  open,
  onClose,
  onSaved,
  defaultDate,
  initialTab,
}: AddEventSheetProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"existing" | "create">(initialTab);
  const { existingOverride, existingLoading, existingError } = useExistingOverride({
    open,
    dateKey: defaultDate,
  });
  const formSeed = toStructuredOverrideFormState({
    dateKey: defaultDate,
    override: existingOverride ?? undefined,
  });
  const formSeedKey = `${defaultDate}:${existingOverride?.id ?? "new"}`;

  const submit = async (form: StructuredOverrideFormState) => {
    const timeError = getTimeRangeError(defaultDate, form);
    if (timeError) {
      setError(timeError);
      return;
    }

    const payload = toOverrideSubmitPayload(defaultDate, form);
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/overrides", {
        method: "POST",
        // Route auth supports cookie-token fallback for browser-originated
        // requests, so the sheet can save without manually injecting headers.
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? "저장에 실패했습니다.");
        return;
      }
      onSaved();
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet open={open} onClose={onClose} ariaLabel="일정 상세 및 추가">
      <header className="flex items-center justify-between px-5 pb-3">
        <div className="flex items-center gap-2 text-[15px] font-semibold text-[#1a1a1a]">
          <span className="text-[#007AFF]">
            <CalendarIcon size={18} />
          </span>
          <span>{formatKoreanDate(defaultDate)}</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="text-[#8e8e93]"
        >
          <CloseIcon size={20} />
        </button>
      </header>

      <div className="px-5">
        <nav className="mb-3 flex border-b border-[#e5e5ea]">
          <button
            type="button"
            onClick={() => setActiveTab("existing")}
            className={`flex-1 pb-2 text-[16px] font-semibold ${
              activeTab === "existing"
                ? "border-b-2 border-[#007AFF] text-[#007AFF]"
                : "text-[#8e8e93]"
            }`}
          >
            등록된 일정
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("create")}
            className={`flex-1 pb-2 text-[16px] font-semibold ${
              activeTab === "create"
                ? "border-b-2 border-[#007AFF] text-[#007AFF]"
                : "text-[#8e8e93]"
            }`}
          >
            일정 추가하기
          </button>
        </nav>

        {activeTab === "existing" ? (
          <ExistingOverrideSection
            existingLoading={existingLoading}
            existingOverride={existingOverride}
            existingError={existingError}
            onSwitchToCreate={() => setActiveTab("create")}
          />
        ) : (
          // Keyed remount keeps form-state aligned with day-tap target without effect resets.
          <AddEventSheetEditor
            key={formSeedKey}
            initialForm={formSeed}
            saving={saving}
            error={error}
            hasExistingOverride={Boolean(existingOverride)}
            onSubmit={submit}
          />
        )}
      </div>
    </BottomSheet>
  );
}
