"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PendingInvite } from "@/domains/teams/types/teams.types";

async function fetchInvites(teamId: string): Promise<PendingInvite[]> {
  const res = await fetch(`/api/teams/${teamId}/invites`);
  if (!res.ok) throw new Error("Failed to load invites");
  const body = await res.json() as { data: PendingInvite[] };
  return body.data;
}

async function cancelInvite(teamId: string, inviteId: string): Promise<void> {
  const res = await fetch(`/api/teams/${teamId}/invites/${inviteId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to cancel invite");
}

export function usePendingInvites(teamId: string) {
  return useQuery({
    queryKey: ["team-invites", teamId],
    queryFn: () => fetchInvites(teamId),
    staleTime: 30_000,
  });
}

export function useCancelInvite(teamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (inviteId: string) => cancelInvite(teamId, inviteId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["team-invites", teamId] });
      void qc.invalidateQueries({ queryKey: ["team-dashboard", teamId] });
    },
  });
}
