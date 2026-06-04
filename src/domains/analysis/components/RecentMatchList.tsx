"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { ItemIcon } from "@/components/ui/ItemIcon";
import { roleIconUrl } from "@/lib/ddragon";
import type { MatchPerformance } from "@/domains/analysis/types/analysis.types";

interface Props {
  matches: MatchPerformance[] | undefined;
  isLoading: boolean;
}

const ROLES = ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"] as const;
const ROLE_SHORT: Record<string, string> = {
  TOP: "Top", JUNGLE: "Jungle", MIDDLE: "Mid", BOTTOM: "ADC", UTILITY: "Support",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days === 0) return hours === 0 ? `${mins}m ago` : `${hours}h ago`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function RoleFilterBtn({
  role, active, onClick,
}: { role: string; active: boolean; onClick: () => void }) {
  const [errored, setErrored] = useState(false);
  return (
    <button
      onClick={onClick}
      title={ROLE_SHORT[role]}
      className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
        active ? "bg-accent/20 ring-1 ring-accent" : "bg-surface-2 hover:bg-surface-2/80"
      }`}
    >
      {!errored ? (
        <Image src={roleIconUrl(role)} alt={role} width={18} height={18}
          onError={() => setErrored(true)} unoptimized />
      ) : (
        <span className="text-[10px] font-bold text-text-muted">{ROLE_SHORT[role]}</span>
      )}
    </button>
  );
}

function MatchRow({ match }: { match: MatchPerformance }) {
  const kda = ((match.kills + match.assists) / Math.max(match.deaths, 1)).toFixed(2);
  const kdaColor = Number(kda) >= 4 ? "text-success" : Number(kda) >= 2 ? "text-warning" : "text-text-muted";
  return (
    <Link
      href={`/match/${match.matchDbId}`}
      className={`flex items-center gap-4 rounded-xl border px-4 py-3 transition-colors hover:bg-surface-2/60 ${
        match.won ? "border-success/20 bg-success/5" : "border-danger/20 bg-danger/5"
      }`}
    >
      <div className={`h-12 w-1 shrink-0 rounded-full ${match.won ? "bg-success" : "bg-danger"}`} />
      <ChampionIcon name={match.champion} size={48} className="shrink-0" />
      <div className="w-28 shrink-0">
        <p className="text-sm font-semibold text-text">{match.champion}</p>
        <p className="text-xs text-text-muted">{ROLE_SHORT[match.position] ?? match.position}</p>
        <Badge variant={match.won ? "success" : "destructive"} className="mt-0.5 text-[10px]">
          {match.won ? "Victory" : "Defeat"}
        </Badge>
      </div>
      <div className="w-24 shrink-0 text-center">
        <p className="text-sm font-semibold text-text">
          {match.kills}/<span className="text-danger">{match.deaths}</span>/{match.assists}
        </p>
        <p className={`text-xs font-medium ${kdaColor}`}>{kda} KDA</p>
      </div>
      <div className="hidden w-28 shrink-0 text-xs text-text-muted sm:block">
        <p>{match.csPerMinute.toFixed(1)} CS/min</p>
        <p>{match.visionScore} vision · {match.gameDurationMinutes}m</p>
        <p className="mt-0.5 text-text-muted/70">{timeAgo(match.gameStart)}</p>
      </div>
      {match.itemIds?.length > 0 && (
        <div className="hidden flex-1 flex-wrap gap-0.5 lg:flex">
          {match.itemIds.slice(0, 6).map((id, i) => <ItemIcon key={i} itemId={id} size={24} />)}
        </div>
      )}
    </Link>
  );
}

export function RecentMatchList({ matches, isLoading }: Props) {
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [champFilter, setChampFilter] = useState("");

  const champions = useMemo(() => {
    if (!matches) return [];
    return [...new Set(matches.map((m) => m.champion))].sort();
  }, [matches]);

  const filtered = useMemo(() => {
    if (!matches) return [];
    return matches.filter((m) => {
      if (roleFilter && m.position !== roleFilter) return false;
      if (champFilter && m.champion !== champFilter) return false;
      return true;
    });
  }, [matches, roleFilter, champFilter]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
      </div>
    );
  }
  if (!matches || matches.length === 0) return <p className="text-sm text-text-muted">No recent matches found.</p>;

  const activeRoles = [...new Set(matches.map((m) => m.position))];

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Role filter */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setRoleFilter(null)}
            className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
              !roleFilter ? "bg-accent/20 text-accent" : "bg-surface-2 text-text-muted hover:text-text"
            }`}
          >
            All Roles
          </button>
          {ROLES.filter((r) => activeRoles.includes(r)).map((role) => (
            <RoleFilterBtn
              key={role}
              role={role}
              active={roleFilter === role}
              onClick={() => setRoleFilter(roleFilter === role ? null : role)}
            />
          ))}
        </div>

        {/* Champion filter */}
        <select
          value={champFilter}
          onChange={(e) => setChampFilter(e.target.value)}
          className="rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-text"
        >
          <option value="">All Champions</option>
          {champions.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Result count */}
        {(roleFilter || champFilter) && (
          <span className="text-xs text-text-muted">{filtered.length} match{filtered.length !== 1 ? "es" : ""}</span>
        )}
      </div>

      {/* Match list */}
      {filtered.length === 0 ? (
        <p className="py-6 text-center text-sm text-text-muted">No matches match the selected filters.</p>
      ) : (
        filtered.slice(0, 20).map((m) => <MatchRow key={m.riotMatchId} match={m} />)
      )}
    </div>
  );
}
