"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, TrendingUp, UserPlus, TrendingDown, Minus, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TeamMemberCard } from "@/domains/teams/components/TeamMemberCard";
import { PendingInvitesList } from "@/domains/teams/components/PendingInvitesList";
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

async function changeRole(teamId: string, userId: string, role: "COACH" | "PLAYER"): Promise<void> {
  const res = await fetch(`/api/teams/${teamId}/members/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
  if (!res.ok) throw new Error("Rol değiştirilemedi");
}

export function TeamDashboard({ teamId, isCoach }: Props) {
  const queryClient = useQueryClient();
  const [showInvite, setShowInvite] = useState(false);
  const invalidate = () => { void queryClient.invalidateQueries({ queryKey: ["team-dashboard", teamId] }); };

  const [activeTab, setActiveTab] = useState<"overview" | "comparison">("overview");

  const { data, isLoading, error } = useQuery({
    queryKey: ["team-dashboard", teamId],
    queryFn: () => fetchDashboard(teamId),
  });

  const removeM = useMutation({
    mutationFn: (userId: string) => removeMember(teamId, userId),
    onSuccess: invalidate,
  });

  const roleM = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: "COACH" | "PLAYER" }) =>
      changeRole(teamId, userId, role),
    onSuccess: invalidate,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-28 w-full rounded-xl" />
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
      </div>
    );
  }

  if (error || !data) {
    return <p className="text-sm text-danger">{error instanceof Error ? error.message : "Dashboard yüklenemedi"}</p>;
  }

  const { team, members } = data;
  const slotsLeft = team.maxMembers - team.memberCount;
  const slotPct = Math.round((team.memberCount / team.maxMembers) * 100);
  const WrIcon = team.avgWinRate7d === null ? null
    : team.avgWinRate7d >= 55 ? TrendingUp
    : team.avgWinRate7d < 45 ? TrendingDown
    : Minus;

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold text-text">{team.name}</h2>
            <p className="mt-0.5 text-xs text-text-muted">
              {slotsLeft > 0
                ? `${slotsLeft} slot açık — ${team.memberCount}/${team.maxMembers} üye`
                : `Takım tam dolu (${team.maxMembers}/${team.maxMembers})`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {team.avgWinRate7d !== null && WrIcon && (
              <div className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold ${team.avgWinRate7d >= 55 ? "border-success/30 bg-success/10 text-success" : team.avgWinRate7d < 45 ? "border-danger/30 bg-danger/10 text-danger" : "border-border bg-surface-2 text-text-muted"}`}>
                <WrIcon className="h-3 w-3" />
                %{team.avgWinRate7d} takım 7g
              </div>
            )}
            {isCoach && slotsLeft > 0 && (
              <Button onClick={() => setShowInvite(true)} size="sm" className="gap-1.5">
                <UserPlus className="h-3.5 w-3.5" />
                Davet Et
              </Button>
            )}
            {isCoach && slotsLeft === 0 && (
              <span className="rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs text-text-muted">
                Takım dolu
              </span>
            )}
          </div>
        </div>

        {/* Slot progress bar */}
        <div className="mt-3 flex items-center gap-2">
          <Users className="h-3 w-3 shrink-0 text-text-muted/60" />
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${slotPct}%` }}
            />
          </div>
          <span className="shrink-0 text-[10px] text-text-muted">{team.memberCount}/{team.maxMembers}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-surface-2 p-1 text-sm">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${activeTab === "overview" ? "bg-surface text-text shadow-sm" : "text-text-muted hover:text-text"}`}
        >
          <Users className="inline mr-1.5 h-3.5 w-3.5" />
          Üyeler
        </button>
        <button
          onClick={() => setActiveTab("comparison")}
          className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${activeTab === "comparison" ? "bg-surface text-text shadow-sm" : "text-text-muted hover:text-text"}`}
        >
          <BarChart2 className="inline mr-1.5 h-3.5 w-3.5" />
          Karşılaştırma
        </button>
      </div>

      {/* Member list */}
      {activeTab === "overview" && (
        members.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-14 text-center">
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
                onRemove={(uid) => removeM.mutate(uid)}
                onRoleChange={isCoach ? (uid, role) => roleM.mutate({ userId: uid, role }) : undefined}
              />
            ))}
          </div>
        )
      )}

      {activeTab === "comparison" && (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-[11px] text-text-muted">
                <th className="px-4 py-3 text-left">Oyuncu</th>
                <th className="px-4 py-3 text-center">Rank</th>
                <th className="px-4 py-3 text-center">7g WR</th>
                <th className="px-4 py-3 text-center">KDA</th>
                <th className="px-4 py-3 text-center">CS/dk</th>
                <th className="px-4 py-3 text-center">Vision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {members.map((m) => (
                <tr key={m.userId} className="hover:bg-surface-2/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-text">{m.gameName}</p>
                    <p className="text-[10px] text-text-muted capitalize">{m.role.toLowerCase()}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {m.rank ? (
                      <span className="text-accent font-semibold">{m.rank.tier} {m.rank.division}</span>
                    ) : <span className="text-text-muted">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {m.winRate7d !== null ? (
                      <span className={m.winRate7d >= 55 ? "text-success font-semibold" : m.winRate7d < 45 ? "text-danger" : "text-text"}>
                        %{m.winRate7d}
                      </span>
                    ) : <span className="text-text-muted">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center text-text">{m.avgKDA7d ?? "—"}</td>
                  <td className="px-4 py-3 text-center text-text">{m.avgCSPerMinute7d ?? "—"}</td>
                  <td className="px-4 py-3 text-center text-text">{m.avgVisionScore7d ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pending invites — coach only */}
      {isCoach && <PendingInvitesList teamId={teamId} />}

      {showInvite && (
        <InviteModal
          teamId={teamId}
          onClose={() => setShowInvite(false)}
          onInvited={() => {
            invalidate();
            void queryClient.invalidateQueries({ queryKey: ["team-invites", teamId] });
          }}
        />
      )}
    </div>
  );
}
