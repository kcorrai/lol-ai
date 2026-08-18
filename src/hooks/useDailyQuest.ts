import { useQuery } from "@tanstack/react-query";
import type { QuestObjective } from "@/domains/analysis/services/dailyQuestService";

// The service returns `expiresAt` as a Date; it arrives here as an ISO string,
// so the wire shape is stated separately rather than reused and quietly lied about.
export interface DailyQuestResponse {
  dateKey: string;
  objectives: QuestObjective[];
  completed: boolean;
  streak: number;
  xpReward: number;
  expiresAt: string;
}

async function fetchDailyQuest(): Promise<DailyQuestResponse> {
  const res = await fetch("/api/daily-quest");
  if (!res.ok) throw new Error("Failed to fetch daily quest");
  const json = (await res.json()) as { data: DailyQuestResponse };
  return json.data;
}

export function useDailyQuest() {
  return useQuery({
    queryKey: ["daily-quest"],
    queryFn: fetchDailyQuest,
    staleTime: 60_000,
  });
}
