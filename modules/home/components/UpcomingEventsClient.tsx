"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AddEventSheet } from "@/modules/calendar-ui/AddEventSheet";
import { getEventTypeOption } from "@/modules/calendar-ui/structured-override";
import type { UpcomingScheduleItem } from "@/modules/home/upcoming-schedule";
import { toKoreanDateTime, toKoreanDateWithWeekday } from "@/modules/home/utils/date";
import { BottomSheet, CloseIcon } from "@/modules/ui/components";

interface UpcomingEventsClientProps {
  events: UpcomingScheduleItem[];
}

function formatEventTime(event: UpcomingScheduleItem): string {
  if (event.allDay) {
    return toKoreanDateWithWeekday(event.startTime);
  }

  return toKoreanDateTime(event.startTime);
}

function formatRange(event: UpcomingScheduleItem): string {
  if (event.allDay) {
    return "종일";
  }
  if (!event.endTime) {
    return toKoreanDateTime(event.startTime);
  }
  return `${toKoreanDateTime(event.startTime)} ~ ${toKoreanDateTime(event.endTime)}`;
}

function formatShift(event: UpcomingScheduleItem): string {
  if (!event.shiftChange) {
    return "근무조 변경 없음";
  }
  return event.shiftChange === "KEEP" ? "근무조 유지" : `근무조 ${event.shiftChange}`;
}

function formatEventType(event: UpcomingScheduleItem): string {
  if (!event.eventType) {
    return event.source === "event" ? "가족 일정" : "일정";
  }
  return getEventTypeOption(event.eventType).label;
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
                {formatEventTime(event)}
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

      <BottomSheet
        open={selected !== null}
        onClose={() => setSelected(null)}
        ariaLabel="다가오는 일정 상세"
      >
        {selected ? (
          <div className="px-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-[#8e8e93]">
                  {formatEventType(selected)}
                </p>
                <h2 className="mt-1 truncate text-[20px] font-bold text-[#1a1a1a]">
                  {selected.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[24px] text-[#8e8e93] active:bg-[#f2f2f7]"
                aria-label="닫기"
              >
                <CloseIcon size={20} />
              </button>
            </div>

            <div className="space-y-2 rounded-[14px] bg-[#f7f7f9] px-4 py-3 text-[13px] text-[#1a1a1a]">
              <p>
                <span className="font-semibold text-[#8e8e93]">시간 </span>
                {formatRange(selected)}
              </p>
              <p>
                <span className="font-semibold text-[#8e8e93]">근무 </span>
                {formatShift(selected)}
              </p>
              <p>
                <span className="font-semibold text-[#8e8e93]">메모 </span>
                {selected.memo || "없음"}
              </p>
              <p>
                <span className="font-semibold text-[#8e8e93]">알림 </span>
                {selected.remindAt ? toKoreanDateTime(selected.remindAt) : "없음"}
              </p>
            </div>

            {selected.source === "override" ? (
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(selected);
                    setSelected(null);
                  }}
                  className="min-h-11 flex-1 rounded-[11px] border border-[#007AFF] text-[14px] font-semibold text-[#007AFF] active:bg-[#eaf3ff]"
                >
                  수정하기
                </button>
                <button
                  type="button"
                  onClick={deleteSelected}
                  disabled={deletingId === selected.sourceId}
                  className="min-h-11 flex-1 rounded-[11px] border border-[#ff3b30] text-[14px] font-semibold text-[#ff3b30] active:bg-[#fff0ef] disabled:opacity-60"
                >
                  {deletingId === selected.sourceId ? "삭제 중..." : "삭제하기"}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </BottomSheet>

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
