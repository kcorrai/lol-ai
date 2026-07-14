import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import type { TeamStatsData } from "@/domains/teams/services/teamStatsService";

async function fetchTeamStats(teamId: string, range: string): Promise<TeamStatsData> {
  const res = await fetch(`/api/teams/${teamId}/stats?range=${range}`);
  if (!res.ok) throw new Error("Failed to load statistics");
  const body = (await res.json()) as { data: TeamStatsData };
  return body.data;
}

export function useTeamStats(teamId: string, range: "7d" | "30d" | "90d") {
  const { status } = useSession();
  return useQuery<TeamStatsData>({
    queryKey: ["team-stats", teamId, range],
    queryFn: () => fetchTeamStats(teamId, range),
    enabled: status === "authenticated" && !!teamId,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  });
}
