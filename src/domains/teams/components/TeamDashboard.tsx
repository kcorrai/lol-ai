"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, TrendingUp, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TeamMemberCard } from "@/domains/teams/components/TeamMemberCard";
import { InviteModal } from "@/domains/teams/components/InviteModal";
import type { TeamDashboardData } from "@/domains/teams/types/teams.types";

interface Props {
  teamId: string;
  isCoach: boolean;
}

async function fetchDashboard(teamId: string): Promise<TeamDashboardData> {
  const res = await fetch(`/api/teams/${teamId}/dashboard`);
  if (!res.ok) throw new Error("Dashboard yüklenemedi");
  const body = await res.json() as { data: TeamDashboardData };
  return body.data;
}

async function removeMember(teamId: string, userId: string): Promise<void> {
  const res = await fetch(`/api/teams/${teamId}/members/${userId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Üye çıkarılamadı");
}

export function TeamDashboard({ teamId, isCoach }: Props) {
  const queryClient = useQueryClient();
  const [showInvite, setShowInvite] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["team-dashboard", teamId],
    queryFn: () => fetchDashboard(teamId),
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => removeMember(teamId, userId),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ["team-dashboard", teamId] }); },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full rounded-xl" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return <p className="text-sm text-danger">{error instanceof Error ? error.message : "Dashboard yüklenemedi"}</p>;
  }

  const { team, members } = data;
  const slotsLeft = team.maxMembers - team.memberCount;

  return (
    <div className="space-y-4">
      {/* Header stats */}
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-border bg-surface p-4">
        <div>
          <h2 className="font-display text-xl font-bold text-text">{team.name}</h2>
          <div className="mt-1 flex items-center gap-3 text-xs text-text-muted">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {team.memberCount}/{team.maxMembers} üye
              {slotsLeft > 0 && <span className="ml-1 text-accent">({slotsLeft} slot açık)</span>}
            </span>
            {team.avgWinRate7d !== null && (
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Takım 7g KO: <span className={team.avgWinRate7d >= 55 ? "text-success font-semibold" : team.avgWinRate7d < 45 ? "text-danger font-semibold" : "text-text font-semibold"}>
                  %{team.avgWinRate7d}
                </span>
              </span>
            )}
          </div>
        </div>
        {isCoach && slotsLeft > 0 && (
          <Button onClick={() => setShowInvite(true)} size="sm" className="gap-1.5">
            <UserPlus className="h-3.5 w-3.5" />
            Üye Davet Et
          </Button>
        )}
        {isCoach && slotsLeft === 0 && (
          <span className="rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs text-text-muted">
            Takım dolu (5/5)
          </span>
        )}
      </div>

      {/* Member list */}
      {members.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-12 text-center">
          <Users className="mx-auto mb-3 h-8 w-8 text-text-muted/30" />
          <p className="text-sm font-medium text-text-muted">Henüz üye yok</p>
          <p className="mt-1 text-xs text-text-muted/60">Takımına oyuncu davet et</p>
          {isCoach && (
            <Button onClick={() => setShowInvite(true)} size="sm" className="mt-4 gap-1.5">
              <UserPlus className="h-3.5 w-3.5" />
              İlk Üyeyi Davet Et
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {members.map((member) => (
            <TeamMemberCard
              key={member.userId}
              member={member}
              canManage={isCoach}
              onRemove={(userId) => removeMutation.mutate(userId)}
            />
          ))}
        </div>
      )}

      {showInvite && (
        <InviteModal
          teamId={teamId}
          onClose={() => setShowInvite(false)}
          onInvited={() => { void queryClient.invalidateQueries({ queryKey: ["team-dashboard", teamId] }); }}
        />
      )}
    </div>
  );
}
