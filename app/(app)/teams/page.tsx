"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Users, Plus, Crown, Shield, Swords, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import type { TeamSummary, TeamRole } from "@/domains/teams/types/teams.types";

const ROLE_LABELS: Record<TeamRole, string> = { OWNER: "Sahip", COACH: "Koç", PLAYER: "Oyuncu" };
const ROLE_ICONS: Record<TeamRole, typeof Crown> = { OWNER: Crown, COACH: Shield, PLAYER: Swords };
const ROLE_STYLES: Record<TeamRole, string> = {
  OWNER: "text-yellow-400 border-yellow-400/40 bg-yellow-400/10",
  COACH: "text-purple-400 border-purple-400/40 bg-purple-400/10",
  PLAYER: "text-text-muted border-border bg-surface-3",
};

async function fetchMyTeams(): Promise<TeamSummary[]> {
  const res = await fetch("/api/teams");
  if (!res.ok) throw new Error("Takımlar yüklenemedi");
  const body = await res.json() as { data: TeamSummary[] };
  return body.data;
}

function TeamCard({ team }: { team: TeamSummary }) {
  const Icon = ROLE_ICONS[team.myRole] ?? Swords;
  const slotPct = Math.round((team.memberCount / 5) * 100);

  return (
    <Link
      href={`/teams/${team.id}`}
      className="group flex items-center gap-4 rounded-xl border border-border bg-surface px-5 py-4 transition-all hover:border-accent/40 hover:bg-surface-2/60"
    >
      {/* Team avatar */}
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 text-lg font-bold text-accent">
        {team.name.charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-text group-hover:text-accent transition-colors">
          {team.name}
        </p>
        <div className="mt-1.5 flex items-center gap-2">
          {/* Role badge */}
          <span className={`flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${ROLE_STYLES[team.myRole]}`}>
            <Icon className="h-2.5 w-2.5" />
            {ROLE_LABELS[team.myRole]}
          </span>
          {/* Slot mini bar */}
          <div className="flex items-center gap-1.5">
            <div className="h-1 w-16 overflow-hidden rounded-full bg-surface-3">
              <div
                className="h-full rounded-full bg-accent/60 transition-all"
                style={{ width: `${slotPct}%` }}
              />
            </div>
            <span className="text-[10px] text-text-muted">{team.memberCount}/5</span>
          </div>
        </div>
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 text-text-muted/40 group-hover:text-accent transition-colors" />
    </Link>
  );
}

export default function TeamsPage() {
  const { data: teams, isLoading, error } = useQuery({
    queryKey: ["my-teams"],
    queryFn: fetchMyTeams,
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <PageHeader
        title="Takımlarım"
        subtitle="Esports takımınızı veya koçluk akademinizi yönetin"
        action={
          <Link href="/teams/create">
            <Button size="sm">
              <Plus className="mr-1.5 h-4 w-4" />
              Yeni Takım
            </Button>
          </Link>
        }
      />

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-danger">
          {error instanceof Error ? error.message : "Hata oluştu"}
        </p>
      )}

      {!isLoading && teams?.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border py-16 text-center">
          <Users className="h-12 w-12 text-text-muted/30" />
          <div>
            <p className="font-semibold text-text">Henüz takımınız yok</p>
            <p className="mt-1 text-sm text-text-muted">
              Takım oluşturun ve oyuncularınızı davet edin
            </p>
          </div>
          <Link href="/teams/create">
            <Button>Takım Oluştur</Button>
          </Link>
        </div>
      )}

      {teams && teams.length > 0 && (
        <div className="space-y-3">
          {teams.map((team) => <TeamCard key={team.id} team={team} />)}
        </div>
      )}
    </div>
  );
}
