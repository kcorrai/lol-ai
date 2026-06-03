import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIStore {
  sidebarCollapsed: boolean;
  activeRiotAccountId: string | null;
  setSidebarCollapsed: (v: boolean) => void;
  setActiveRiotAccountId: (id: string) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      activeRiotAccountId: null,
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      setActiveRiotAccountId: (id) => set({ activeRiotAccountId: id }),
    }),
    {
      name: "lol-ai-ui",
      skipHydration: true,
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        activeRiotAccountId: state.activeRiotAccountId,
      }),
    }
  )
);
