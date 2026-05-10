import type {
  OverrideSubjectType,
  StructuredLeaveTarget,
} from "@/modules/family/domain/structured-override-note-types";
import { normalizeLeaveDeduction } from "@/modules/leave/annual-leave-deduction";
import type { StructuredOverrideFormState } from "@/modules/calendar-ui/structured-override-types";

export function normalizeSubjectType(
  value: OverrideSubjectType | undefined,
): OverrideSubjectType {
  return value === "shared" ? "shared" : "member";
}

function buildLeaveTarget(input: {
  userId: string;
  hours: number;
  exempt: boolean;
}): StructuredLeaveTarget {
  const deduction = normalizeLeaveDeduction(input.hours);
  return {
    user_id: input.userId,
    deduction_hours: deduction.hours,
    deduction_label: deduction.label,
    exempt_from_deduction: input.exempt,
  };
}

export function normalizeLeaveTargets(
  form: StructuredOverrideFormState,
  input: {
    subjectType: OverrideSubjectType;
    subjectUserId: string | null;
    leaveExempt: boolean;
  },
): StructuredLeaveTarget[] {
  if (form.eventType !== "vacation") {
    return [];
  }
  if (input.subjectType === "shared") {
    return (form.leaveTargets ?? []).map((target) =>
      buildLeaveTarget({
        userId: target.user_id,
        hours: target.deduction_hours,
        exempt: input.leaveExempt || target.exempt_from_deduction,
      }),
    );
  }
  if (!input.subjectUserId) {
    return [];
  }
  return [
    buildLeaveTarget({
      userId: input.subjectUserId,
      hours: form.leaveDeductionHours ?? 8,
      exempt: input.leaveExempt,
    }),
  ];
}
