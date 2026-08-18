import { useQuery } from "@tanstack/react-query";
import type { CareerTimeline } from "@/domains/analysis/services/careerTimeline.types";

async function fetchCareerTimeline(riotAccountId: string): Promise<CareerTimeline> {
  const res = await fetch(`/api/career-timeline?riotAccountId=${riotAccountId}`);
  if (!res.ok) throw new Error("Failed to fetch career timeline");
  const json = (await res.json()) as { data: CareerTimeline };
  return json.data;
}

export function useCareerTimeline(riotAccountId: string | null | undefined) {
  return useQuery({
    queryKey: ["career-timeline", riotAccountId],
    queryFn: () => fetchCareerTimeline(riotAccountId as string),
    enabled: Boolean(riotAccountId),
    // A career changes by one game at a time; refetching it on every focus is waste.
    staleTime: 5 * 60_000,
  });
}
