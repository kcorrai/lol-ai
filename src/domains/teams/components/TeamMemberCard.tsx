"use client";

import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import type { TeamMemberSummary } from "@/domains/teams/types/teams.types";

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Sahip",
  COACH: "Koç",
  PLAYER: "Oyuncu",
};

interface Props {
  member: TeamMemberSummary;
  canManage: boolean;
  onRemove: (memberId: string) => void;
}

export function TeamMemberCard({ member, canManage, onRemove }: Props) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-sm font-bold text-text-muted">
        {member.gameName.charAt(0).toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-text">
            {member.gameName}
            <span className="ml-1 text-xs text-text-muted">#{member.tagLine}</span>
          </p>
          <Badge
            variant={member.role === "COACH" ? "default" : "secondary"}
            className="shrink-0 text-[10px]"
          >
            {ROLE_LABELS[member.role] ?? member.role}
          </Badge>
        </div>

        <div className="mt-0.5 flex items-center gap-3 text-xs text-text-muted">
          {member.rank && <span>{member.rank}</span>}
          {member.winRate7d !== null && (
            <span
              className={
                member.winRate7d >= 55
                  ? "text-success"
                  : member.winRate7d < 45
                  ? "text-danger"
                  : "text-text-muted"
              }
            >
              {member.winRate7d}% WR (7g)
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {member.lastMatchChampion && (
          <div className="flex items-center gap-1">
            <ChampionIcon name={member.lastMatchChampion} size={28} />
            {member.lastMatchResult && (
              <span
                className={`text-xs font-medium ${
                  member.lastMatchResult === "WIN" ? "text-success" : "text-danger"
                }`}
              >
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
