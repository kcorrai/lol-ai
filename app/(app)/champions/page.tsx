"use client";

import { useState } from "react";
import Link from "next/link";
import { Gamepad2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageSkeleton } from "@/components/layout/PageSkeleton";
import { ChampionPoolGrid } from "@/domains/champions/components/ChampionPoolGrid";
import { ChampionDeepDiveModal } from "@/domains/champions/components/ChampionDeepDiveModal";
import { useRiotAccounts } from "@/hooks/useRiotAccounts";
import { useChampionPool } from "@/hooks/useChampionPool";
import { useSubscription } from "@/hooks/useSubscription";

const FREE_CHAMPION_LIMIT = 3;

export default function ChampionsPage() {
  const { data: accounts, isLoading: accountsLoading } = useRiotAccounts();
  const { data: sub } = useSubscription();
  const primaryId = accounts?.[0]?.id ?? null;
  const { data: pool = [], isLoading: poolLoading } = useChampionPool(primaryId);
  const [deepDiveChampion, setDeepDiveChampion] = useState<string | null>(null);

  const isPro = sub?.plan === "pro" || sub?.plan === "elite";

  if (accountsLoading) return <PageSkeleton />;

  if (!accounts || accounts.length === 0) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <EmptyState
          icon={<Gamepad2 className="h-16 w-16" />}
          title="No Riot Account Connected"
          description="Connect your League of Legends account to see your champion stats."
          action={
            <Link href="/settings/accounts">
              <Button size="lg">Connect Account</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const visiblePool = isPro ? pool : pool.slice(0, FREE_CHAMPION_LIMIT);
  const lockedCount = isPro ? 0 : Math.max(0, pool.length - FREE_CHAMPION_LIMIT);
  const best = visiblePool.find((c) => c.isBest);

  return (
    <div className="mx-auto max-w-5xl p-6">
      <PageHeader
        title="Champion Pool"
        subtitle="Your ranked performance by champion — sorted by win rate."
      />

      {best && !poolLoading && (
        <div className="mb-5 mt-2 rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 text-sm">
          <span className="font-medium text-accent">Best pick to climb:</span>{" "}
          <span className="text-text">
            {best.championName} — {best.winRate}% win rate over {best.gamesPlayed} games
          </span>
        </div>
      )}

      <p className="mb-4 text-xs text-text-muted">
        Champions with 3+ Solo/Duo ranked games · Sorted by win rate
        {!isPro && pool.length > FREE_CHAMPION_LIMIT && (
          <span className="ml-2 text-accent">
            · Showing top {FREE_CHAMPION_LIMIT} of {pool.length}
          </span>
        )}
      </p>

      {primaryId && deepDiveChampion && (
        <ChampionDeepDiveModal
          riotAccountId={primaryId}
          championName={deepDiveChampion}
          onClose={() => setDeepDiveChampion(null)}
        />
      )}

      <ChampionPoolGrid
        entries={visiblePool}
        isLoading={poolLoading}
        riotAccountId={primaryId ?? undefined}
        onDeepDive={setDeepDiveChampion}
      />

      {/* Viral CTA — share best champion (visible to all, Pro or Free) */}
      {best && !poolLoading && (
        <div className="mt-4 rounded-lg border border-border bg-surface-2 p-4">
          <p className="mb-2 text-xs font-medium text-text-muted">
            Challenge your friends
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`My best champion is ${best.championName} with ${best.winRate}% win rate! Check your stats on LoL AI Coach 👇`)}&url=${encodeURIComponent(process.env.NEXT_PUBLIC_APP_URL ?? "https://lolaicoach.gg")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text-muted hover:border-accent/50 hover:text-text transition-colors"
            >
              Share on X
            </a>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text-muted hover:border-accent/50 hover:text-text transition-colors"
            >
              Generate AI Report
            </Link>
          </div>
        </div>
      )}

      {/* Pro gate — shown when free user has more champions */}
      {!isPro && lockedCount > 0 && !poolLoading && (
        <div className="relative mt-3 overflow-hidden rounded-lg border border-accent/30">
          {/* Blurred preview rows */}
          <div className="pointer-events-none select-none blur-sm">
            <ChampionPoolGrid
              entries={pool.slice(FREE_CHAMPION_LIMIT, FREE_CHAMPION_LIMIT + 3)}
              isLoading={false}
            />
          </div>
          {/* Lock overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/70 backdrop-blur-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20">
              <Lock className="h-5 w-5 text-accent" />
            </div>
            <p className="mt-3 font-display text-base font-semibold text-text">
              {lockedCount} more champion{lockedCount !== 1 ? "s" : ""} locked
            </p>
            <p className="mt-1 text-xs text-text-muted">
              Upgrade to Pro to see your full champion pool
            </p>
            <Link href="/settings/billing" className="mt-4">
              <Button size="sm">Upgrade to Pro</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
