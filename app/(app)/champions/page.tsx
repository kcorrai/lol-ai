"use client";

import Link from "next/link";
import { Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageSkeleton } from "@/components/layout/PageSkeleton";
import { ChampionPoolGrid } from "@/domains/champions/components/ChampionPoolGrid";
import { useRiotAccounts } from "@/hooks/useRiotAccounts";
import { useChampionPool } from "@/hooks/useChampionPool";

export default function ChampionsPage() {
  const { data: accounts, isLoading: accountsLoading } = useRiotAccounts();
  const primaryId = accounts?.[0]?.id ?? null;
  const { data: pool = [], isLoading: poolLoading } = useChampionPool(primaryId);

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

  const best = pool.find((c) => c.isBest);

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
      </p>

      <ChampionPoolGrid entries={pool} isLoading={poolLoading} />
    </div>
  );
}
