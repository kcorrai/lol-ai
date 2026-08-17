"use client";

import { useState } from "react";
import Link from "next/link";
import { Gamepad2, Lock, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageSkeleton } from "@/components/layout/PageSkeleton";
import { ChampionPoolTable } from "@/domains/champions/components/ChampionPoolTable";
import { ChampionDeepDiveModal } from "@/domains/champions/components/ChampionDeepDiveModal";
import { MatchupMatrix } from "@/domains/champions/components/MatchupMatrix";
import { PoolVerdictPanel } from "@/domains/champions/components/PoolVerdictPanel";
import { PoolRail } from "@/domains/champions/components/PoolRail";
import { useRiotAccounts } from "@/hooks/useRiotAccounts";
import { useChampionPool } from "@/hooks/useChampionPool";
import { useSubscription } from "@/hooks/useSubscription";
import { cn } from "@/lib/utils";

const FREE_CHAMPION_LIMIT = 3;
type Tab = "pool" | "matchup";

const TABS: { id: Tab; label: string }[] = [
  { id: "pool", label: "Champion pool" },
  { id: "matchup", label: "Matchup matrix" },
];

export default function ChampionsPage(): React.JSX.Element {
  const { data: accounts, isLoading: accountsLoading } = useRiotAccounts();
  const { data: sub } = useSubscription();
  const primary = accounts?.find((a) => a.isPrimary) ?? accounts?.[0];
  const primaryId = primary?.id ?? null;
  const { data: pool = [], isLoading: poolLoading } = useChampionPool(primaryId);
  const [deepDiveChampion, setDeepDiveChampion] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("pool");

  const isPro = sub?.plan === "pro" || sub?.plan === "elite" || sub?.plan === "team";

  if (accountsLoading) return <PageSkeleton />;

  if (!accounts || accounts.length === 0) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <EmptyState
          icon={<Gamepad2 className="h-16 w-16" />}
          title="Riot Account Not Connected"
          description="Connect your League of Legends account to view champion statistics."
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
  const totalGames = visiblePool.reduce((sum, c) => sum + c.gamesPlayed, 0);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-line-1 bg-surface/70 px-5 backdrop-blur md:px-8">
        <Link
          href="/dashboard"
          className="font-mono text-[10.5px] uppercase tracking-label text-fg-3 hover:text-fg-1"
        >
          ← Dashboard
        </Link>
        <span className="h-4 w-px bg-line-2" />
        <h1 className="font-display text-sm font-bold uppercase tracking-wide text-fg-1">
          Champion pool
        </h1>
        {primary && (
          <span className="hidden font-mono text-[10.5px] uppercase tracking-wide text-fg-4 lg:inline">
            {primary.gameName}#{primary.tagLine} · {pool.length} champions
          </span>
        )}
        <Link
          href="/coaching/chat"
          className="notch-sm ml-auto inline-flex items-center gap-2 border border-line-2 px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-label text-fg-2 transition-colors hover:border-acid-500 hover:text-acid-500"
        >
          <MessageSquare className="h-3.5 w-3.5" aria-hidden />
          Ask your coach
        </Link>
      </header>

      <main className="mx-auto max-w-[1240px] px-5 pb-16 pt-6 md:px-8">
        <div className="mb-5 flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "tag-cut border px-3 py-1.5 font-mono text-[10px] uppercase tracking-wide transition-colors",
                activeTab === tab.id
                  ? "border-acid-500 bg-acid-500/10 text-acid-500"
                  : "border-line-2 text-fg-3 hover:text-fg-1"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "matchup" && <MatchupMatrix riotAccountId={primaryId} />}

        {activeTab === "pool" && (
          <>
            {!poolLoading && <PoolVerdictPanel entries={visiblePool} totalGames={totalGames} />}

            <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_306px]">
              <div data-tour="champion-pool-grid" className="min-w-0">
                <ChampionPoolTable
                  entries={visiblePool}
                  isLoading={poolLoading}
                  onDeepDive={setDeepDiveChampion}
                />

                {!isPro && lockedCount > 0 && !poolLoading && (
                  <div className="notch relative mt-4 overflow-hidden border border-acid-500/40">
                    <div className="pointer-events-none select-none blur-sm">
                      <ChampionPoolTable
                        entries={pool.slice(FREE_CHAMPION_LIMIT, FREE_CHAMPION_LIMIT + 3)}
                        isLoading={false}
                      />
                    </div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/70 backdrop-blur-sm">
                      <span className="tag-cut flex h-10 w-10 items-center justify-center border border-acid-500 bg-acid-500/10">
                        <Lock className="h-5 w-5 text-acid-500" />
                      </span>
                      <p className="mt-3 font-display text-base font-bold uppercase text-fg-1">
                        {lockedCount} champions locked
                      </p>
                      <p className="mt-1 text-xs text-text-muted">
                        Switch to Pro to see the full champion pool
                      </p>
                      <Link href="/settings/billing" className="mt-4">
                        <Button size="sm">Upgrade to Pro</Button>
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <PoolRail entries={visiblePool} />
            </div>
          </>
        )}

        {activeTab === "pool" && primaryId && deepDiveChampion && (
          <ChampionDeepDiveModal
            riotAccountId={primaryId}
            championName={deepDiveChampion}
            onClose={() => setDeepDiveChampion(null)}
          />
        )}
      </main>
    </div>
  );
}
