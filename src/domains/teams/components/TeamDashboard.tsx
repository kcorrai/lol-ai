"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  const res = await fetch(`/api/teams/${teamId}/members/${userId}`, {
    method: "DELETE",
  });
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
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["team-dashboard", teamId] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <p className="text-sm text-danger">
        {error instanceof Error ? error.message : "Dashboard yüklenemedi"}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-text">{data.team.name}</h2>
          <p className="text-sm text-text-muted">{data.members.length} üye</p>
        </div>
        {isCoach && (
          <Button onClick={() => setShowInvite(true)} size="sm">
            + Üye Davet Et
          </Button>
        )}
      </div>

      {data.members.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-muted">
          Henüz üye yok. Takıma oyuncu davet edin.
        </p>
      ) : (
        <div className="space-y-2">
          {data.members.map((member) => (
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
          onInvited={() => {
            void queryClient.invalidateQueries({ queryKey: ["team-dashboard", teamId] });
          }}
        />
      )}
    </div>
  );
}
