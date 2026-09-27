import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * How a viewer likes the esports section: whether results are hidden until
 * they ask, and which time zone kickoffs are shown in.
 *
 * Client-only UI state, so zustand rather than React Query. The storage key is
 * also read by the pre-paint script in the esports layout, which has to know
 * about spoiler mode before React has loaded anything.
 */
export const ESPORTS_PREFS_KEY = "lol-ai-esports-prefs";

interface EsportsPrefsStore {
  hideScores: boolean;
  /** An IANA zone such as "Europe/Istanbul", or null for the browser's own. */
  timeZone: string | null;
  setHideScores: (hide: boolean) => void;
  setTimeZone: (zone: string | null) => void;
}

export const useEsportsPrefsStore = create<EsportsPrefsStore>()(
  persist(
    (set) => ({
      hideScores: false,
      timeZone: null,
      setHideScores: (hide) => set({ hideScores: hide }),
      setTimeZone: (zone) => set({ timeZone: zone }),
    }),
    {
      name: ESPORTS_PREFS_KEY,
      // Rehydrated by EsportsViewerSettings after mount, so the first client
      // render matches the server's and nothing hydrates as a mismatch.
      skipHydration: true,
      partialize: (state) => ({ hideScores: state.hideScores, timeZone: state.timeZone }),
    }
  )
);
