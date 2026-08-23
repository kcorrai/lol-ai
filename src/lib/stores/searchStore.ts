import { create } from "zustand";
import { persist } from "zustand/middleware";

/** A player the visitor has looked at or starred. Enough to render a row and build a URL. */
export interface SavedPlayer {
  gameName: string;
  tagLine: string;
  region: string;
  profileIconId?: number | null;
}

/** Past this the recent list stops being a shortcut and starts being a second search problem. */
const MAX_RECENT = 6;

/** Identity of a player across stores. Region included: the same Riot ID can exist on two. */
export function playerKey(p: SavedPlayer): string {
  return `${p.region}:${p.gameName}#${p.tagLine}`.toLowerCase();
}

interface SearchStore {
  recent: SavedPlayer[];
  favorites: SavedPlayer[];
  addRecent: (p: SavedPlayer) => void;
  clearRecent: () => void;
  toggleFavorite: (p: SavedPlayer) => void;
}

/**
 * Recent searches and favourites.
 *
 * Client-only state that belongs to the browser rather than to an account — a signed-out visitor
 * gets the same shortcuts as a signed-in one, which is the whole premise of the no-login flow.
 * Server state stays in TanStack Query.
 */
export const useSearchStore = create<SearchStore>()(
  persist(
    (set) => ({
      recent: [],
      favorites: [],

      addRecent: (p) =>
        set((state) => ({
          // Re-visiting a player moves them to the top rather than duplicating the row.
          recent: [p, ...state.recent.filter((r) => playerKey(r) !== playerKey(p))].slice(
            0,
            MAX_RECENT
          ),
        })),

      clearRecent: () => set({ recent: [] }),

      toggleFavorite: (p) =>
        set((state) => {
          const key = playerKey(p);
          const without = state.favorites.filter((f) => playerKey(f) !== key);
          return {
            favorites: without.length === state.favorites.length ? [p, ...without] : without,
          };
        }),
    }),
    {
      name: "lol-ai-search",
      // Matches uiStore: hydrating during render would mismatch the server-rendered markup, so
      // consumers call `useSearchStore.persist.rehydrate()` from a mount effect instead.
      skipHydration: true,
      partialize: (state) => ({ recent: state.recent, favorites: state.favorites }),
    }
  )
);
