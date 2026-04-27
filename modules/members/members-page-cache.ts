import "server-only";
import type { MembersPageData } from "@/modules/members/members-page-data";

interface CachedMembersPageDataEntry {
  value: MembersPageData;
  expiresAtMs: number;
}

const MEMBERS_PAGE_TTL_MS = 5_000;

declare global {
  var __membersPageDataCache: Map<string, CachedMembersPageDataEntry> | undefined;
}

function getMembersPageCache(): Map<string, CachedMembersPageDataEntry> {
  if (!globalThis.__membersPageDataCache) {
    globalThis.__membersPageDataCache = new Map<string, CachedMembersPageDataEntry>();
  }
  return globalThis.__membersPageDataCache;
}

export function readCachedMembersPageData(cacheKey: string, nowMs: number): MembersPageData | null {
  const cache = getMembersPageCache();
  const entry = cache.get(cacheKey);
  if (!entry) {
    return null;
  }
  if (entry.expiresAtMs <= nowMs) {
    cache.delete(cacheKey);
    return null;
  }
  return entry.value;
}

export function writeCachedMembersPageData(
  cacheKey: string,
  value: MembersPageData,
  nowMs: number,
): void {
  getMembersPageCache().set(cacheKey, { value, expiresAtMs: nowMs + MEMBERS_PAGE_TTL_MS });
}
