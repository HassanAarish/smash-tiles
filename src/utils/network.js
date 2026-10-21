// ==============================
// Network / connectivity helpers
// ------------------------------
// One place for "is there a connection?" so the lazy-route loader, the route
// fallback and the error boundary all answer it the same way.
// ==============================

/**
 * `navigator.onLine` is only trustworthy when it says false. `true` means a network
 * interface exists, not that the server is reachable, so it is used to detect being
 * offline and never to claim being online.
 */
export const isOnline = () => typeof navigator === "undefined" || navigator.onLine !== false;

/**
 * Resolves as soon as the browser reports a connection again (immediately when already
 * online). Without a `timeout` (ms) it waits indefinitely, which is what a suspended route
 * wants: keep showing its loader instead of failing.
 */
export const waitForOnline = ({ timeout } = {}) =>
  new Promise((resolve) => {
    if (isOnline()) {
      resolve(true);
      return;
    }

    let timer;
    const settle = (result) => {
      window.removeEventListener("online", onOnline);
      if (timer) clearTimeout(timer);
      resolve(result);
    };
    const onOnline = () => settle(true);

    window.addEventListener("online", onOnline);
    if (timeout) timer = setTimeout(() => settle(false), timeout);
  });

/**
 * True for a failed dynamic `import()` (a route chunk that never downloaded). The wording
 * differs per browser and bundler, hence several phrasings.
 */
export const isChunkLoadError = (error) => {
  const message = `${error?.message || ""} ${error?.name || ""}`;
  return (
    /dynamically imported module|Loading chunk|Loading CSS chunk|Importing a module script failed|error loading dynamically imported module|ChunkLoadError/i.test(
      message,
    ) || error?.name === "ChunkLoadError"
  );
};
