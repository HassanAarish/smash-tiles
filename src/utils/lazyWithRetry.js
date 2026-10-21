import { lazy } from "react";
import { isOnline, waitForOnline } from "./network";

// ==============================
// lazyRoute: React.lazy that survives a dropped connection
// ------------------------------
// Every page is code-split, so a navigation first has to fetch a JS chunk. With a plain
// `lazy()`, a failed fetch becomes a render error, and React also caches the rejected
// promise, so it keeps failing even after the connection is back.
//
// This wrapper:
//   1. While offline, waits for the `online` event and loads the chunk then (the route
//      keeps showing its fallback in the meantime).
//   2. While online, retries a few times with backoff, then once more against a
//      cache-busted URL before letting the error reach the ErrorBoundary.
//
// The cache-busted retry matters because browsers remember a failed dynamic import per
// document; importing the chunk URL with a unique query creates a fresh module-map entry.
//
// In the Android (Capacitor) build chunks are bundled locally, so this mainly protects the
// web version.
// ==============================

const MAX_ONLINE_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 500;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Browsers and Vite name the module they couldn't fetch in the error message.
const chunkUrlFromError = (error) => {
  const match = /https?:\/\/[^\s'")]+/.exec(error?.message || "");
  return match?.[0] || null;
};

// Last resort: import the same file under a URL the module map has never seen.
// Returns null (rather than throwing) so the caller can surface the original error.
const importFreshCopy = async (error) => {
  const url = chunkUrlFromError(error);
  if (!url) return null;

  try {
    const separator = url.includes("?") ? "&" : "?";
    return await import(/* @vite-ignore */ `${url}${separator}reload=${Date.now()}`);
  } catch {
    return null;
  }
};

const loadModule = async (factory) => {
  let attempts = 0;

  while (true) {
    try {
      return await factory();
    } catch (error) {
      // Offline failures don't count against the retry budget.
      if (!isOnline()) {
        await waitForOnline();
        continue;
      }

      attempts += 1;
      if (attempts >= MAX_ONLINE_ATTEMPTS) {
        const fresh = await importFreshCopy(error);
        if (fresh) return fresh;
        throw error;
      }

      await sleep(RETRY_BASE_DELAY_MS * attempts);
    }
  }
};

/**
 * Drop-in replacement for `lazy()` for route-level pages.
 *
 *   const GamePage = lazyRoute(() => import("@/pages/Game"));
 *
 * `pick` maps a named export to the default one:
 *
 *   lazyRoute(() => import("@/pages/Settings"), (m) => m.SettingsPage)
 */
export const lazyRoute = (factory, pick) =>
  lazy(async () => {
    const module = await loadModule(factory);
    return pick ? { default: pick(module) } : module;
  });

export default lazyRoute;
