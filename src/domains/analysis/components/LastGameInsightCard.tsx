"use client";

import { deriveMatchInsights } from "@/domains/analysis/utils/matchInsights";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import type { MatchPerformance } from "@/domains/analysis/types/analysis.types";

interface LastGameInsightCardProps {
  match: MatchPerformance | undefined;
  isLoading: boolean;
}

const SENTIMENT_STYLES = {
  positive: "text-success",
  neutral: "text-text-muted",
  negative: "text-danger",
} as const;

const SENTIMENT_ICON = {
  positive: "✦",
  neutral: "◆",
  negative: "✦",
} as const;

export function LastGameInsightCard({ match, isLoading }: LastGameInsightCardProps) {
  if (isLoading) {
    return <div className="h-24 animate-pulse rounded-xl border border-border bg-surface" />;
  }

  if (!match) return null;

  const insights = deriveMatchInsights(match);
  if (insights.length === 0) return null;

  const result = match.won ? "WIN" : "LOSS";
  const resultColor = match.won ? "text-success" : "text-danger";

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ChampionIcon name={match.champion} size={28} />
          <p className="text-xs font-medium uppercase tracking-widest text-text-muted">
            {match.champion} · {match.position}
          </p>
        </div>
        <span className={`text-xs font-semibold ${resultColor}`}>{result}</span>
      </div>

      <div className="space-y-2">
        {insights.map((insight, i) => (
          <div key={i} className="flex gap-2 text-xs">
            <span className={`mt-0.5 shrink-0 ${SENTIMENT_STYLES[insight.sentiment]}`}>
              {SENTIMENT_ICON[insight.sentiment]}
            </span>
            <span className="text-text-muted">{insight.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
