import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import type {
  LeaderboardPeriod,
  QuizLeaderboard,
} from "@/domains/quiz/services/quizLeaderboardService";

export function useQuizLeaderboard(period: LeaderboardPeriod) {
  return useQuery({
    queryKey: ["quiz", "leaderboard", period],
    queryFn: () => apiFetch<QuizLeaderboard>(`/api/quiz/leaderboard?period=${period}`),
    // The board moves as people play, but not fast enough to be worth refetching
    // on every tab switch.
    staleTime: 60_000,
  });
}
