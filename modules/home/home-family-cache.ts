import "server-only";

interface CachedEntry<T> {
  value: T;
  expiresAtMs: number;
}

const HOME_FAMILY_MODEL_TTL_MS = 5_000;
const HOME_FAMILY_MODEL_MAX_ENTRIES = 256;

declare global {
  var __homeFamilyReadModelCache: Map<string, CachedEntry<unknown>> | undefined;
}

function getHomeFamilyCache(): Map<string, CachedEntry<unknown>> {
  if (!globalThis.__homeFamilyReadModelCache) {
    globalThis.__homeFamilyReadModelCache = new Map<string, CachedEntry<unknown>>();
  }
  return globalThis.__homeFamilyReadModelCache;
}

export function readHomeFamilyCache<T>(cacheKey: string, nowMs: number): T | null {
  const cache = getHomeFamilyCache();
  const entry = cache.get(cacheKey);
  if (!entry) {
    return null;
  }
  if (entry.expiresAtMs <= nowMs) {
    cache.delete(cacheKey);
    return null;
  }
  return entry.value as T;
}

export function writeHomeFamilyCache<T>(cacheKey: string, value: T, nowMs: number): void {
  const cache = getHomeFamilyCache();
  for (const [key, entry] of cache.entries()) {
    if (entry.expiresAtMs <= nowMs) {
      cache.delete(key);
    }
  }
  cache.set(cacheKey, { value, expiresAtMs: nowMs + HOME_FAMILY_MODEL_TTL_MS });
  while (cache.size > HOME_FAMILY_MODEL_MAX_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey === undefined) {
      break;
    }
    cache.delete(oldestKey);
  }
}

export function invalidateHomeFamilyCacheForFamily(familyId: string): void {
  const cache = getHomeFamilyCache();
  const familyPrefix = `${familyId}:`;

  for (const key of cache.keys()) {
    if (key.startsWith(familyPrefix)) {
      cache.delete(key);
    }
  }
}
