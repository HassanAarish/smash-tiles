import { Component, useEffect } from "react";
import { House, RotateCcw, TriangleAlert, WifiOff } from "lucide-react";
import { isChunkLoadError, isOnline } from "@/utils/network";

/**
 * Last line of defence against a white screen. Without a boundary, React unmounts the whole
 * tree when a render throws, so a page chunk that failed to download (or a render bug)
 * would leave a blank, unrecoverable app.
 *
 * Two kinds of failure land here:
 *   · a code-split page that never downloaded: the browser remembers the failed fetch for
 *     the life of the document, so "Try again" reloads, and coming back online reloads on
 *     its own.
 *   · anything else (a real bug): reloading would hit it again, so the boundary resets in
 *     place and the player can go back home.
 */

// Reloads by itself when the connection returns (bound to the browser event, so it fires
// once, on the transition back).
const ChunkRecovery = ({ onRecover }) => {
  useEffect(() => {
    window.addEventListener("online", onRecover);
    return () => window.removeEventListener("online", onRecover);
  }, [onRecover]);

  return null;
};

class ErrorBoundary extends Component {
  state = { error: null, offlineAtFailure: false };

  static getDerivedStateFromError(error) {
    // Captured here (not in componentDidCatch) so the first fallback render already knows
    // whether the player was offline.
    return { error, offlineAtFailure: !isOnline() };
  }

  componentDidCatch(error, info) {
    // No crash reporting yet (Crashlytics comes with the Firebase phase).
    console.error("Unhandled UI error:", error, info?.componentStack);
  }

  reset = () => this.setState({ error: null, offlineAtFailure: false });

  reload = () => window.location.reload();

  // HashRouter: home is "#/".
  goHome = () => {
    window.location.hash = "/";
    this.reset();
  };

  render() {
    const { error, offlineAtFailure } = this.state;
    if (!error) return this.props.children;

    const isChunkError = isChunkLoadError(error);
    // Only auto-recover from a download that failed because the network was gone; silently
    // reloading on a render bug would loop.
    const canAutoRecover = isChunkError && offlineAtFailure;

    return (
      <div
        role="alert"
        className="h-dvh flex flex-col items-center justify-center gap-4 px-4 text-center text-white bg-linear-to-br from-purple-900 via-blue-900 to-indigo-900"
      >
        {canAutoRecover && <ChunkRecovery onRecover={this.reload} />}
        <span
          aria-hidden="true"
          className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/15 text-red-400"
        >
          {offlineAtFailure ? (
            <WifiOff size={30} strokeWidth={1.75} />
          ) : (
            <TriangleAlert size={30} strokeWidth={1.75} />
          )}
        </span>
        <h2 className="text-2xl font-semibold">
          {offlineAtFailure ? "You're offline" : "Something went wrong"}
        </h2>
        <p className="max-w-sm text-gray-300">
          {offlineAtFailure
            ? "This screen couldn't finish loading without a connection. It will open by itself once you're back online, or you can try again now."
            : "The game stopped unexpectedly. Trying again usually fixes it. If it doesn't, head back home."}
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <button
            onClick={isChunkError ? this.reload : this.reset}
            className="inline-flex items-center gap-2 px-7 py-3 rounded-full font-semibold bg-linear-to-r from-purple-500 to-pink-500 hover:scale-105 active:scale-95 transition-all"
          >
            <RotateCcw size={18} aria-hidden="true" />
            Try again
          </button>
          <button
            onClick={this.goHome}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold bg-gray-600 hover:bg-gray-700 transition-all"
          >
            <House size={18} aria-hidden="true" />
            Home
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
