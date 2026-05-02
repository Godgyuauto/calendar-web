"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AddEventSheet } from "@/modules/calendar-ui/AddEventSheet";
import { ScheduleDetailSheet } from "@/modules/calendar-ui/ScheduleDetailSheet";
import type { ScheduleDetailItem } from "@/modules/calendar-ui/schedule-detail-types";

export function useCalendarScheduleDetail() {
  const router = useRouter();
  const [selectedDetail, setSelectedDetail] = useState<ScheduleDetailItem | null>(null);
  const [editingDetail, setEditingDetail] = useState<ScheduleDetailItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const deleteDetail = async (event: ScheduleDetailItem) => {
    if (event.source !== "override" || deletingId) {
      return;
    }
    setDeletingId(event.sourceId);
    try {
      const response = await fetch(`/api/overrides?id=${encodeURIComponent(event.sourceId)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        window.alert(body.error ?? "삭제에 실패했습니다.");
        return;
      }
      setSelectedDetail(null);
      router.refresh();
    } catch {
      window.alert("네트워크 오류가 발생했습니다.");
    } finally {
      setDeletingId(null);
    }
  };

  const detailSheets = (
    <>
      <ScheduleDetailSheet
        event={selectedDetail}
        onClose={() => setSelectedDetail(null)}
        deletingId={deletingId}
        onEdit={(event) => {
          setEditingDetail(event);
          setSelectedDetail(null);
        }}
        onDelete={deleteDetail}
      />
      {editingDetail ? (
        <AddEventSheet
          key={`edit:${editingDetail.id}`}
          open
          onClose={() => setEditingDetail(null)}
          onSaved={() => {
            setEditingDetail(null);
            router.refresh();
          }}
          defaultDate={editingDetail.dateKey}
          initialTab="create"
          initialSubmitMode="update"
          selectedOverrideId={editingDetail.sourceId}
        />
      ) : null}
    </>
  );

  return {
    openDetail: setSelectedDetail,
    detailSheets,
  };
}
