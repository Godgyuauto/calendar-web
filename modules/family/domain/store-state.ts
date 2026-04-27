import { DEFAULT_FAMILY_ID, DEFAULT_USER_ID } from "@/modules/family/domain/constants";
import type { FamilyStoreState } from "@/modules/family/domain/types";

export function ensureStore(): FamilyStoreState {
  const globalState = globalThis as typeof globalThis & {
    __familyStore?: FamilyStoreState;
  };

  if (!globalState.__familyStore) {
    globalState.__familyStore = {
      events: [
        {
          id: crypto.randomUUID(),
          familyId: DEFAULT_FAMILY_ID,
          title: "태오 등원",
          startTime: "2026-04-19T09:00:00+09:00",
          endTime: "2026-04-19T09:20:00+09:00",
          isRoutine: true,
          createdBy: DEFAULT_USER_ID,
          createdAt: new Date().toISOString(),
        },
        {
          id: crypto.randomUUID(),
          familyId: DEFAULT_FAMILY_ID,
          title: "서윤 예방접종",
          startTime: "2026-04-22T10:30:00+09:00",
          endTime: "2026-04-22T11:20:00+09:00",
          isRoutine: false,
          createdBy: DEFAULT_USER_ID,
          createdAt: new Date().toISOString(),
        },
      ],
      overrides: [
        {
          id: crypto.randomUUID(),
          familyId: DEFAULT_FAMILY_ID,
          userId: DEFAULT_USER_ID,
          date: "2026-04-12",
          overrideType: "training",
          overrideShift: "OFF",
          label: "안전보건 교육",
          createdAt: new Date().toISOString(),
        },
      ],
    };
  }

  return globalState.__familyStore;
}
