import { useQuery } from "@tanstack/react-query";
import type { PersonalQuiz } from "@/domains/quiz/services/personalQuizService";

/**
 * Today's personal quiz. Like useQuizProgress, a 401 is a normal state — an
 * anonymous visitor simply does not have one — so it resolves to null rather
 * than throwing, and does not retry.
 */
async function fetchPersonalQuiz(): Promise<PersonalQuiz | null> {
  const res = await fetch("/api/quiz/personal");
  if (res.status === 401) return null;
  if (!res.ok) throw new Error("Failed to load your personal quiz");
  const json = (await res.json()) as { data: PersonalQuiz };
  return json.data;
}

export function usePersonalQuiz() {
  return useQuery({
    queryKey: ["quiz", "personal"],
    queryFn: fetchPersonalQuiz,
    staleTime: 15 * 60 * 1000,
    retry: false,
  });
}
