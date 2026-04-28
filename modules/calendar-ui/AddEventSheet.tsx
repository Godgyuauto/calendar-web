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
  formatKoreanDate,
  getTimeRangeError,
} from "@/modules/calendar-ui/add-event-sheet-utils";
import {
  BottomSheet,
  CalendarIcon,
  CloseIcon,
} from "@/modules/ui/components";

interface AddEventSheetProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  defaultDate: string;
  initialTab: "existing" | "create";
}

export function AddEventSheet({
  open,
  onClose,
  onSaved,
  defaultDate,
  initialTab,
}: AddEventSheetProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"existing" | "create">(initialTab);
  const [submitMode, setSubmitMode] = useState<"create" | "update">("create");
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
    const shouldUpdate = submitMode === "update" && Boolean(existingOverride?.id);
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/overrides", {
        method: shouldUpdate ? "PATCH" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          shouldUpdate && existingOverride
            ? { ...payload, id: existingOverride.id }
            : payload,
        ),
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

  const deleteExisting = async () => {
    if (!existingOverride) {
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      const response = await fetch(`/api/overrides?id=${encodeURIComponent(existingOverride.id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? "삭제에 실패했습니다.");
        return;
      }
      onSaved();
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setDeleting(false);
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
            onClick={() => {
              setActiveTab("existing");
              setError(null);
            }}
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
            onClick={() => {
              setActiveTab("create");
              setSubmitMode("create");
              setError(null);
            }}
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
            onSwitchToCreate={() => {
              setActiveTab("create");
              setSubmitMode("create");
              setError(null);
            }}
            onEditExisting={() => {
              setActiveTab("create");
              setSubmitMode("update");
              setError(null);
            }}
            onDeleteExisting={deleteExisting}
            deletingExisting={deleting}
          />
        ) : (
          <AddEventSheetEditor
            key={formSeedKey}
            initialForm={formSeed}
            saving={saving}
            error={error}
            submitLabel={submitMode === "update" ? "수정 저장" : "저장"}
            onSubmit={submit}
          />
        )}
      </div>
    </BottomSheet>
  );
}
