"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Users, TrendingUp, UserPlus, TrendingDown, Minus, BarChart2, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TeamMemberCard } from "@/domains/teams/components/TeamMemberCard";
import { TeamComparisonTable } from "@/domains/teams/components/TeamComparisonTable";
import { TeamStatsPanel } from "@/domains/teams/components/TeamStatsPanel";
import { TeamLineup } from "@/domains/teams/components/TeamLineup";
import { PendingInvitesList } from "@/domains/teams/components/PendingInvitesList";
import { InviteModal } from "@/domains/teams/components/InviteModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useTeamDashboard, useRemoveTeamMember, useChangeTeamMemberRole } from "@/hooks/useTeamDashboard";

interface Props {
  teamId: string;
  isCoach: boolean;
}

export function TeamDashboard({ teamId, isCoach }: Props) {
  const [showInvite, setShowInvite] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "comparison" | "stats" | "lineup">("overview");
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useTeamDashboard(teamId);
  const removeM = useRemoveTeamMember(teamId);
  const roleM = useChangeTeamMemberRole(teamId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-28 w-full rounded-xl" />
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
      </div>
    );
  }

  if (error || !data) {
    return <p className="text-sm text-danger">{error instanceof Error ? error.message : "Dashboard could not be loaded"}</p>;
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
                ? `${slotsLeft} slot available — ${team.memberCount}/${team.maxMembers} members`
                : `Team full (${team.maxMembers}/${team.maxMembers})`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {team.avgWinRate7d !== null && WrIcon && (
              <div className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold ${team.avgWinRate7d >= 55 ? "border-success/30 bg-success/10 text-success" : team.avgWinRate7d < 45 ? "border-danger/30 bg-danger/10 text-danger" : "border-border bg-surface-2 text-text-muted"}`}>
                <WrIcon className="h-3 w-3" />
                {team.avgWinRate7d}% team 7d
              </div>
            )}
            {isCoach && slotsLeft > 0 && (
              <Button onClick={() => setShowInvite(true)} size="sm" className="gap-1.5">
                <UserPlus className="h-3.5 w-3.5" />
                Invite
              </Button>
            )}
            {isCoach && slotsLeft === 0 && (
              <span className="rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs text-text-muted">
                Team full
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
          Members
        </button>
        <button
          onClick={() => setActiveTab("comparison")}
          className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${activeTab === "comparison" ? "bg-surface text-text shadow-sm" : "text-text-muted hover:text-text"}`}
        >
          <BarChart2 className="inline mr-1.5 h-3.5 w-3.5" />
          Comparison
        </button>
        <button
          onClick={() => setActiveTab("stats")}
          className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${activeTab === "stats" ? "bg-surface text-text shadow-sm" : "text-text-muted hover:text-text"}`}
        >
          <TrendingUp className="inline mr-1.5 h-3.5 w-3.5" />
          Stats
        </button>
        <button
          onClick={() => setActiveTab("lineup")}
          className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${activeTab === "lineup" ? "bg-surface text-text shadow-sm" : "text-text-muted hover:text-text"}`}
        >
          <LayoutGrid className="inline mr-1.5 h-3.5 w-3.5" />
          Lineup
        </button>
      </div>

      {/* Member list */}
      {activeTab === "overview" && (
        members.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-14 text-center">
            <Users className="mx-auto mb-3 h-8 w-8 text-text-muted/30" />
            <p className="text-sm font-medium text-text-muted">No members yet</p>
            <p className="mt-1 text-xs text-text-muted/60">Invite players to your team</p>
            {isCoach && (
              <Button onClick={() => setShowInvite(true)} size="sm" className="mt-4 gap-1.5">
                <UserPlus className="h-3.5 w-3.5" />
                Invite First Member
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
                onRemove={(uid) => setPendingRemoveId(uid)}
                onRoleChange={isCoach ? (uid, role) => roleM.mutate({ userId: uid, role }) : undefined}
              />
            ))}
          </div>
        )
      )}

      {activeTab === "comparison" && <TeamComparisonTable teamId={teamId} />}

      {activeTab === "stats" && <TeamStatsPanel teamId={teamId} />}

      {activeTab === "lineup" && <TeamLineup teamId={teamId} members={members} canManage={isCoach} />}

      {/* Pending invites — coach only */}
      {isCoach && <PendingInvitesList teamId={teamId} />}

      {pendingRemoveId && (
        <ConfirmDialog
          title="Remove Member"
          description={`Are you sure you want to remove this member from the team?`}
          confirmLabel="Remove"
          danger
          isPending={removeM.isPending}
          onCancel={() => setPendingRemoveId(null)}
          onConfirm={() => {
            removeM.mutate(pendingRemoveId, { onSuccess: () => setPendingRemoveId(null) });
          }}
        />
      )}

      {showInvite && (
        <InviteModal
          teamId={teamId}
          onClose={() => setShowInvite(false)}
          onInvited={() => {
            void queryClient.invalidateQueries({ queryKey: ["team-dashboard", teamId] });
            void queryClient.invalidateQueries({ queryKey: ["team-invites", teamId] });
          }}
        />
      )}
    </div>
  );
}
