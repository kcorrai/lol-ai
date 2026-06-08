"use client";

import { useState } from "react";
import Link from "next/link";
import { Gamepad2, Lock, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageSkeleton } from "@/components/layout/PageSkeleton";
import { ChampionPoolGrid } from "@/domains/champions/components/ChampionPoolGrid";
import { ChampionDeepDiveModal } from "@/domains/champions/components/ChampionDeepDiveModal";
import { MatchupMatrix } from "@/domains/champions/components/MatchupMatrix";
import { useRiotAccounts } from "@/hooks/useRiotAccounts";
import { useChampionPool } from "@/hooks/useChampionPool";
import { useSubscription } from "@/hooks/useSubscription";
import { usePerformanceProfile } from "@/hooks/usePerformanceProfile";
import { useGenerateReport } from "@/hooks/useGenerateReport";
import { cn } from "@/lib/utils";

const FREE_CHAMPION_LIMIT = 3;
type Tab = "pool" | "matchup";

export default function ChampionsPage() {
  const { data: accounts, isLoading: accountsLoading } = useRiotAccounts();
  const { data: sub } = useSubscription();
  const primaryId = accounts?.[0]?.id ?? null;
  const { data: pool = [], isLoading: poolLoading } = useChampionPool(primaryId);
  const { data: profile } = usePerformanceProfile(primaryId);
  const generateReport = useGenerateReport();
  const [deepDiveChampion, setDeepDiveChampion] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("pool");

  const isPro = sub?.plan === "pro" || sub?.plan === "elite" || sub?.plan === "team";

  if (accountsLoading) return <PageSkeleton />;

  if (!accounts || accounts.length === 0) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <EmptyState
          icon={<Gamepad2 className="h-16 w-16" />}
          title="Riot Hesabı Bağlı Değil"
          description="Şampiyon istatistiklerini görmek için League of Legends hesabını bağla."
          action={
            <Link href="/settings/accounts">
              <Button size="lg">Hesap Bağla</Button>
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
        title="Şampiyon Havuzu"
        subtitle="Ranked maçlarındaki şampiyon performansın — kazanma oranına göre sıralanmış."
      />

      {/* Tabs */}
      <div className="mb-5 flex gap-1 rounded-lg border border-border bg-surface-2 p-1 w-fit">
        {([
          { id: "pool" as Tab, label: "Şampiyon Havuzu" },
          { id: "matchup" as Tab, label: "Matchup Matrisi" },
        ]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "bg-surface text-text shadow-sm"
                : "text-text-muted hover:text-text"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Matchup Matrix Tab */}
      {activeTab === "matchup" && <MatchupMatrix riotAccountId={primaryId} />}

      {/* Champion Pool Tab */}
      {activeTab === "pool" && best && !poolLoading && (
        <div className="mb-5 mt-2 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 text-sm">
          <div>
            <span className="font-medium text-accent">Tırmanmak için en iyi seçim:</span>{" "}
            <span className="text-text">
              {best.championName} — {best.gamesPlayed} maçta %{best.winRate} kazanma oranı
            </span>
          </div>
          <Button
            size="sm"
            variant="secondary"
            disabled={!profile || generateReport.isPending}
            onClick={() => {
              if (!primaryId || !profile) return;
              const matchIds = profile.recentMatches
                .filter((m) => m.champion === best.championName)
                .slice(0, 10)
                .map((m) => m.matchDbId);
              if (matchIds.length === 0) return;
              generateReport.mutate({
                riotAccountId: primaryId,
                reportType: "champion_focus",
                matchIds,
                focusArea: best.championName,
              });
            }}
            className="shrink-0 gap-1.5"
          >
            <BarChart2 className="h-3.5 w-3.5" />
            {generateReport.isPending ? "Oluşturuluyor…" : `${best.championName} Analiz Et`}
          </Button>
        </div>
      )}

      {activeTab === "pool" && <p className="mb-4 text-xs text-text-muted">
        3+ Solo/Duo ranked maçı olan şampiyonlar · Kazanma oranına göre sıralanmış
        {!isPro && pool.length > FREE_CHAMPION_LIMIT && (
          <span className="ml-2 text-accent">
            · {pool.length} şampiyondan ilk {FREE_CHAMPION_LIMIT} gösteriliyor
          </span>
        )}
      </p>}

      {activeTab === "pool" && primaryId && deepDiveChampion && (
        <ChampionDeepDiveModal
          riotAccountId={primaryId}
          championName={deepDiveChampion}
          onClose={() => setDeepDiveChampion(null)}
        />
      )}

      {activeTab === "pool" && <ChampionPoolGrid
        entries={visiblePool}
        isLoading={poolLoading}
        riotAccountId={primaryId ?? undefined}
        onDeepDive={setDeepDiveChampion}
      />}

      {/* Pro gate — shown when free user has more champions */}
      {activeTab === "pool" && !isPro && lockedCount > 0 && !poolLoading && (
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
              {lockedCount} şampiyon kilitli
            </p>
            <p className="mt-1 text-xs text-text-muted">
              Tüm şampiyon havuzunu görmek için Pro&apos;ya geç
            </p>
            <Link href="/settings/billing" className="mt-4">
              <Button size="sm">Pro&apos;ya Geç</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
