#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cwd, exit } from "node:process";

const root = cwd();

function readProjectFile(path) {
  return readFileSync(join(root, path), "utf8");
}

function matchVersion(label, source, pattern) {
  const match = source.match(pattern);
  if (!match) {
    throw new Error(`Missing ${label} cache version`);
  }
  return match[1];
}

function assertIncludes(file, source, fragment, reason) {
  if (!source.includes(fragment)) {
    throw new Error(`${file} is missing ${reason}: ${fragment}`);
  }
}

try {
  const cacheModule = readProjectFile("modules/pwa/cache-version.ts");
  const serviceWorker = readProjectFile("public/sw.js");
  const registration = readProjectFile("app/sw-register.tsx");
  const nextConfig = readProjectFile("next.config.ts");

  const moduleVersion = matchVersion(
    "modules/pwa/cache-version.ts",
    cacheModule,
    /PWA_CACHE_VERSION\s*=\s*"([^"]+)"/,
  );
  const serviceWorkerVersion = matchVersion(
    "public/sw.js",
    serviceWorker,
    /CACHE_VERSION\s*=\s*"([^"]+)"/,
  );

  if (moduleVersion !== serviceWorkerVersion) {
    throw new Error(
      `PWA cache version mismatch: module=${moduleVersion}, sw=${serviceWorkerVersion}`,
    );
  }

  assertIncludes("public/sw.js", serviceWorker, "await self.skipWaiting();", "install activation");
  assertIncludes("public/sw.js", serviceWorker, "await self.clients.claim();", "client claiming");
  assertIncludes(
    "app/sw-register.tsx",
    registration,
    'updateViaCache: "none"',
    "service worker cache bypass",
  );
  assertIncludes("next.config.ts", nextConfig, 'source: "/sw.js"', "service worker headers");
  assertIncludes("next.config.ts", nextConfig, "no-store", "service worker no-store cache header");

  console.log(`[verify-pwa] cache_version=${moduleVersion}`);
} catch (error) {
  console.error(`[verify-pwa] ${error instanceof Error ? error.message : String(error)}`);
  exit(1);
}
