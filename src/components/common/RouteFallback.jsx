import { WifiOff } from "lucide-react";
import useOnlineStatus from "@/hooks/useOnlineStatus";

/**
 * Shown while a page's code is still downloading. Normally that's a split second; offline
 * it lasts until the connection returns, so it explains itself instead of spinning forever.
 * No retry button is needed: `lazyRoute` loads the page by itself once back online.
 */
const RouteFallback = () => {
  const online = useOnlineStatus();

  return (
    <div
      role="status"
      aria-live="polite"
      className="h-dvh flex flex-col items-center justify-center gap-4 px-4 text-center text-white bg-linear-to-br from-purple-900 via-blue-900 to-indigo-900"
    >
      {online ? (
        <>
          <span
            aria-hidden="true"
            className="w-12 h-12 rounded-full border-4 border-white/20 border-t-pink-500 animate-spin"
          />
          <span className="sr-only">Loading…</span>
        </>
      ) : (
        <>
          <span
            aria-hidden="true"
            className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/15 text-red-400"
          >
            <WifiOff size={30} strokeWidth={1.75} />
          </span>
          <h2 className="text-2xl font-semibold">Waiting for connection</h2>
          <p className="max-w-sm text-gray-300">
            This screen will open by itself as soon as you're back online.
          </p>
        </>
      )}
    </div>
  );
};

export default RouteFallback;
