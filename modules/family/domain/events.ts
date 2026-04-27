import { DEFAULT_FAMILY_ID, DEFAULT_USER_ID } from "@/modules/family/domain/constants";
import { ensureStore } from "@/modules/family/domain/store-state";
import type {
  CreateFamilyEventInput,
  FamilyEvent,
  UpdateFamilyEventInput,
} from "@/modules/family/domain/types";
import { validateEventWindow } from "@/modules/family/domain/validators";

export function listFamilyEvents(input?: {
  familyId?: string;
  isRoutine?: boolean;
}): FamilyEvent[] {
  const store = ensureStore();
  const familyId = input?.familyId ?? DEFAULT_FAMILY_ID;
  return store.events
    .filter((event) => event.familyId === familyId)
    .filter((event) =>
      typeof input?.isRoutine === "boolean" ? event.isRoutine === input.isRoutine : true,
    )
    .sort((left, right) => left.startTime.localeCompare(right.startTime));
}

export function createFamilyEvent(input: CreateFamilyEventInput): FamilyEvent {
  validateEventWindow(input.startTime, input.endTime);

  const store = ensureStore();
  const event: FamilyEvent = {
    id: crypto.randomUUID(),
    familyId: input.familyId ?? DEFAULT_FAMILY_ID,
    title: input.title.trim(),
    startTime: input.startTime,
    endTime: input.endTime,
    isRoutine: input.isRoutine ?? false,
    createdBy: input.createdBy ?? DEFAULT_USER_ID,
    createdAt: new Date().toISOString(),
  };

  store.events.push(event);
  return event;
}

export function updateFamilyEvent(input: UpdateFamilyEventInput): FamilyEvent {
  const store = ensureStore();
  const familyId = input.familyId ?? DEFAULT_FAMILY_ID;
  const event = store.events.find(
    (row) => row.id === input.id && row.familyId === familyId,
  );

  if (!event) {
    throw new Error("Event not found.");
  }

  const nextStartTime = input.startTime ?? event.startTime;
  const nextEndTime = input.endTime ?? event.endTime;
  validateEventWindow(nextStartTime, nextEndTime);

  if (typeof input.title === "string") {
    event.title = input.title.trim();
  }

  event.startTime = nextStartTime;
  event.endTime = nextEndTime;

  if (typeof input.isRoutine === "boolean") {
    event.isRoutine = input.isRoutine;
  }

  return event;
}

export function removeFamilyEvent(input: { id: string; familyId?: string }): boolean {
  const store = ensureStore();
  const familyId = input.familyId ?? DEFAULT_FAMILY_ID;
  const before = store.events.length;
  store.events = store.events.filter(
    (event) => !(event.id === input.id && event.familyId === familyId),
  );

  return store.events.length < before;
}
