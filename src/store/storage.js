// ==============================
// Device storage adapter
// ------------------------------
// Where persisted stores are saved. localStorage on the web for now. In the Android
// phase this becomes Capacitor Preferences, which is async: zustand's `persist`
// accepts async storage, but hydration then finishes after the first render, so
// screens must wait for `usePlayerStore.persist.hasHydrated()` before trusting state.
//
// Every call is wrapped because storage can throw (private mode, quota, blocked
// site data). The game must keep working without it, just without saving.
// ==============================

export const deviceStorage = {
  getItem: (name) => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value);
    } catch {
      // Not saved this time; the in-memory state is still correct.
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {
      // Nothing to clean up.
    }
  },
};
