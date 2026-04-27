import { DEFAULT_FAMILY_ID, DEFAULT_USER_ID } from "@/modules/family/domain/constants";
import { ensureStore } from "@/modules/family/domain/store-state";
import type { CreateShiftOverrideInput } from "@/modules/family/domain/types";
import { isISODateKey } from "@/modules/family/domain/validators";
import type { ShiftOverride } from "@/modules/shift";

export function listShiftOverrides(input?: {
  familyId?: string;
  year?: number;
  month?: number;
}): ShiftOverride[] {
  const store = ensureStore();
  const familyId = input?.familyId ?? DEFAULT_FAMILY_ID;
  const base = store.overrides.filter((override) => override.familyId === familyId);

  if (!input?.year || !input?.month) {
    return base;
  }

  const monthPrefix = `${input.year}-${String(input.month).padStart(2, "0")}-`;
  return base.filter((override) => override.date.startsWith(monthPrefix));
}

export function createShiftOverride(input: CreateShiftOverrideInput): ShiftOverride {
  if (!isISODateKey(input.date)) {
    throw new Error("date must be in YYYY-MM-DD format.");
  }

  const store = ensureStore();
  const override = {
    id: crypto.randomUUID(),
    familyId: input.familyId ?? DEFAULT_FAMILY_ID,
    userId: input.userId ?? DEFAULT_USER_ID,
    date: input.date,
    overrideType: input.overrideType,
    overrideShift: input.overrideShift,
    label: input.label.trim(),
    startTime: input.startTime,
    endTime: input.endTime,
    note: input.note,
    createdAt: new Date().toISOString(),
  };

  store.overrides.push(override);
  return override;
}

export function removeShiftOverride(input: { id: string; familyId?: string }): boolean {
  const store = ensureStore();
  const familyId = input.familyId ?? DEFAULT_FAMILY_ID;
  const before = store.overrides.length;
  store.overrides = store.overrides.filter(
    (override) => !(override.id === input.id && override.familyId === familyId),
  );

  return store.overrides.length < before;
}
