import { useQuery } from "@tanstack/react-query";
import type { ChallengeWithProgress } from "@/domains/analysis/services/challengeService";

interface ChallengesResponse {
  challenges: ChallengeWithProgress[];
  xp: number;
  level: number;
  xpToNext: number;
  streak: number;
}

async function fetchChallenges(): Promise<ChallengesResponse> {
  const res = await fetch("/api/challenges");
  if (!res.ok) throw new Error("Failed to fetch challenges");
  const json = await res.json() as { data: ChallengesResponse };
  return json.data;
}

export function useChallenges() {
  return useQuery({
    queryKey: ["challenges"],
    queryFn: fetchChallenges,
    staleTime: 60_000,
  });
}
