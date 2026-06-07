import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import type { MonthlyMilestone } from "@/domains/analysis/services/milestoneService";

export function useMilestone(year: number, month: number) {
  return useQuery({
    queryKey: ["milestone", year, month],
    queryFn: () =>
      apiFetch<MonthlyMilestone | null>(`/api/milestone?year=${year}&month=${month}`),
    staleTime: 10 * 60 * 1000,
  });
}
