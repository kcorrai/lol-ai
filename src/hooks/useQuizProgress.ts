import { useQuery } from "@tanstack/react-query";
import type { QuizProgress } from "@/domains/quiz/services/streakService";

/**
 * Streak and today's record. Anonymous visitors get a 401 here, which is a
 * normal state rather than an error — the quiz is fully playable without it — so
 * this resolves to null instead of throwing, and does not retry.
 */
async function fetchProgress(): Promise<QuizProgress | null> {
  const res = await fetch("/api/quiz/progress");
  if (res.status === 401) return null;
  if (!res.ok) throw new Error("Failed to load quiz progress");
  const json = (await res.json()) as { data: QuizProgress };
  return json.data;
}

export function useQuizProgress() {
  return useQuery({
    queryKey: ["quiz", "progress"],
    queryFn: fetchProgress,
    staleTime: 60_000,
    retry: false,
  });
}
