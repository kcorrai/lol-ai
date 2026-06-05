"use client";

import { useState } from "react";
import { Swords, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { ChampionSelector } from "@/components/shared/ChampionSelector";
import { CounterList } from "@/domains/counter/components/CounterList";
import { CounterPageSkeleton } from "@/domains/counter/components/CounterPageSkeleton";
import { useGeneralCounterPick } from "@/hooks/useGeneralCounterPick";
import { cn } from "@/lib/utils";
import type { Position } from "@/types/common.types";

const ROLES: { value: Position; label: string }[] = [
  { value: "TOP", label: "Top" },
  { value: "JUNGLE", label: "Jungle" },
  { value: "MIDDLE", label: "Mid" },
  { value: "BOTTOM", label: "Bot" },
  { value: "UTILITY", label: "Support" },
];

export default function CounterPage() {
  const [champion, setChampion] = useState<string | null>(null);
  const [role, setRole] = useState<Position | null>(null);

  const { data, isLoading, isError, error, refetch } = useGeneralCounterPick(
    champion,
    role
  );

  const isIdle = !champion || !role;

  return (
    <div className="mx-auto max-w-3xl p-6">
      <PageHeader
        title="Counter Pick"
        subtitle="Karşı şampiyona göre en etkili counter'ları keşfet."
      />

      {/* Inputs */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1.5 block text-xs font-medium text-text-muted">
            Rakip Şampiyonu
          </label>
          <ChampionSelector
            value={champion}
            onChange={setChampion}
            placeholder="Şampiyon seç..."
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-muted">
            Rol
          </label>
          <div className="flex gap-1">
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={cn(
                  "rounded-md border px-3 py-2 text-xs font-medium transition-colors",
                  role === r.value
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border bg-surface text-text-muted hover:border-accent/40 hover:text-text"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* States */}
      {isIdle && (
        <EmptyState
          icon={<Swords className="h-14 w-14" />}
          title="Rakibini seç"
          description="Karşı oynadığın şampiyonu ve rolünü seç, counter'larını keşfet."
        />
      )}

      {!isIdle && isLoading && <CounterPageSkeleton />}

      {!isIdle && isError && (
        <ErrorState
          title="Analiz yüklenemedi"
          message={
            error instanceof Error ? error.message : "Lütfen tekrar dene."
          }
          onRetry={() => refetch()}
        />
      )}

      {!isIdle && data && (
        <div className="space-y-8">
          <CounterList title="En Güçlü Counterlar" entries={data.topCounters} />
          <CounterList title="Kolay Oynanabilir" entries={data.easyCounters} />
          <CounterList
            title="Solo Queue Önerileri"
            entries={data.soloQueueCounters}
          />

          {data.tips.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
                Genel İpuçları
              </h2>
              <ul className="space-y-1.5">
                {data.tips.map((tip, i) => (
                  <li key={i} className="flex gap-2 text-sm text-text">
                    <span className="mt-0.5 shrink-0 text-accent">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="flex items-start gap-2 rounded-lg border border-border bg-surface px-4 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-text-muted/60" />
            <p className="text-xs text-text-muted">{data.patchNote}</p>
          </div>
        </div>
      )}
    </div>
  );
}
