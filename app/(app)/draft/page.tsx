"use client";

import { useState } from "react";
import { LayoutGrid, Share2, Info, Lightbulb } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
import { RoleBasedTeamPicker } from "@/components/shared/RoleBasedTeamPicker";
import { TeamCompositionCard } from "@/domains/draft/components/TeamCompositionCard";
import { WinConditionsCard } from "@/domains/draft/components/WinConditionsCard";
import { ScalingChart } from "@/domains/draft/components/ScalingChart";
import { BanRecommendationsCard } from "@/domains/draft/components/BanRecommendationsCard";
import { DraftSkeleton } from "@/domains/draft/components/DraftSkeleton";
import { useDraftAnalysis } from "@/hooks/useDraftAnalysis";
import { cn } from "@/lib/utils";
import type { TeamSelection } from "@/components/shared/RoleBasedTeamPicker";
import type { TeamPicks } from "@/domains/draft/types/draft.types";

const EMPTY_TEAM: TeamSelection = { TOP: null, JUNGLE: null, MIDDLE: null, BOTTOM: null, UTILITY: null };
const SEVERITY_STYLES = { high: "border-red-500/40", medium: "border-yellow-500/40", low: "border-border" };
const SEVERITY_LABELS = { high: "Yüksek", medium: "Orta", low: "Düşük" };

function isComplete(team: TeamSelection): team is Record<keyof TeamSelection, string> {
  return Object.values(team).every(Boolean);
}

function toTeamPicks(team: TeamSelection): TeamPicks {
  return team as unknown as TeamPicks;
}

export default function DraftPage() {
  const [blue, setBlue] = useState<TeamSelection>(EMPTY_TEAM);
  const [red, setRed] = useState<TeamSelection>(EMPTY_TEAM);
  const [copied, setCopied] = useState(false);

  const { analyze, data, isLoading, isError, error, reset } = useDraftAnalysis();

  const canAnalyze = isComplete(blue) && isComplete(red);

  function handleAnalyze() {
    if (!canAnalyze) return;
    reset();
    analyze({ blueTeam: toTeamPicks(blue), redTeam: toTeamPicks(red) });
  }

  function handleReset() {
    setBlue(EMPTY_TEAM);
    setRed(EMPTY_TEAM);
    reset();
  }

  function handleShare() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <PageHeader
        title="Draft Analizci"
        subtitle="10 champion'lı iki takımın draft'ını analiz et."
        action={
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-border bg-surface px-2.5 py-1 text-xs text-text-muted">
              Patch 16.10
            </span>
            {data && (
              <Button variant="secondary" size="sm" onClick={handleShare}>
                <Share2 className="mr-1.5 h-3.5 w-3.5" />
                {copied ? "Kopyalandı!" : "Paylaş"}
              </Button>
            )}
          </div>
        }
      />

      {/* Team pickers */}
      <div className="mb-6 space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <RoleBasedTeamPicker
            value={blue}
            onChange={setBlue}
            label="Mavi Takım"
            teamColor="blue"
            excludeChampions={Object.values(red).filter(Boolean) as string[]}
          />
          <RoleBasedTeamPicker
            value={red}
            onChange={setRed}
            label="Kırmızı Takım"
            teamColor="red"
            excludeChampions={Object.values(blue).filter(Boolean) as string[]}
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={handleAnalyze} disabled={!canAnalyze || isLoading}>
            {isLoading ? "Analiz ediliyor..." : "Analiz Et →"}
          </Button>
          <Button variant="secondary" onClick={handleReset}>Sıfırla</Button>
        </div>
      </div>

      {!data && !isLoading && !isError && (
        <EmptyState icon={<LayoutGrid className="h-14 w-14" />} title="10 şampiyon seç" description="Her iki takımı doldurunca analiz başlar." />
      )}
      {isLoading && <DraftSkeleton />}
      {isError && !isLoading && (
        <ErrorState title="Analiz başarısız" message={error?.message ?? "Lütfen tekrar dene."} onRetry={handleAnalyze} />
      )}

      {data && !isLoading && (
        <div className="space-y-4">
          <TeamCompositionCard blue={data.blueTeamComposition} red={data.redTeamComposition} />
          <WinConditionsCard blueConditions={data.blueWinConditions} redConditions={data.redWinConditions} />
          <ScalingChart blue={data.blueScaling} red={data.redScaling} />

          {/* Key matchups */}
          <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
            <h3 className="text-sm font-semibold text-text">Kritik Eşleşmeler</h3>
            {data.keyMatchups.map((m, i) => (
              <div key={i} className="rounded-lg border border-border bg-surface-2 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-blue-400 font-medium text-sm">{m.blue}</span>
                  <span className="text-text-muted text-xs">vs</span>
                  <span className="text-red-400 font-medium text-sm">{m.red}</span>
                  <span className={cn(
                    "ml-auto text-xs font-semibold shrink-0",
                    m.advantage === "blue" ? "text-blue-400" : m.advantage === "red" ? "text-red-400" : "text-text-muted"
                  )}>
                    {m.advantage === "even" ? "Eşit" : m.advantage === "blue" ? "Mavi+" : "Kırmızı+"}
                  </span>
                </div>
                <p className="text-xs text-text-muted">{m.note}</p>
                {m.microTip && (
                  <div className="flex items-start gap-1.5 rounded border border-accent/20 bg-accent/5 px-2.5 py-1.5">
                    <Lightbulb className="mt-0.5 h-3 w-3 shrink-0 text-accent" />
                    <p className="text-xs text-accent/90">{m.microTip}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Risks */}
          <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
            <h3 className="text-sm font-semibold text-text">Riskler</h3>
            {data.risks.map((r, i) => (
              <div key={i} className={cn("rounded-lg border p-3", SEVERITY_STYLES[r.severity])}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn("rounded px-1.5 py-0.5 text-xs font-semibold", r.team === "blue" ? "bg-blue-500/15 text-blue-400" : "bg-red-500/15 text-red-400")}>
                    {r.team === "blue" ? "Mavi" : "Kırmızı"}
                  </span>
                  <span className="text-xs text-text-muted">{SEVERITY_LABELS[r.severity]}</span>
                </div>
                <p className="text-sm text-text">{r.risk}</p>
              </div>
            ))}
          </div>

          {/* Ban recommendations */}
          {data.banRecommendations && data.banRecommendations.length > 0 && (
            <BanRecommendationsCard recommendations={data.banRecommendations} />
          )}

          {/* Verdict */}
          <div className="rounded-xl border border-accent/30 bg-accent/5 p-4">
            <div className="flex items-start gap-2">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <p className="text-sm font-medium text-text">{data.verdict}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
