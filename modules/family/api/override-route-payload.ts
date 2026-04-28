import type { OverrideType, ShiftCode } from "@/modules/shift";

const ALLOWED_OVERRIDE_TYPES: OverrideType[] = [
  "vacation",
  "training",
  "swap",
  "extra",
  "sick",
  "business",
  "custom",
];

const ALLOWED_SHIFT_CODES: ShiftCode[] = ["A", "B", "C", "OFF"];

export interface OverrideMutationBody {
  date: string;
  overrideType: OverrideType;
  overrideShift: ShiftCode | null;
  label: string;
  note?: string;
  startTime?: string;
  endTime?: string;
}

export function parseOverrideMutationBody(body: unknown): OverrideMutationBody {
  const payload = body as Record<string, unknown>;
  const overrideType = payload.overrideType as OverrideType;
  const overrideShift = payload.overrideShift as ShiftCode | null;

  if (!ALLOWED_OVERRIDE_TYPES.includes(overrideType)) {
    throw new Error("overrideType is invalid.");
  }

  if (overrideShift !== null && !ALLOWED_SHIFT_CODES.includes(overrideShift)) {
    throw new Error("overrideShift must be A|B|C|OFF|null.");
  }

  return {
    date: String(payload.date ?? ""),
    overrideType,
    overrideShift,
    label: String(payload.label ?? ""),
    note: typeof payload.note === "string" ? payload.note : undefined,
    startTime: typeof payload.startTime === "string" ? payload.startTime : undefined,
    endTime: typeof payload.endTime === "string" ? payload.endTime : undefined,
  };
}
