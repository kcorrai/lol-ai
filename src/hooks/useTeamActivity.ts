import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import type { TeamActivityItem } from "@/domains/teams/services/teamService";

async function fetchTeamActivity(teamId: string): Promise<TeamActivityItem[]> {
  const res = await fetch(`/api/teams/${teamId}/activity`);
  if (!res.ok) return [];
  const body = (await res.json()) as { data: { activities: TeamActivityItem[] } };
  return body.data.activities;
}

export function useTeamActivity(teamId: string) {
  const { status } = useSession();
  return useQuery<TeamActivityItem[]>({
    queryKey: ["team-activity", teamId],
    queryFn: () => fetchTeamActivity(teamId),
    enabled: status === "authenticated" && !!teamId,
    staleTime: 60_000,
  });
}
