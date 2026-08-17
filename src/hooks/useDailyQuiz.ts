import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import type { DailyPuzzle, QuizMode } from "@/domains/quiz";

export interface DailyQuizResponse {
  puzzle: DailyPuzzle;
  champions: { id: string; name: string }[];
}

/**
 * Today's puzzle for one mode. `misses` is part of the key because the emoji
 * prompt widens with each miss — the other modes ignore it, so their query is
 * refetched only when the mode changes.
 */
export function useDailyQuiz(mode: QuizMode, misses: number, practiceSeed?: string) {
  const keyedMisses = mode === "emoji" ? misses : 0;
  const seedParam = practiceSeed ? `&seed=${encodeURIComponent(practiceSeed)}` : "";
  return useQuery({
    queryKey: ["quiz", "today", mode, keyedMisses, practiceSeed ?? "daily"],
    queryFn: () =>
      apiFetch<DailyQuizResponse>(
        `/api/quiz/today?mode=${mode}&misses=${keyedMisses}${seedParam}`
      ),
    // The puzzle is fixed for the whole UTC day, so refetching it is wasted work.
    staleTime: 15 * 60 * 1000,
  });
}
