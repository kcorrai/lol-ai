"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { useChampionMetaRecommendations } from "@/hooks/useChampionMetaRecommendations";

interface Props {
  riotAccountId: string | null | undefined;
}

const TIER_CLASS: Record<string, string> = {
  S: "bg-accent/15 text-accent",
  A: "bg-success/15 text-success",
  B: "bg-info/15 text-info",
  C: "bg-warning/15 text-warning",
  D: "bg-danger/15 text-danger",
};

function TierBadge({ tier }: { tier: string }) {
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${TIER_CLASS[tier] ?? "bg-surface-2 text-text-muted"}`}>
      {tier}
    </span>
  );
}

export function MetaRecommendationsWidget({ riotAccountId }: Props) {
  const { data, isLoading } = useChampionMetaRecommendations(riotAccountId);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-2 rounded-xl border border-border bg-surface p-4">
        <div className="h-3 w-32 rounded bg-border" />
        {[0, 1].map((i) => <div key={i} className="h-12 w-full rounded bg-border" />)}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-4">
        <p className="text-sm text-text-muted">
          Play a few more ranked games and we&apos;ll show how your champions stack up against the
          current patch.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {data.map((rec) => (
        <div key={`${rec.kind}-${rec.championKey}`} className="rounded-xl border border-border bg-surface p-3">
          <div className="flex items-start gap-3">
            <ChampionIcon name={rec.championKey} size={36} className="mt-0.5 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-sm font-semibold text-text">{rec.championName}</span>
                <TierBadge tier={rec.tier} />
                <span className="text-[10px] text-text-muted">
                  {rec.positionLabel} · {rec.winRate}% WR · {rec.games}g
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-text-muted">{rec.message}</p>
              <Link
                href={rec.toolHref}
                className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline"
              >
                {rec.toolLabel} <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
