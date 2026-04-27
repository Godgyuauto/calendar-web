import "server-only";
import type { SettingsPageData } from "@/modules/settings/settings-page-data";

interface CachedSettingsPageDataEntry {
  value: SettingsPageData;
  expiresAtMs: number;
}

const SETTINGS_PAGE_TTL_MS = 5_000;

declare global {
  var __settingsPageDataCache: Map<string, CachedSettingsPageDataEntry> | undefined;
}

function getSettingsPageCache(): Map<string, CachedSettingsPageDataEntry> {
  if (!globalThis.__settingsPageDataCache) {
    globalThis.__settingsPageDataCache = new Map<string, CachedSettingsPageDataEntry>();
  }
  return globalThis.__settingsPageDataCache;
}

export function readCachedSettingsPageData(cacheKey: string, nowMs: number): SettingsPageData | null {
  const cache = getSettingsPageCache();
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

export function writeCachedSettingsPageData(
  cacheKey: string,
  value: SettingsPageData,
  nowMs: number,
): void {
  getSettingsPageCache().set(cacheKey, { value, expiresAtMs: nowMs + SETTINGS_PAGE_TTL_MS });
}
