import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { RankTier, RankDivision } from "@/types/common.types";

interface UIStore {
  sidebarCollapsed: boolean;
  activeRiotAccountId: string | null;
  rankGoal: { tier: RankTier; division: RankDivision } | null;
  setSidebarCollapsed: (v: boolean) => void;
  setActiveRiotAccountId: (id: string) => void;
  setRankGoal: (goal: { tier: RankTier; division: RankDivision } | null) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      activeRiotAccountId: null,
      rankGoal: null,
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      setActiveRiotAccountId: (id) => set({ activeRiotAccountId: id }),
      setRankGoal: (goal) => set({ rankGoal: goal }),
    }),
    {
      name: "lol-ai-ui",
      skipHydration: true,
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        activeRiotAccountId: state.activeRiotAccountId,
        rankGoal: state.rankGoal,
      }),
    }
  )
);
