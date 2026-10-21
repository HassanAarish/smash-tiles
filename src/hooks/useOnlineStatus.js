import { useSyncExternalStore } from "react";
import { isOnline } from "@/utils/network";

// The browser's own connectivity events are the store: no polling, and every reader
// re-renders on the same tick.
const subscribe = (onStoreChange) => {
  window.addEventListener("online", onStoreChange);
  window.addEventListener("offline", onStoreChange);
  return () => {
    window.removeEventListener("online", onStoreChange);
    window.removeEventListener("offline", onStoreChange);
  };
};

/**
 * Whether the browser currently has a network connection. Use it to explain a failure,
 * not to predict success (see `@/utils/network`).
 */
export const useOnlineStatus = () => useSyncExternalStore(subscribe, isOnline, () => true);

export default useOnlineStatus;
