"use client";

import { useState } from "react";
import { Swords, Share2, Info } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { ChampionSelector } from "@/components/shared/ChampionSelector";
import { MatchupSection } from "@/domains/matchup/components/MatchupSection";
import { MatchupSkeleton } from "@/domains/matchup/components/MatchupSkeleton";
import { useMatchupAnalysis } from "@/hooks/useMatchupAnalysis";
import { cn } from "@/lib/utils";
import type { Position } from "@/types/common.types";
import type { MatchupTab } from "@/domains/matchup/components/MatchupSection";

const ROLES: { value: Position; label: string }[] = [
  { value: "TOP", label: "Top" },
  { value: "JUNGLE", label: "JGL" },
  { value: "MIDDLE", label: "Mid" },
  { value: "BOTTOM", label: "ADC" },
  { value: "UTILITY", label: "Sup" },
];

const TABS: { value: MatchupTab; label: string }[] = [
  { value: "lane", label: "Lane Analizi" },
  { value: "trade", label: "Trade Rehberi" },
  { value: "build", label: "Build" },
  { value: "mistakes", label: "Kritik Hatalar" },
];

export default function MatchupPage() {
  const [champion, setChampion] = useState<string | null>(null);
  const [opponent, setOpponent] = useState<string | null>(null);
  const [role, setRole] = useState<Position | null>(null);
  const [activeTab, setActiveTab] = useState<MatchupTab>("lane");
  const [copied, setCopied] = useState(false);

  const { analyze, data, isLoading, isError, error, reset } = useMatchupAnalysis();

  const canAnalyze = !!champion && !!opponent && !!role && champion !== opponent;

  function handleAnalyze() {
    if (!champion || !opponent || !role) return;
    reset();
    analyze({ champion, opponent, role });
  }

  function handleShare() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <PageHeader
        title="Matchup Koçu"
        subtitle="İki şampiyonu karşılaştır, lane stratejini öğren."
        action={
          data && (
            <Button variant="secondary" size="sm" onClick={handleShare}>
              <Share2 className="mr-1.5 h-3.5 w-3.5" />
              {copied ? "Kopyalandı!" : "Paylaş"}
            </Button>
          )
        }
      />

      {/* Inputs */}
      <div className="mb-6 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="mb-1.5 block text-xs font-medium text-text-muted">Senin Şampiyonun</label>
            <ChampionSelector value={champion} onChange={setChampion} excludeChampions={opponent ? [opponent] : []} />
          </div>
          <span className="mt-5 shrink-0 text-sm font-bold text-text-muted">vs</span>
          <div className="flex-1">
            <label className="mb-1.5 block text-xs font-medium text-text-muted">Rakip Şampiyon</label>
            <ChampionSelector value={opponent} onChange={setOpponent} excludeChampions={champion ? [champion] : []} placeholder="Rakip seç..." />
          </div>
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
        <Button onClick={handleAnalyze} disabled={!canAnalyze || isLoading} className="w-full sm:w-auto">
          {isLoading ? "Analiz ediliyor..." : "Analiz Et →"}
        </Button>
      </div>

      {/* States */}
      {!data && !isLoading && !isError && (
        <EmptyState icon={<Swords className="h-14 w-14" />} title="Matchup seç" description="İki şampiyon ve rol seçip 'Analiz Et'e tıkla." />
      )}

      {isLoading && <MatchupSkeleton />}

      {isError && !isLoading && (
        <ErrorState title="Analiz başarısız" message={error?.message ?? "Lütfen tekrar dene."} onRetry={handleAnalyze} />
      )}

      {data && !isLoading && (
        <div className="space-y-4">
          {/* Champion comparison header */}
          <div className="rounded-lg border border-border bg-surface px-6 py-4 space-y-3">
            <div className="flex items-center justify-center gap-6">
              <div className="flex items-center gap-2.5">
                <ChampionIcon name={data.champion} size={48} className="rounded-lg ring-2 ring-accent/30" />
                <span className="text-base font-semibold text-text">{data.champion}</span>
              </div>
              <Swords className="h-5 w-5 shrink-0 text-text-muted/50" />
              <div className="flex items-center gap-2.5">
                <span className="text-base font-semibold text-text">{data.opponent}</span>
                <ChampionIcon name={data.opponent} size={48} className="rounded-lg ring-2 ring-red-500/30" />
              </div>
            </div>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <span className={cn(
                "rounded border px-2 py-0.5 text-xs font-semibold",
                data.laneAnalysis.advantage === "favorable" && "bg-green-500/15 text-green-400 border-green-500/30",
                data.laneAnalysis.advantage === "unfavorable" && "bg-red-500/15 text-red-400 border-red-500/30",
                data.laneAnalysis.advantage === "even" && "bg-border/40 text-text-muted border-border",
              )}>
                {data.laneAnalysis.advantage === "favorable" ? "Avantajlı" : data.laneAnalysis.advantage === "unfavorable" ? "Dezavantajlı" : "Dengeli"}
              </span>
              <span className="text-xs text-text-muted border-l border-border pl-3">
                {ROLES.find((r) => r.value === data.role)?.label ?? data.role}
              </span>
              {data.difficulty !== undefined && (
                <span className="flex items-center gap-1 border-l border-border pl-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={cn("h-1.5 w-1.5 rounded-full", i < data.difficulty! ? "bg-accent" : "bg-border")} />
                  ))}
                  <span className="ml-1 text-xs text-text-muted">Zorluk</span>
                </span>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-border">
            {TABS.map((t) => (
              <button key={t.value} type="button" onClick={() => setActiveTab(t.value)}
                className={cn("px-3 py-2 text-sm font-medium transition-colors",
                  activeTab === t.value ? "border-b-2 border-accent text-accent" : "text-text-muted hover:text-text"
                )}>
                {t.label}
              </button>
            ))}
          </div>

          <MatchupSection tab={activeTab} data={data} />

          <div className="flex items-center gap-2 px-1">
            <Info className="h-3.5 w-3.5 shrink-0 text-text-muted/40" />
            <p className="text-xs text-text-muted/60">Bu analiz, güncel patch verilerini yansıtmayabilir ve AI tarafından üretilmiştir.</p>
          </div>
        </div>
      )}
    </div>
  );
}
