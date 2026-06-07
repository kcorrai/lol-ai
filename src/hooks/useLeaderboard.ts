import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import type { LeaderboardEntry } from "@/domains/analysis/services/leaderboardService";

export function useLeaderboard(period: "week" | "month") {
  return useQuery({
    queryKey: ["leaderboard", period],
    queryFn: () => apiFetch<LeaderboardEntry[]>(`/api/leaderboard?period=${period}`),
    staleTime: 5 * 60 * 1000,
  });
}
