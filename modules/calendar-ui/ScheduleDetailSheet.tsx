"use client";

import { getEventTypeOption } from "@/modules/calendar-ui/structured-override";
import type { CalendarSubjectMember } from "@/modules/calendar-ui/calendar-subject-types";
import { getScheduleSubjectName } from "@/modules/calendar-ui/calendar-subject-visuals";
import type { ScheduleDetailItem } from "@/modules/calendar-ui/schedule-detail-types";
import { BottomSheet, CloseIcon } from "@/modules/ui/components";

interface ScheduleDetailSheetProps {
  event: ScheduleDetailItem | null;
  deletingId?: string | null;
  subjectMembers?: CalendarSubjectMember[];
  onClose: () => void;
  onEdit?: (event: ScheduleDetailItem) => void;
  onDelete?: (event: ScheduleDetailItem) => void;
}

function toSeoulDate(value: string): Date {
  const hasTimeZone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value);
  return new Date(hasTimeZone ? value : `${value}+09:00`);
}

function toKoreanDateTime(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(toSeoulDate(value));
}

function toKoreanDateWithWeekday(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "numeric",
    day: "numeric",
    weekday: "short",
  }).format(toSeoulDate(value));
}

function formatRange(event: ScheduleDetailItem): string {
  if (event.allDay) {
    return "종일";
  }
  if (!event.endTime) {
    return toKoreanDateTime(event.startTime);
  }
  return `${toKoreanDateTime(event.startTime)} ~ ${toKoreanDateTime(event.endTime)}`;
}

function formatShift(event: ScheduleDetailItem): string {
  if (!event.shiftChange) {
    return "근무조 변경 없음";
  }
  return event.shiftChange === "KEEP" ? "근무조 유지" : `근무조 ${event.shiftChange}`;
}

function formatEventType(event: ScheduleDetailItem): string {
  if (!event.eventType) {
    return event.source === "event" ? "가족 일정" : "일정";
  }
  return getEventTypeOption(event.eventType).label;
}

function formatMemberName(
  members: CalendarSubjectMember[],
  userId: string | null | undefined,
): string | null {
  if (!userId) {
    return null;
  }
  return members.find((member) => member.userId === userId)?.name ?? null;
}

export function formatScheduleListTime(event: ScheduleDetailItem): string {
  return event.allDay ? toKoreanDateWithWeekday(event.startTime) : toKoreanDateTime(event.startTime);
}

export function ScheduleDetailSheet({
  event,
  deletingId = null,
  subjectMembers = [],
  onClose,
  onEdit,
  onDelete,
}: ScheduleDetailSheetProps) {
  return (
    <BottomSheet open={event !== null} onClose={onClose} ariaLabel="일정 상세">
      {event ? (
        <div className="px-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-[#8e8e93]">
                {formatEventType(event)}
              </p>
              <h2 className="mt-1 truncate text-[20px] font-bold text-[#1a1a1a]">
                {event.title}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[24px] text-[#8e8e93] active:bg-[#f2f2f7]"
              aria-label="닫기"
            >
              <CloseIcon size={20} />
            </button>
          </div>

          <div className="space-y-2 rounded-[14px] bg-[#f7f7f9] px-4 py-3 text-[13px] text-[#1a1a1a]">
            <p><span className="font-semibold text-[#8e8e93]">시간 </span>{formatRange(event)}</p>
            <p><span className="font-semibold text-[#8e8e93]">근무 </span>{formatShift(event)}</p>
            <p>
              <span className="font-semibold text-[#8e8e93]">주체 </span>
              {getScheduleSubjectName(event.subjectType, event.subjectUserId, subjectMembers)}
            </p>
            <p>
              <span className="font-semibold text-[#8e8e93]">추가 </span>
              {formatMemberName(subjectMembers, event.createdBy) ?? "알 수 없음"}
            </p>
            <p><span className="font-semibold text-[#8e8e93]">메모 </span>{event.memo || "없음"}</p>
            <p>
              <span className="font-semibold text-[#8e8e93]">알림 </span>
              {event.remindAt ? toKoreanDateTime(event.remindAt) : "없음"}
            </p>
          </div>

          {event.source === "override" && onEdit && onDelete ? (
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => onEdit(event)}
                className="min-h-11 flex-1 rounded-[11px] border border-[#007AFF] text-[14px] font-semibold text-[#007AFF] active:bg-[#eaf3ff]"
              >
                수정하기
              </button>
              <button
                type="button"
                onClick={() => onDelete(event)}
                disabled={deletingId === event.sourceId}
                className="min-h-11 flex-1 rounded-[11px] border border-[#ff3b30] text-[14px] font-semibold text-[#ff3b30] active:bg-[#fff0ef] disabled:opacity-60"
              >
                {deletingId === event.sourceId ? "삭제 중..." : "삭제하기"}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </BottomSheet>
  );
}
