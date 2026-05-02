"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AddEventSheet } from "@/modules/calendar-ui/AddEventSheet";
import {
  formatScheduleListTime,
  ScheduleDetailSheet,
} from "@/modules/calendar-ui/ScheduleDetailSheet";
import type { UpcomingScheduleItem } from "@/modules/home/upcoming-schedule";

interface UpcomingEventsClientProps {
  events: UpcomingScheduleItem[];
}

export function UpcomingEventsClient({ events }: UpcomingEventsClientProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<UpcomingScheduleItem | null>(null);
  const [editing, setEditing] = useState<UpcomingScheduleItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const deleteSelected = async () => {
    if (!selected || selected.source !== "override" || deletingId) {
      return;
    }
    setDeletingId(selected.sourceId);
    try {
      const response = await fetch(`/api/overrides?id=${encodeURIComponent(selected.sourceId)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        window.alert(body.error ?? "삭제에 실패했습니다.");
        return;
      }
      setSelected(null);
      router.refresh();
    } catch {
      window.alert("네트워크 오류가 발생했습니다.");
    } finally {
      setDeletingId(null);
    }
  };

  if (events.length === 0) {
    return (
      <div className="rounded-[14px] bg-white px-4 py-5 text-center text-[13px] text-[#8e8e93]">
        예정된 일정이 없습니다
      </div>
    );
  }

  return (
    <>
      <ul className="overflow-hidden rounded-[14px] bg-white">
        {events.map((event, i) => (
          <li
            key={event.id}
            className={i < events.length - 1 ? "border-b border-[#f5f5f5]" : ""}
          >
            <button
              type="button"
              onClick={() => setSelected(event)}
              className="flex w-full touch-manipulation items-center gap-3 px-4 py-3 text-left active:bg-[#f7f7f7]"
            >
              <span className="rounded-[10px] bg-[#eaf2ff] px-2.5 py-1 text-[11px] font-semibold text-[#007AFF]">
                {formatScheduleListTime(event)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] text-[#1a1a1a]">
                  {event.title}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <ScheduleDetailSheet
        event={selected}
        onClose={() => setSelected(null)}
        deletingId={deletingId}
        onEdit={(event) => {
          setEditing(event);
          setSelected(null);
        }}
        onDelete={deleteSelected}
      />

      {editing ? (
        <AddEventSheet
          key={editing.id}
          open
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            router.refresh();
          }}
          defaultDate={editing.dateKey}
          initialTab="create"
          initialSubmitMode="update"
          selectedOverrideId={editing.sourceId}
        />
      ) : null}
    </>
  );
}
