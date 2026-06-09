"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { apiFetch } from "@/lib/api/fetcher";
import type { AchievementCatalogEntry } from "@/types/achievement";

export interface EarnedAchievement extends AchievementCatalogEntry {
  earnedAt: string;
  seen: boolean;
}

export interface AchievementsData {
  earned: EarnedAchievement[];
  locked: AchievementCatalogEntry[];
  earnedCount: number;
  total: number;
}

export function useAchievements() {
  const { status } = useSession();
  return useQuery<AchievementsData>({
    queryKey: ["achievements"],
    queryFn: () => apiFetch("/api/achievements"),
    enabled: status === "authenticated",
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  });
}

export function useMarkAchievementsSeen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (achievementIds: string[]) =>
      apiFetch("/api/achievements/seen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ achievementIds }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["achievements"] });
    },
  });
}
