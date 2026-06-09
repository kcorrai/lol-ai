import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

interface InviteLinkData {
  token: string;
  expiresAt: string;
}

async function fetchInviteLink(teamId: string): Promise<InviteLinkData> {
  const res = await fetch(`/api/teams/${teamId}/invite-link`);
  if (!res.ok) throw new Error("Failed to fetch invite link");
  const body = (await res.json()) as { data: InviteLinkData };
  return body.data;
}

async function revokeInviteLink(teamId: string): Promise<void> {
  const res = await fetch(`/api/teams/${teamId}/invite-link`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to revoke invite link");
}

export function useInviteLink(teamId: string) {
  const { status } = useSession();
  return useQuery<InviteLinkData>({
    queryKey: ["invite-link", teamId],
    queryFn: () => fetchInviteLink(teamId),
    enabled: status === "authenticated" && !!teamId,
    staleTime: 5 * 60_000,
  });
}

export function useRevokeInviteLink(teamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => revokeInviteLink(teamId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["invite-link", teamId] }),
  });
}
