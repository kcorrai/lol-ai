import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import type { TeamSummary } from "@/domains/teams/types/teams.types";

async function fetchMyTeams(): Promise<TeamSummary[]> {
  const res = await fetch("/api/teams");
  if (!res.ok) return [];
  const body = (await res.json()) as { data: TeamSummary[] };
  return body.data;
}

export function useTeams() {
  const { status } = useSession();
  return useQuery<TeamSummary[]>({
    queryKey: ["my-teams"],
    queryFn: fetchMyTeams,
    enabled: status === "authenticated",
    staleTime: 2 * 60_000,
    gcTime: 10 * 60_000,
  });
}
