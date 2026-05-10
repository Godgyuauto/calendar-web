import {
  readLeaveDeductionLabel,
  readNumber,
} from "@/modules/family/domain/structured-override-note-leave";
import type {
  OverrideSubjectType,
  StructuredLeaveTarget,
} from "@/modules/family/domain/structured-override-note-types";

export interface StructuredSubjectFields {
  subject_type: OverrideSubjectType;
  subject_user_id: string | null;
  leave_targets: StructuredLeaveTarget[];
}

function readString(source: Record<string, unknown>, key: string): string | null {
  const value = source[key];
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readBoolean(source: Record<string, unknown>, key: string): boolean {
  return typeof source[key] === "boolean" ? source[key] : false;
}

function normalizeSubjectType(value: string | null): OverrideSubjectType {
  return value === "shared" ? "shared" : "member";
}

function parseLeaveTarget(value: unknown): StructuredLeaveTarget | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const source = value as Record<string, unknown>;
  const userId = readString(source, "user_id");
  const hours = readNumber(source, ["deduction_hours"]);
  const label = readLeaveDeductionLabel(readString(source, "deduction_label"));
  if (!userId || !hours || hours < 1 || hours > 8 || !label) {
    return null;
  }
  return {
    user_id: userId,
    deduction_hours: hours,
    deduction_label: label,
    exempt_from_deduction: readBoolean(source, "exempt_from_deduction"),
  };
}

export function parseStructuredSubjectFields(
  source: Record<string, unknown>,
): StructuredSubjectFields {
  const rawTargets = Array.isArray(source.leave_targets) ? source.leave_targets : [];
  return {
    subject_type: normalizeSubjectType(readString(source, "subject_type")),
    subject_user_id: readString(source, "subject_user_id"),
    leave_targets: rawTargets.flatMap((target) => {
      const parsed = parseLeaveTarget(target);
      return parsed ? [parsed] : [];
    }),
  };
}
