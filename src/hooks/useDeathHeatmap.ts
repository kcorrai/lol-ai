"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import type { HeatmapData } from "@/domains/analysis/services/heatmapService";

export function useDeathHeatmap(
  riotAccountId: string | null | undefined,
  options: { champion?: string; timeRange?: string; matchCount?: number } = {}
) {
  const params = new URLSearchParams({ riotAccountId: riotAccountId ?? "" });
  if (options.champion) params.set("champion", options.champion);
  if (options.timeRange) params.set("timeRange", options.timeRange);
  if (options.matchCount) params.set("matchCount", String(options.matchCount));

  return useQuery<HeatmapData>({
    queryKey: ["heatmap", riotAccountId, options.champion, options.timeRange, options.matchCount],
    queryFn: () => apiFetch(`/api/analysis/heatmap?${params.toString()}`),
    enabled: !!riotAccountId,
    staleTime: 10 * 60_000,
    refetchInterval: (query) => {
      // Poll every 30s until data arrives (Inngest is processing in background)
      const data = query.state.data;
      return data && !data.hasData ? 30_000 : false;
    },
  });
}
