import type { FamilyEvent } from "@/modules/family";

export function pickRoutineEventsInWindow(
  events: FamilyEvent[],
  startMs: number,
  endMs: number,
): FamilyEvent[] {
  return events
    .filter((event) => {
      if (!event.isRoutine) {
        return false;
      }
      const startMsValue = new Date(event.startTime).getTime();
      return startMsValue >= startMs && startMsValue < endMs;
    })
    .slice(0, 8);
}
