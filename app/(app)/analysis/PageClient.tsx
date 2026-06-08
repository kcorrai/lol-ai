"use client";

import { useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageSkeleton } from "@/components/layout/PageSkeleton";
import { DeathHeatMap } from "@/domains/analysis/components/DeathHeatMap";
import { HeatMapControls } from "@/domains/analysis/components/HeatMapControls";
import { useRiotAccounts } from "@/hooks/useRiotAccounts";
import { useDeathHeatmap } from "@/hooks/useDeathHeatmap";
import { useSubscription } from "@/hooks/useSubscription";
import { useChampionPool } from "@/hooks/useChampionPool";

export default function AnalysisPage() {
  const { data: accounts, isLoading: accountsLoading } = useRiotAccounts();
  const { data: sub } = useSubscription();
  const primaryId = accounts?.[0]?.id ?? null;
  const { data: pool = [] } = useChampionPool(primaryId);

  const isPro = sub?.plan === "pro" || sub?.plan === "elite";

  const [champion, setChampion] = useState<string | undefined>(undefined);
  const [timeRange, setTimeRange] = useState<string | undefined>(undefined);
  const [matchCount, setMatchCount] = useState(20);

  const { data, isLoading } = useDeathHeatmap(primaryId, { champion, timeRange, matchCount });

  const playedChampions = pool.map((c) => c.championName);

  if (accountsLoading) return <PageSkeleton />;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <PageHeader
        title="Ölüm Isı Haritası"
        subtitle="Hangi bölgede, hangi sürede öldüğünü haritada gör."
      />

      <HeatMapControls
        champions={playedChampions}
        champion={champion}
        timeRange={timeRange}
        matchCount={matchCount}
        onChampionChange={setChampion}
        onTimeRangeChange={setTimeRange}
        onMatchCountChange={setMatchCount}
        isPro={isPro}
      />

      {/* Loading / no data states */}
      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-8 text-text-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Yükleniyor…</span>
        </div>
      )}

      {!isLoading && data && !data.hasData && (
        <div className="rounded-xl border border-border bg-surface p-6 text-center">
          <MapPin className="mx-auto mb-3 h-8 w-8 text-text-muted" />
          <p className="font-semibold text-text">Veri hazırlanıyor</p>
          <p className="mt-1 text-sm text-text-muted">
            Match timeline verisi arka planda indiriliyor. Birkaç dakika içinde harita görünecek.
          </p>
          <p className="mt-3 text-xs text-text-muted">Sayfa 30 saniyede otomatik güncelleniyor…</p>
        </div>
      )}

      {!isLoading && data && data.hasData && (
        <DeathHeatMap
          deaths={data.deaths}
          summary={data.summary}
        />
      )}
    </div>
  );
}
