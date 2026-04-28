import "server-only";
import type { FamilyAuthContext } from "./auth-context";

interface CachedAuthEntry {
  value: FamilyAuthContext;
  expiresAtMs: number;
}

const AUTH_CONTEXT_TTL_MS = 15_000;
const AUTH_CONTEXT_MAX_ENTRIES = 256;

declare global {
  var __familyAuthContextCache: Map<string, CachedAuthEntry> | undefined;
}

function getCacheMap(): Map<string, CachedAuthEntry> {
  if (!globalThis.__familyAuthContextCache) {
    globalThis.__familyAuthContextCache = new Map<string, CachedAuthEntry>();
  }
  return globalThis.__familyAuthContextCache;
}

function pruneExpiredEntries(cache: Map<string, CachedAuthEntry>, nowMs: number): void {
  for (const [key, entry] of cache.entries()) {
    if (entry.expiresAtMs <= nowMs) {
      cache.delete(key);
    }
  }
}

function enforceMaxEntries(cache: Map<string, CachedAuthEntry>): void {
  while (cache.size > AUTH_CONTEXT_MAX_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey === undefined) {
      break;
    }
    cache.delete(oldestKey);
  }
}

export function readCachedAuthContext(cacheKey: string, nowMs: number): FamilyAuthContext | null {
  const cache = getCacheMap();
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

export function writeCachedAuthContext(
  cacheKey: string,
  value: FamilyAuthContext,
  nowMs: number,
  tokenExpiresAtEpochSec: number | null,
): void {
  const cache = getCacheMap();
  pruneExpiredEntries(cache, nowMs);

  const tokenExpiryMs = tokenExpiresAtEpochSec ? tokenExpiresAtEpochSec * 1000 : Number.MAX_SAFE_INTEGER;
  const expiresAtMs = Math.min(nowMs + AUTH_CONTEXT_TTL_MS, tokenExpiryMs);

  cache.set(cacheKey, { value, expiresAtMs });
  enforceMaxEntries(cache);
}
