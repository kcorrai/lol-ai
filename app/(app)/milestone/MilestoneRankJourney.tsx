"use client";

import Image from "next/image";
import { TrendingUp, TrendingDown } from "lucide-react";
import { rankEmblemUrl } from "@/lib/ddragon";
import { cn } from "@/lib/utils";

const TIER_COLORS: Record<string, string> = {
  IRON: "text-gray-400", BRONZE: "text-amber-700", SILVER: "text-gray-300",
  GOLD: "text-yellow-400", PLATINUM: "text-teal-400", EMERALD: "text-emerald-400",
  DIAMOND: "text-blue-400", MASTER: "text-purple-400",
  GRANDMASTER: "text-red-400", CHALLENGER: "text-yellow-300",
};

function formatRank(tier: string, division: string, lp: number): string {
  const highElo = ["MASTER", "GRANDMASTER", "CHALLENGER"];
  const tierDisplay = tier.charAt(0) + tier.slice(1).toLowerCase();
  if (highElo.includes(tier)) return `${tierDisplay} ${lp} LP`;
  return `${tierDisplay} ${division} ${lp} LP`;
}

interface RankSnapshot { tier: string; division: string; lp: number }

interface Props {
  rankStart: RankSnapshot | null;
  rankEnd: RankSnapshot | null;
  lpChange: number;
}

export function MilestoneRankJourney({ rankStart, rankEnd, lpChange }: Props) {
  return (
    <div className="gaming-card p-4">
      <p className="mb-4 text-xs font-bold uppercase tracking-wider text-text-muted">Rank Journey</p>
      <div className="flex items-center gap-4">
        <div className="flex flex-1 flex-col items-center gap-1">
          {rankStart ? (
            <>
              <Image src={rankEmblemUrl(rankStart.tier)} alt={rankStart.tier} width={48} height={48} unoptimized className="opacity-80" />
              <p className={cn("text-xs font-semibold", TIER_COLORS[rankStart.tier] ?? "text-text-muted")}>
                {formatRank(rankStart.tier, rankStart.division, rankStart.lp)}
              </p>
              <p className="text-[10px] text-text-muted">Month start</p>
            </>
          ) : (
            <p className="text-xs text-text-muted">No data</p>
          )}
        </div>

        <div className="flex flex-col items-center gap-1">
          {lpChange > 0 ? (
            <TrendingUp className="h-5 w-5 text-success" />
          ) : lpChange < 0 ? (
            <TrendingDown className="h-5 w-5 text-danger" />
          ) : (
            <div className="h-5 w-5 rounded-full border border-border" />
          )}
          <span className={cn("text-sm font-bold", lpChange > 0 ? "text-success" : lpChange < 0 ? "text-danger" : "text-text-muted")}>
            {lpChange > 0 ? "+" : ""}{lpChange} LP
          </span>
        </div>

        <div className="flex flex-1 flex-col items-center gap-1">
          {rankEnd ? (
            <>
              <Image src={rankEmblemUrl(rankEnd.tier)} alt={rankEnd.tier} width={48} height={48} unoptimized className={lpChange >= 0 ? "opacity-100" : "opacity-60"} />
              <p className={cn("text-xs font-semibold", TIER_COLORS[rankEnd.tier] ?? "text-text-muted")}>
                {formatRank(rankEnd.tier, rankEnd.division, rankEnd.lp)}
              </p>
              <p className="text-[10px] text-text-muted">Now</p>
            </>
          ) : (
            <p className="text-xs text-text-muted">No data</p>
          )}
        </div>
      </div>
    </div>
  );
}
