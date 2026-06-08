"use client";

import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TeamMemberSummary } from "@/domains/teams/types/teams.types";

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Sahip",
  COACH: "Koç",
  PLAYER: "Oyuncu",
};

const ROLE_STYLES: Record<string, string> = {
  OWNER: "border-yellow-400/40 bg-yellow-400/10 text-yellow-300",
  COACH: "border-purple-400/40 bg-purple-400/10 text-purple-300",
  PLAYER: "border-border bg-surface-2 text-text-muted",
};

const TIER_COLORS: Record<string, string> = {
  IRON: "#4a4a5a", BRONZE: "#a05336", SILVER: "#a8b8c8",
  GOLD: "#c89b3c", PLATINUM: "#3cba8c", EMERALD: "#00be93",
  DIAMOND: "#576bce", MASTER: "#9e4fc6", GRANDMASTER: "#e84057", CHALLENGER: "#f4c874",
};

const TIER_SHORT: Record<string, string> = {
  IRON: "D", BRONZE: "B", SILVER: "G", GOLD: "A",
  PLATINUM: "P", EMERALD: "Z", DIAMOND: "E",
  MASTER: "U", GRANDMASTER: "BU", CHALLENGER: "CH",
};

const CHAMPION_VERSION = "14.24.1";

interface Props {
  member: TeamMemberSummary;
  canManage: boolean;
  onRemove: (userId: string) => void;
}

export function TeamMemberCard({ member, canManage, onRemove }: Props) {
  const tierColor = member.rank ? (TIER_COLORS[member.rank.tier] ?? "#a5b4fc") : null;
  const rankLabel = member.rank
    ? `${TIER_SHORT[member.rank.tier] ?? member.rank.tier} ${member.rank.division} · ${member.rank.lp} LP`
    : null;

  const wrColor =
    member.winRate7d === null ? "text-text-muted"
    : member.winRate7d >= 55 ? "text-success"
    : member.winRate7d < 45 ? "text-danger"
    : "text-text-muted";

  const wrTrend =
    member.winRate7d === null ? null
    : member.winRate7d >= 55 ? "↑"
    : member.winRate7d < 45 ? "↓"
    : "→";

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 transition-colors hover:bg-surface-2/50">
      {/* Avatar */}
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold text-text-muted"
        style={{ borderColor: tierColor ?? "#3f3f4e", background: `${tierColor ?? "#3f3f4e"}18` }}
      >
        {member.gameName.charAt(0).toUpperCase()}
      </div>

      {/* Main info */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="truncate text-sm font-semibold text-text">
            {member.gameName}
            <span className="ml-1 text-xs font-normal text-text-muted">#{member.tagLine}</span>
          </p>
          <span className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${ROLE_STYLES[member.role] ?? ROLE_STYLES.PLAYER}`}>
            {ROLE_LABELS[member.role] ?? member.role}
          </span>
        </div>

        <div className="mt-0.5 flex flex-wrap items-center gap-2.5 text-xs">
          {rankLabel && (
            <span className="font-medium" style={{ color: tierColor ?? "#a5b4fc" }}>
              {rankLabel}
            </span>
          )}
          {member.winRate7d !== null && (
            <span className={`font-medium ${wrColor}`}>
              {wrTrend} %{member.winRate7d} (7g)
            </span>
          )}
        </div>
      </div>

      {/* Right side */}
      <div className="flex shrink-0 items-center gap-2">
        {/* Top champion */}
        {member.topChampion && (
          <div title={`En çok: ${member.topChampion}`}>
            <Image
              src={`https://ddragon.leagueoflegends.com/cdn/${CHAMPION_VERSION}/img/champion/${member.topChampion}.png`}
              alt={member.topChampion}
              width={28}
              height={28}
              unoptimized
              className="rounded border border-white/10 opacity-80"
            />
          </div>
        )}

        {/* Last match champion + result */}
        {member.lastMatchChampion && member.lastMatchChampion !== member.topChampion && (
          <div className="relative" title={`Son maç: ${member.lastMatchChampion}`}>
            <Image
              src={`https://ddragon.leagueoflegends.com/cdn/${CHAMPION_VERSION}/img/champion/${member.lastMatchChampion}.png`}
              alt={member.lastMatchChampion}
              width={28}
              height={28}
              unoptimized
              className="rounded border border-white/10"
            />
            {member.lastMatchResult && (
              <span className={`absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] font-bold ${member.lastMatchResult === "WIN" ? "bg-success text-background" : "bg-danger text-background"}`}>
                {member.lastMatchResult === "WIN" ? "G" : "M"}
              </span>
            )}
          </div>
        )}

        {member.lastReportId && (
          <Link href={`/coaching/${member.lastReportId}`}>
            <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
              Rapor
            </Button>
          </Link>
        )}

        {canManage && member.role !== "OWNER" && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-danger hover:text-danger"
            onClick={() => onRemove(member.userId)}
          >
            Çıkar
          </Button>
        )}
      </div>
    </div>
  );
}
