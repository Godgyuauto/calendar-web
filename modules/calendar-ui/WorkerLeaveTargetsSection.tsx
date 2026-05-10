"use client";

import type { Dispatch, SetStateAction } from "react";
import type { CalendarSubjectMember } from "@/modules/calendar-ui/calendar-subject-types";
import type { StructuredOverrideFormState } from "@/modules/calendar-ui/structured-override";
import { normalizeLeaveDeduction } from "@/modules/leave/annual-leave-deduction";
import { isKoreanPublicHoliday } from "@/modules/leave/korean-public-holidays";
import { Chip, SectionLabel } from "@/modules/ui/components";

interface WorkerLeaveTargetsSectionProps {
  form: StructuredOverrideFormState;
  setForm: Dispatch<SetStateAction<StructuredOverrideFormState>>;
  members: CalendarSubjectMember[];
}

const HOURLY_OPTIONS = [1, 2, 3, 5, 6, 7];

function setWorkerDeduction(userId: string, hours: number) {
  const deduction = normalizeLeaveDeduction(hours);
  return (current: StructuredOverrideFormState): StructuredOverrideFormState => {
    const currentTargets = current.leaveTargets ?? [];
    const existing = currentTargets.find((target) => target.user_id === userId);
    const nextTarget = {
      user_id: userId,
      deduction_hours: deduction.hours,
      deduction_label: deduction.label,
      exempt_from_deduction: existing?.exempt_from_deduction ?? false,
    };
    return {
      ...current,
      leaveTargets: [
        ...currentTargets.filter((target) => target.user_id !== userId),
        nextTarget,
      ],
    };
  };
}

function clearWorkerDeduction(userId: string) {
  return (current: StructuredOverrideFormState): StructuredOverrideFormState => ({
    ...current,
    leaveTargets: (current.leaveTargets ?? []).filter((target) => target.user_id !== userId),
  });
}

function setWorkerExempt(userId: string, checked: boolean) {
  return (current: StructuredOverrideFormState): StructuredOverrideFormState => ({
    ...current,
    leaveTargets: (current.leaveTargets ?? []).map((target) =>
      target.user_id === userId
        ? { ...target, exempt_from_deduction: checked }
        : target,
    ),
  });
}

export function WorkerLeaveTargetsSection({
  form,
  setForm,
  members,
}: WorkerLeaveTargetsSectionProps) {
  const workers = members.filter((member) => member.working);
  if (workers.length === 0) {
    return null;
  }

  const publicHoliday = isKoreanPublicHoliday(form.startDate);

  return (
    <>
      <SectionLabel className="px-0">근무자별 연차 반영</SectionLabel>
      <div className="space-y-2">
        {workers.map((member) => {
          const target = (form.leaveTargets ?? []).find(
            (candidate) => candidate.user_id === member.userId,
          );
          const hours = target?.deduction_hours ?? 0;
          const exempt = publicHoliday || (target?.exempt_from_deduction ?? false);
          return (
            <div key={member.userId} className="rounded-[13px] bg-[#f7f7f9] px-3 py-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-[13px] font-semibold text-[#1a1a1a]">
                  {member.name}
                </span>
                <Chip
                  active={hours === 0}
                  onClick={() => setForm(clearWorkerDeduction(member.userId))}
                  className="!px-2 !py-1 text-[11px]"
                  variant="segment"
                >
                  반영 안 함
                </Chip>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Chip
                  active={hours === 8}
                  onClick={() => setForm(setWorkerDeduction(member.userId, 8))}
                  variant="segment"
                >
                  연차
                </Chip>
                <Chip
                  active={hours === 4}
                  onClick={() => setForm(setWorkerDeduction(member.userId, 4))}
                  variant="segment"
                >
                  반차
                </Chip>
              </div>
              <div className="mt-2 grid grid-cols-6 gap-1.5">
                {HOURLY_OPTIONS.map((option) => (
                  <Chip
                    key={option}
                    active={hours === option}
                    onClick={() => setForm(setWorkerDeduction(member.userId, option))}
                    className="!px-1 !py-2 text-[11px]"
                    variant="segment"
                  >
                    {option}h
                  </Chip>
                ))}
              </div>
              {target ? (
                <label className="mt-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={exempt}
                    disabled={publicHoliday}
                    onChange={(event) =>
                      setForm(setWorkerExempt(member.userId, event.target.checked))
                    }
                    className="h-4 w-4 accent-[#007AFF]"
                  />
                  <span className="text-[12px] font-semibold text-[#6e6e73]">
                    {publicHoliday ? "공휴일이라 차감 없음" : "회사 휴일로 차감 없음"}
                  </span>
                </label>
              ) : null}
            </div>
          );
        })}
      </div>
    </>
  );
}
