"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import type { TeamSummary } from "@/domains/teams/types/teams.types";

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Sahip",
  COACH: "Koç",
  PLAYER: "Oyuncu",
};

async function fetchMyTeams(): Promise<TeamSummary[]> {
  const res = await fetch("/api/teams");
  if (!res.ok) throw new Error("Takımlar yüklenemedi");
  const body = await res.json() as { data: TeamSummary[] };
  return body.data;
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
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <Users className="h-12 w-12 text-text-muted/40" />
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
          {teams.map((team) => (
            <Link
              key={team.id}
              href={`/teams/${team.id}`}
              className="flex items-center gap-4 rounded-xl border border-border bg-surface px-5 py-4 transition-colors hover:bg-surface-2/60"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-lg font-bold text-accent">
                {team.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate font-semibold text-text">{team.name}</p>
                <p className="text-xs text-text-muted">{team.memberCount} üye</p>
              </div>
              <Badge variant={team.myRole === "OWNER" ? "default" : "secondary"} className="shrink-0">
                {ROLE_LABELS[team.myRole] ?? team.myRole}
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
