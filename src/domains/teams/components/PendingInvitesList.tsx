"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Mail, X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PendingInvite } from "@/domains/teams/types/teams.types";

interface Props {
  teamId: string;
}

async function fetchInvites(teamId: string): Promise<PendingInvite[]> {
  const res = await fetch(`/api/teams/${teamId}/invites`);
  if (!res.ok) throw new Error("Davetler yüklenemedi");
  const body = await res.json() as { data: PendingInvite[] };
  return body.data;
}

async function cancelInvite(teamId: string, inviteId: string): Promise<void> {
  const res = await fetch(`/api/teams/${teamId}/invites/${inviteId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Davet iptal edilemedi");
}

const ROLE_LABELS: Record<string, string> = { COACH: "Koç", PLAYER: "Oyuncu" };

function hoursLeft(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  const hours = Math.floor(diff / 3_600_000);
  if (hours <= 0) return "süresi dolmuş";
  if (hours < 24) return `${hours}s kaldı`;
  return `${Math.floor(hours / 24)}g kaldı`;
}

export function PendingInvitesList({ teamId }: Props) {
  const queryClient = useQueryClient();

  const { data: invites, isLoading } = useQuery({
    queryKey: ["team-invites", teamId],
    queryFn: () => fetchInvites(teamId),
    staleTime: 30_000,
  });

  const cancel = useMutation({
    mutationFn: (inviteId: string) => cancelInvite(teamId, inviteId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["team-invites", teamId] });
      void queryClient.invalidateQueries({ queryKey: ["team-dashboard", teamId] });
    },
  });

  if (isLoading || !invites || invites.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-surface">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Mail className="h-3.5 w-3.5 text-text-muted" />
        <span className="text-xs font-semibold uppercase tracking-widest text-text-muted">
          Bekleyen Davetler ({invites.length})
        </span>
      </div>
      <ul className="divide-y divide-border">
        {invites.map((inv) => (
          <li key={inv.id} className="flex items-center gap-3 px-4 py-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10">
              <Mail className="h-3.5 w-3.5 text-accent" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-text">{inv.email}</p>
              <div className="flex items-center gap-1.5 text-xs text-text-muted">
                <span className="rounded-full border border-border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide">
                  {ROLE_LABELS[inv.role] ?? inv.role}
                </span>
                <Clock className="h-2.5 w-2.5" />
                <span>{hoursLeft(inv.expiresAt)}</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 shrink-0 p-0 text-text-muted hover:text-danger"
              onClick={() => cancel.mutate(inv.id)}
              disabled={cancel.isPending}
              title="Daveti iptal et"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
