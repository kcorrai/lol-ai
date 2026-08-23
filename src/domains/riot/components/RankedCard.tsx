"use client";

import Image from "next/image";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRankedData, type RankedQueue } from "@/hooks/useRankedData";
import { rankEmblemUrl } from "@/lib/ddragon";
import type { LpSnapshot } from "@/domains/riot";

const TIER_COLOR: Record<string, string> = {
  IRON: "text-rank-iron",
  BRONZE: "text-rank-bronze",
  SILVER: "text-rank-silver",
  GOLD: "text-rank-gold",
  PLATINUM: "text-rank-platinum",
  EMERALD: "text-rank-emerald",
  DIAMOND: "text-rank-diamond",
  MASTER: "text-rank-master",
  GRANDMASTER: "text-rank-grandmaster",
  CHALLENGER: "text-rank-challenger",
};

const TIER_BG: Record<string, string> = {
  IRON: "bg-surface-dark",
  BRONZE: "bg-warning",
  SILVER: "bg-surface-dark",
  GOLD: "bg-warning",
  PLATINUM: "bg-info",
  EMERALD: "bg-accent",
  DIAMOND: "bg-info",
  MASTER: "bg-accent",
  GRANDMASTER: "bg-danger",
  CHALLENGER: "bg-warning",
};

// Apex tiers have no divisions in Riot's ranking system
const APEX_TIERS = new Set(["MASTER", "GRANDMASTER", "CHALLENGER"]);

function TierEmblem({ tier }: { tier: string }) {
  const [errored, setErrored] = useState(false);
  const color = TIER_COLOR[tier] ?? "text-text";
  const bg = TIER_BG[tier] ?? "bg-surface-2";

  if (errored) {
    return (
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${bg}`}>
        <span className={`text-lg font-bold ${color}`}>{tier[0]}</span>
      </div>
    );
  }

  return (
    <Image
      src={rankEmblemUrl(tier)}
      alt={tier}
      width={40}
      height={40}
      className="shrink-0"
      onError={() => setErrored(true)}
      unoptimized
    />
  );
}

function LpChart({ history }: { history: LpSnapshot[] }) {
  if (history.length < 3) {
    return (
      <p className="text-xs italic text-text-muted">Play more games to see your LP progression.</p>
    );
  }

  const max = Math.max(...history.map((s) => s.lp), 1);

  return (
    <div>
      <p className="mb-1 text-xs text-text-muted">LP History</p>
      <div className="flex h-14 items-end gap-0.5">
        {history.map((snap, i) => {
          const pct = Math.max(4, (snap.lp / max) * 100);
          const date = new Date(snap.recordedAt).toLocaleDateString();
          return (
            <div
              key={i}
              className="group relative flex h-full flex-1 flex-col items-center justify-end"
            >
              {/* Tooltip attached to the bar fill so it tracks bar height, not full chart height */}
              <div
                className="relative w-full rounded-t bg-accent opacity-70 transition-all group-hover:opacity-100"
                style={{ height: `${pct}%` }}
              >
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded bg-surface px-1.5 py-0.5 text-xs text-text opacity-0 ring-1 ring-border transition-opacity group-hover:opacity-100">
                  {snap.lp} LP
                  <span className="ml-1 text-text-muted">{date}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface Props {
  riotAccountId: string | null | undefined;
}

export function RankedCard({ riotAccountId }: Props) {
  const [queue, setQueue] = useState<RankedQueue>("solo");
  const { data, isLoading } = useRankedData(riotAccountId, queue);

  const rank = data?.rank ?? null;
  const lpHistory = data?.lpHistory ?? [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-1">
          <Skeleton className="h-3 w-24" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-14 w-full" />
        </CardContent>
      </Card>
    );
  }

  const tierColor = rank ? (TIER_COLOR[rank.tier] ?? "text-text") : "text-text";
  const total = rank ? rank.wins + rank.losses : 0;
  const winRate = total > 0 ? Math.round((rank!.wins / total) * 100) : 0;

  return (
    <Card>
      <CardHeader className="pb-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-medium uppercase tracking-widest text-text-muted">
            Ranked
          </CardTitle>
          <div className="flex gap-1">
            {(["solo", "flex"] as const).map((q) => (
              <button
                key={q}
                onClick={() => setQueue(q)}
                className={`rounded px-2 py-0.5 text-xs transition-colors ${
                  queue === q ? "bg-accent/20 text-accent" : "text-text-muted hover:text-text"
                }`}
              >
                {q === "solo" ? "Solo/Duo" : "Flex"}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {!rank ? (
          <p className="text-sm text-text-muted">
            No {queue === "solo" ? "Solo/Duo" : "Flex"} ranked data found. Sync your account or play
            a ranked game first.
          </p>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <TierEmblem tier={rank.tier} />
              <div>
                <div className="flex items-baseline gap-2">
                  <span className={`font-display text-xl font-bold ${tierColor}`}>
                    {rank.tier}
                    {APEX_TIERS.has(rank.tier) ? "" : ` ${rank.division}`}
                  </span>
                  <span className="text-base font-semibold text-text">{rank.lp} LP</span>
                </div>
                <p className="text-xs text-text-muted">
                  {rank.wins}W {rank.losses}L &middot; {winRate}% WR ({total} games)
                </p>
              </div>
            </div>
            {(rank.hotStreak || rank.inactive) && (
              <div className="flex gap-2">
                {rank.hotStreak && (
                  <span className="rounded bg-warning/20 px-1.5 py-0.5 text-xs font-medium text-warning">
                    Hot Streak
                  </span>
                )}
                {rank.inactive && (
                  <span className="rounded bg-danger/20 px-1.5 py-0.5 text-xs font-medium text-danger">
                    LP Decay Risk
                  </span>
                )}
              </div>
            )}
            <LpChart history={lpHistory} />
          </>
        )}
      </CardContent>
    </Card>
  );
}
