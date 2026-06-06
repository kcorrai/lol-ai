"use client";

import { useState } from "react";
import { Swords, AlertTriangle, Shield, PlayCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { ChampionSelector } from "@/components/shared/ChampionSelector";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { CounterList } from "@/domains/counter/components/CounterList";
import { CounterPageSkeleton } from "@/domains/counter/components/CounterPageSkeleton";
import { useGeneralCounterPick } from "@/hooks/useGeneralCounterPick";
import { championSplashUrl } from "@/lib/ddragon";
import { cn } from "@/lib/utils";
import type { Position } from "@/types/common.types";
import type { CounterEntry } from "@/domains/counter/types/counter.types";

const ROLES: { value: Position; label: string }[] = [
  { value: "TOP", label: "Top" },
  { value: "JUNGLE", label: "Jungle" },
  { value: "MIDDLE", label: "Mid" },
  { value: "BOTTOM", label: "Bot" },
  { value: "UTILITY", label: "Support" },
];

const ROLE_LABELS: Record<Position, string> = {
  TOP: "Top Lane", JUNGLE: "Jungle", MIDDLE: "Mid Lane",
  BOTTOM: "Bot Lane", UTILITY: "Support",
};

const DIFFICULTY_STYLES = {
  easy: "bg-green-500/15 text-green-400 border-green-500/30",
  medium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  hard: "bg-red-500/15 text-red-400 border-red-500/30",
};
const DIFFICULTY_LABELS = { easy: "Kolay Counter", medium: "Orta Güçlük", hard: "Zor Counter" };

function getCounterDifficulty(entries: CounterEntry[]): "easy" | "medium" | "hard" {
  if (entries.length === 0) return "medium";
  const counts = { easy: 0, medium: 0, hard: 0 };
  entries.forEach((e) => counts[e.difficulty]++);
  if (counts.hard > entries.length / 2) return "hard";
  if (counts.easy > entries.length / 2) return "easy";
  return "medium";
}

export default function CounterPage() {
  const [champion, setChampion] = useState<string | null>(null);
  const [role, setRole] = useState<Position | null>(null);
  const { data, isLoading, isError, error, refetch } = useGeneralCounterPick(champion, role);
  const isIdle = !champion || !role;

  return (
    <div className="mx-auto max-w-3xl p-6">
      <PageHeader
        title="Counter Pick"
        subtitle="Karşı şampiyona göre en etkili counter'ları keşfet."
      />

      {/* Inputs */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1.5 block text-xs font-medium text-text-muted">Rakip Şampiyonu</label>
          <ChampionSelector value={champion} onChange={setChampion} placeholder="Şampiyon seç..." />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-muted">Rol</label>
          <div className="flex gap-1">
            {ROLES.map((r) => (
              <button key={r.value} type="button" onClick={() => setRole(r.value)}
                className={cn("rounded-md border px-3 py-2 text-xs font-medium transition-colors",
                  role === r.value ? "border-accent bg-accent/10 text-accent" : "border-border bg-surface text-text-muted hover:border-accent/40 hover:text-text"
                )}>
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isIdle && (
        <EmptyState icon={<Swords className="h-14 w-14" />} title="Rakibini seç"
          description="Karşı oynadığın şampiyonu ve rolünü seç, counter'larını keşfet." />
      )}
      {!isIdle && isLoading && <CounterPageSkeleton />}
      {!isIdle && isError && (
        <ErrorState title="Analiz yüklenemedi"
          message={error instanceof Error ? error.message : "Lütfen tekrar dene."}
          onRetry={() => refetch()} />
      )}

      {!isIdle && data && (
        <div className="space-y-8">
          {/* Champion Hero Section */}
          <div className="relative overflow-hidden rounded-2xl border border-border">
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${championSplashUrl(data.champion)})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/85 to-bg/30" />
            <div className="relative flex items-end justify-between px-5 pb-5 pt-32">
              <div className="flex items-end gap-4">
                <ChampionIcon name={data.champion} size={64} className="rounded-xl ring-2 ring-border/60 shadow-lg" />
                <div>
                  <p className="text-2xl font-bold text-text leading-tight">{data.champion}</p>
                  <p className="text-sm text-text-muted">{ROLE_LABELS[data.role]}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={cn(
                  "rounded-lg border px-3 py-1.5 text-sm font-semibold",
                  DIFFICULTY_STYLES[getCounterDifficulty(data.topCounters)]
                )}>
                  <Shield className="mr-1.5 inline h-3.5 w-3.5" />
                  {DIFFICULTY_LABELS[getCounterDifficulty(data.topCounters)]}
                </span>
                <p className="text-xs text-text-muted">{data.topCounters.length + data.easyCounters.length + data.soloQueueCounters.length} counter analiz edildi</p>
              </div>
            </div>
          </div>

          <CounterList title="En Güçlü Counterlar" entries={data.topCounters} />
          <CounterList title="Kolay Oynanabilir" entries={data.easyCounters} />
          <CounterList title="Solo Queue Önerileri" entries={data.soloQueueCounters} />

          {data.tips.length > 0 && (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">Genel İpuçları</h2>
                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${data.champion} counter tips League of Legends`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs text-text-muted transition-colors hover:border-red-500/50 hover:text-red-400"
                >
                  <PlayCircle className="h-3.5 w-3.5" />
                  Matchup videoları
                </a>
              </div>
              <ul className="space-y-1.5">
                {data.tips.map((tip, i) => (
                  <li key={i} className="flex gap-2 text-sm text-text">
                    <span className="mt-0.5 shrink-0 text-accent">•</span>{tip}
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
