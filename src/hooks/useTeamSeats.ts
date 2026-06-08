import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";

interface TeamSeatsData {
  totalMembers: number;
  maxMembers: number;
  teamsCount: number;
}

export function useTeamSeats() {
  return useQuery({
    queryKey: ["team-seats"],
    queryFn: () => apiFetch<TeamSeatsData>("/api/teams/seats"),
    staleTime: 60_000,
  });
}
