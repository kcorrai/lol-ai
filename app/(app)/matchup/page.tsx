"use client";

import { useState } from "react";
import { Swords, Share2, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
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

          <div className="flex items-start gap-2 rounded-lg border border-border bg-surface px-4 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-text-muted/60" />
            <p className="text-xs text-text-muted">{data.patchNote}</p>
          </div>
        </div>
      )}
    </div>
  );
}
