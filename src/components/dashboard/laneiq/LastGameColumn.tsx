"use client";

import Link from "next/link";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { deriveMatchInsights } from "@/domains/analysis/utils/matchInsights";
import type { MatchPerformance } from "@/domains/analysis/types/analysis.types";
import { StatBlock } from "./HudPanel";

const ROLE_LABEL: Record<string, string> = {
  TOP: "Top",
  JUNGLE: "Jungle",
  MIDDLE: "Mid",
  BOTTOM: "ADC",
  UTILITY: "Support",
};

const SENTIMENT_DOT = {
  positive: "bg-accent",
  neutral: "bg-warning",
  negative: "bg-danger",
} as const;

function agoLabel(iso: string): string {
  const minutes = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "yesterday" : `${days}d ago`;
}

function duration(minutes: number): string {
  const m = Math.floor(minutes);
  const s = Math.round((minutes - m) * 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

interface LastGameColumnProps {
  match: MatchPerformance | undefined;
  isLoading: boolean;
}

export function LastGameColumn({ match, isLoading }: LastGameColumnProps): React.ReactElement {
  if (isLoading) {
    return <div className="min-h-[300px] animate-pulse bg-surface-dark p-6" />;
  }

  if (!match) {
    return (
      <div className="p-6">
        <p className="hud-label">{"// Last game"}</p>
        <p className="mt-4 text-[13.5px] text-text-body">No games pulled yet.</p>
      </div>
    );
  }

  const insights = deriveMatchInsights(match);
  const kda = ((match.kills + match.assists) / Math.max(match.deaths, 1)).toFixed(2);

  return (
    <div className="flex flex-col p-6">
      <div className="flex items-center justify-between gap-2.5">
        <p className="hud-label">{`// Last game · ${agoLabel(match.gameStart)}`}</p>
        <span
          className={`tag-cut px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-label ${
            match.won ? "bg-accent text-background" : "bg-danger/15 text-danger"
          }`}
        >
          {match.won ? "Victory" : "Defeat"}
        </span>
      </div>

      <div className="my-3.5 flex items-center gap-3.5">
        <ChampionIcon name={match.champion} size={46} />
        <div>
          <p className="font-display text-[17px] font-bold uppercase tracking-[0.04em] text-text">
            {match.champion} · {ROLE_LABEL[match.position] ?? match.position}
          </p>
          <p className="font-mono text-[11px] tracking-[0.12em] text-text-muted">
            {match.kills}/{match.deaths}/{match.assists} · KDA {kda} ·{" "}
            {duration(match.gameDurationMinutes)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3.5 border-b border-border pb-4 sm:grid-cols-4">
        <StatBlock label="CS/min" value={match.csPerMinute.toFixed(1)} />
        <StatBlock label="Vision" value={String(match.visionScore)} />
        <StatBlock label="Gold/min" value={match.goldPerMinute.toFixed(0)} />
        <StatBlock label="DMG share" value={(match.damageShare * 100).toFixed(0)} unit="%" />
      </div>

      <div className="mt-3.5 grid gap-2.5">
        {insights.map((insight, i) => (
          <div key={i} className="grid grid-cols-[6px_1fr] items-start gap-2.5">
            <span className={`mt-1.5 h-1.5 w-1.5 ${SENTIMENT_DOT[insight.sentiment]}`} />
            <span className="text-[13.5px] text-text-body">{insight.text}</span>
          </div>
        ))}
      </div>

      <Link
        href={`/match/${match.matchDbId}`}
        className="mt-4 font-mono text-[10.5px] uppercase tracking-label text-accent"
      >
        Open match detail &rarr;
      </Link>
    </div>
  );
}
