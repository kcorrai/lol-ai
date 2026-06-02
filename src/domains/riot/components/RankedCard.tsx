"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRankedData, type RankedQueue } from "@/hooks/useRankedData";
import type { LpSnapshot } from "@/domains/riot";

const TIER_COLOR: Record<string, string> = {
  IRON: "text-stone-400",
  BRONZE: "text-amber-700",
  SILVER: "text-slate-400",
  GOLD: "text-yellow-400",
  PLATINUM: "text-teal-400",
  EMERALD: "text-emerald-400",
  DIAMOND: "text-blue-400",
  MASTER: "text-purple-400",
  GRANDMASTER: "text-red-400",
  CHALLENGER: "text-yellow-300",
};

const TIER_BG: Record<string, string> = {
  IRON: "bg-stone-800",
  BRONZE: "bg-amber-900",
  SILVER: "bg-slate-700",
  GOLD: "bg-yellow-900",
  PLATINUM: "bg-teal-900",
  EMERALD: "bg-emerald-900",
  DIAMOND: "bg-blue-900",
  MASTER: "bg-purple-900",
  GRANDMASTER: "bg-red-900",
  CHALLENGER: "bg-yellow-900",
};

function TierEmblem({ tier }: { tier: string }) {
  const color = TIER_COLOR[tier] ?? "text-text";
  const bg = TIER_BG[tier] ?? "bg-surface-2";
  return (
    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${bg}`}>
      <span className={`text-lg font-bold ${color}`}>{tier[0]}</span>
    </div>
  );
}

function LpChart({ history }: { history: LpSnapshot[] }) {
  if (history.length < 3) {
    return (
      <p className="text-xs text-text-muted italic">
        Play more games to see your LP progression.
      </p>
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
              {/* CSS tooltip — appears above bar on hover */}
              <div className="pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap rounded bg-surface px-1.5 py-0.5 text-xs text-text opacity-0 ring-1 ring-border transition-opacity group-hover:opacity-100">
                {snap.lp} LP
                <span className="ml-1 text-text-muted">{date}</span>
              </div>
              <div
                className="w-full rounded-t bg-accent opacity-70 transition-all group-hover:opacity-100"
                style={{ height: `${pct}%` }}
              />
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
                  queue === q
                    ? "bg-accent/20 text-accent"
                    : "text-text-muted hover:text-text"
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
            No {queue === "solo" ? "Solo/Duo" : "Flex"} ranked data — sync your account.
          </p>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <TierEmblem tier={rank.tier} />
              <div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-xl font-display font-bold ${tierColor}`}>
                    {rank.tier} {rank.division}
                  </span>
                  <span className="text-sm text-text-muted">{rank.lp} LP</span>
                </div>
                <p className="text-xs text-text-muted">
                  {rank.wins}W {rank.losses}L &middot; {winRate}% WR ({total} games)
                </p>
              </div>
            </div>
            <LpChart history={lpHistory} />
          </>
        )}
      </CardContent>
    </Card>
  );
}
