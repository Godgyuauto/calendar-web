"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AddEventSheetEditor } from "@/modules/calendar-ui/AddEventSheetEditor";
import { AddEventSheetHeader } from "@/modules/calendar-ui/AddEventSheetHeader";
import {
  AddEventSheetTabs,
  type AddEventSheetTab,
} from "@/modules/calendar-ui/AddEventSheetTabs";
import { useExistingOverride } from "@/modules/calendar-ui/use-existing-override";
import type { ExistingOverride } from "@/modules/calendar-ui/use-existing-override";
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
  getFormValidationError,
} from "@/modules/calendar-ui/add-event-sheet-utils";
import {
  BottomSheet,
} from "@/modules/ui/components";

interface AddEventSheetProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  defaultDate: string;
  initialTab: "existing" | "create";
  initialSubmitMode?: "create" | "update";
  selectedOverrideId?: string | null;
}

export function AddEventSheet({
  open,
  onClose,
  onSaved,
  defaultDate,
  initialTab,
  initialSubmitMode = "create",
  selectedOverrideId,
}: AddEventSheetProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AddEventSheetTab>(initialTab);
  const [submitMode, setSubmitMode] = useState<"create" | "update">(initialSubmitMode);
  const [draftOverride, setDraftOverride] = useState<ExistingOverride | null>(null);
  const { existingOverride, existingOverrides, existingLoading, existingError } =
    useExistingOverride({
      open,
      dateKey: defaultDate,
      selectedOverrideId,
    });
  const formOverride = draftOverride ?? existingOverride;
  const formSeed = toStructuredOverrideFormState({
    dateKey: defaultDate,
    override: formOverride ?? undefined,
    sameDayOverrides: formOverride ? undefined : existingOverrides,
  });
  const createSeedKey =
    existingOverrides.map((override) => override.id).join(",") || "new";
  const formSeedKey = `${defaultDate}:${formOverride?.id ?? createSeedKey}`;

  const submit = async (form: StructuredOverrideFormState) => {
    if (saving || deleting) {
      return;
    }
    const validationError = getFormValidationError(form);
    if (validationError) {
      setError(validationError);
      return;
    }
    const payload = toOverrideSubmitPayload(defaultDate, form);
    const shouldUpdate = submitMode === "update" && Boolean(formOverride?.id);
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/overrides", {
        method: shouldUpdate ? "PATCH" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          shouldUpdate && formOverride
            ? { ...payload, id: formOverride?.id }
            : payload,
        ),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? "저장에 실패했습니다.");
        return;
      }
      onSaved();
      setTimeout(() => router.refresh(), 0);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const deleteExisting = async (target: ExistingOverride) => {
    if (deleting || saving) {
      return;
    }
    const deleteId = target.id;
    setDeleting(true);
    setError(null);
    onSaved();
    try {
      const response = await fetch(`/api/overrides?id=${encodeURIComponent(deleteId)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        window.alert(body.error ?? "삭제에 실패했습니다. 화면을 새로고침한 뒤 다시 시도해주세요.");
        return;
      }
      setTimeout(() => router.refresh(), 0);
    } catch {
      window.alert("네트워크 오류가 발생했습니다. 화면을 새로고침한 뒤 다시 시도해주세요.");
    } finally {
      setDeleting(false);
    }
  };

  const selectTab = (tab: AddEventSheetTab) => {
    setActiveTab(tab);
    if (tab === "create") {
      setSubmitMode("create");
      setDraftOverride(null);
    }
    setError(null);
  };

  return (
    <BottomSheet open={open} onClose={onClose} ariaLabel="일정 상세 및 추가">
      <AddEventSheetHeader label={formatKoreanDate(defaultDate)} onClose={onClose} />

      <div className="px-5">
        <AddEventSheetTabs activeTab={activeTab} onSelect={selectTab} />

        {activeTab === "existing" ? (
          <ExistingOverrideSection
            existingLoading={existingLoading}
            existingOverride={existingOverride}
            existingOverrides={existingOverrides}
            existingError={existingError}
            onSwitchToCreate={() => {
              setActiveTab("create");
              setSubmitMode("create");
              setError(null);
            }}
            onEditExisting={(override) => {
              setDraftOverride(override);
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
