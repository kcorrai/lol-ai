"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { CurrentRank, LpSnapshot } from "@/domains/riot";

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

function LpChart({ history }: { history: LpSnapshot[] }) {
  if (history.length === 0) return null;
  const max = Math.max(...history.map((s) => s.lp), 1);

  return (
    <div>
      <p className="mb-1 text-xs text-text-muted">LP History</p>
      <div className="flex h-12 items-end gap-0.5">
        {history.map((snap, i) => {
          const pct = Math.max(4, (snap.lp / max) * 100);
          return (
            <div
              key={i}
              className="group relative flex h-full flex-1 flex-col items-center justify-end"
              title={`${snap.lp} LP — ${new Date(snap.recordedAt).toLocaleDateString()}`}
            >
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
  rank: CurrentRank | null | undefined;
  lpHistory: LpSnapshot[] | undefined;
  isLoading: boolean;
}

export function RankedCard({ rank, lpHistory, isLoading }: Props) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-1">
          <Skeleton className="h-3 w-24" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!rank) {
    return (
      <Card>
        <CardHeader className="pb-1">
          <CardTitle className="text-xs font-medium uppercase tracking-widest text-text-muted">
            Ranked
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-text-muted">No ranked data — sync your account.</p>
        </CardContent>
      </Card>
    );
  }

  const tierColor = TIER_COLOR[rank.tier] ?? "text-text";
  const total = rank.wins + rank.losses;
  const winRate = total > 0 ? Math.round((rank.wins / total) * 100) : 0;

  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-xs font-medium uppercase tracking-widest text-text-muted">
          Ranked Solo/Duo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-display font-bold ${tierColor}`}>
            {rank.tier} {rank.division}
          </span>
          <span className="text-sm text-text-muted">{rank.lp} LP</span>
        </div>
        <p className="text-xs text-text-muted">
          {rank.wins}W {rank.losses}L &middot; {winRate}% WR ({total} games)
        </p>
        <LpChart history={lpHistory ?? []} />
      </CardContent>
    </Card>
  );
}
