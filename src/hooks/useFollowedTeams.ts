"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { apiFetch } from "@/lib/api/fetcher";
import type { FollowedTeamEntry } from "@/domains/esports";

export interface FollowedTeamsData {
  follows: FollowedTeamEntry[];
  limit: number;
}

const KEY = ["esports", "follows"];

/**
 * The reader's followed teams (TASK-313).
 *
 * Signed out this is disabled rather than empty: a follow button on a public
 * page has to be able to tell "you follow nobody" from "we do not know who you
 * are", because only one of those two is worth showing a button for.
 */
export function useFollowedTeams() {
  const { status } = useSession();
  return useQuery<FollowedTeamsData>({
    queryKey: KEY,
    queryFn: () => apiFetch("/api/esports/follows"),
    enabled: status === "authenticated",
    staleTime: 5 * 60_000,
  });
}

export function useFollowTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) =>
      apiFetch("/api/esports/follows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUnfollowTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (teamId: string) =>
      apiFetch(`/api/esports/follows/${encodeURIComponent(teamId)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
