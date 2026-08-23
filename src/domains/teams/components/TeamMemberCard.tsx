"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TeamMemberSummary } from "@/domains/teams/types/teams.types";

const ROLE_LABELS: Record<string, string> = { OWNER: "Owner", COACH: "Coach", PLAYER: "Player" };
const ROLE_STYLES: Record<string, string> = {
  OWNER: "border-warning/50 bg-warning/10 text-warning",
  COACH: "border-accent/50 bg-accent/10 text-accent",
  PLAYER: "border-border bg-surface-3 text-text-muted",
};
const TIER_COLORS: Record<string, string> = {
  IRON: "#6b6b7d",
  BRONZE: "#a05336",
  SILVER: "#a8b8c8",
  GOLD: "#C6FF3D",
  PLATINUM: "#3cba8c",
  EMERALD: "#00be93",
  DIAMOND: "#576bce",
  MASTER: "#9e4fc6",
  GRANDMASTER: "#e84057",
  CHALLENGER: "#f4c874",
};
const TIER_EN: Record<string, string> = {
  IRON: "Iron",
  BRONZE: "Bronze",
  SILVER: "Silver",
  GOLD: "Gold",
  PLATINUM: "Platinum",
  EMERALD: "Emerald",
  DIAMOND: "Diamond",
  MASTER: "Master",
  GRANDMASTER: "Grandmaster",
  CHALLENGER: "Challenger",
};
const CHAMPION_VERSION = "14.24.1";

interface Props {
  member: TeamMemberSummary;
  canManage: boolean;
  onRemove: (userId: string) => void;
  onRoleChange?: (userId: string, newRole: "COACH" | "PLAYER") => void;
}

export function TeamMemberCard({ member, canManage, onRemove, onRoleChange }: Props) {
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const tierColor = member.rank ? (TIER_COLORS[member.rank.tier] ?? "#A7BCB5") : null;
  const tierName = member.rank ? (TIER_EN[member.rank.tier] ?? member.rank.tier) : null;
  const wrColor =
    member.winRate7d === null
      ? "text-text-muted"
      : member.winRate7d >= 55
        ? "text-success"
        : member.winRate7d < 45
          ? "text-danger"
          : "text-text";
  const wrArrow =
    member.winRate7d === null
      ? null
      : member.winRate7d >= 55
        ? "↑"
        : member.winRate7d < 45
          ? "↓"
          : "→";

  const canChangeRole = canManage && member.role !== "OWNER" && onRoleChange;

  return (
    <div className="relative flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 transition-colors hover:bg-surface-2/40">
      {/* Tier-colored avatar */}
      <div
        className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold"
        style={{
          borderColor: tierColor ?? "#3f3f4e",
          background: `${tierColor ?? "#3f3f4e"}1a`,
          color: tierColor ?? "#A7BCB5",
        }}
      >
        {member.gameName.charAt(0).toUpperCase()}
      </div>

      {/* Identity + stats */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          {member.profileSlug ? (
            <Link
              href={`/u/${member.profileSlug}`}
              className="text-sm font-semibold text-text transition-colors hover:text-info"
            >
              {member.gameName}
              <span className="ml-1 text-xs font-normal text-text-muted">#{member.tagLine}</span>
            </Link>
          ) : (
            <p className="text-sm font-semibold text-text">
              {member.gameName}
              <span className="ml-1 text-xs font-normal text-text-muted">#{member.tagLine}</span>
            </p>
          )}

          {/* Role badge — clickable for owners */}
          {canChangeRole ? (
            <div className="relative">
              <button
                onClick={() => setRoleMenuOpen((v) => !v)}
                className={`flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide transition-opacity hover:opacity-80 ${ROLE_STYLES[member.role] ?? ROLE_STYLES.PLAYER}`}
              >
                {ROLE_LABELS[member.role]}
                <ChevronDown className="h-2.5 w-2.5" />
              </button>
              {roleMenuOpen && (
                <div className="absolute left-0 top-full z-10 mt-1 rounded-lg border border-border bg-surface shadow-lg">
                  {(["COACH", "PLAYER"] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        onRoleChange(member.userId, r);
                        setRoleMenuOpen(false);
                      }}
                      className={`flex w-full items-center px-3 py-1.5 text-xs hover:bg-surface-2 ${member.role === r ? "font-bold text-text" : "text-text-muted"}`}
                    >
                      {ROLE_LABELS[r]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <span
              className={`rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${ROLE_STYLES[member.role] ?? ROLE_STYLES.PLAYER}`}
            >
              {ROLE_LABELS[member.role]}
            </span>
          )}
        </div>

        {/* Rank + WR */}
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs">
          {member.rank && tierName && (
            <span className="font-semibold" style={{ color: tierColor ?? "#A7BCB5" }}>
              {tierName} {member.rank.division} · {member.rank.lp} LP
            </span>
          )}
          {!member.rank && <span className="text-text-muted/60">Unranked</span>}
          {member.winRate7d !== null && (
            <span className={`font-medium ${wrColor}`}>
              {wrArrow} {member.winRate7d}% WR (7d)
            </span>
          )}
        </div>
      </div>

      {/* Right: champion icons + actions */}
      <div className="flex shrink-0 items-center gap-2">
        {member.topChampion && (
          <div className="relative" title={`Most played: ${member.topChampion}`}>
            <Image
              src={`https://ddragon.leagueoflegends.com/cdn/${CHAMPION_VERSION}/img/champion/${member.topChampion}.png`}
              alt={member.topChampion}
              width={30}
              height={30}
              unoptimized
              className="rounded-md border border-white/10 opacity-75"
            />
          </div>
        )}

        {member.lastMatchChampion && member.lastMatchChampion !== member.topChampion && (
          <div className="relative" title={`Last match: ${member.lastMatchChampion}`}>
            <Image
              src={`https://ddragon.leagueoflegends.com/cdn/${CHAMPION_VERSION}/img/champion/${member.lastMatchChampion}.png`}
              alt={member.lastMatchChampion}
              width={30}
              height={30}
              unoptimized
              className="rounded-md border border-white/10"
            />
            {member.lastMatchResult && (
              <span
                className={`absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] font-bold ${member.lastMatchResult === "WIN" ? "bg-success text-background" : "bg-danger text-background"}`}
              >
                {member.lastMatchResult === "WIN" ? "W" : "L"}
              </span>
            )}
          </div>
        )}

        {member.lastReportId && (
          <Link href={`/coaching/${member.lastReportId}`}>
            <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
              Report
            </Button>
          </Link>
        )}

        {canManage && member.role !== "OWNER" && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-text-muted hover:text-danger"
            onClick={() => onRemove(member.userId)}
          >
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}
