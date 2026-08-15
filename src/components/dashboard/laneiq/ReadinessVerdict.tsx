"use client";

import Link from "next/link";
import { Play, Target } from "lucide-react";
import { useTiltStatus } from "@/hooks/useTiltStatus";
import { useWarmupStatus } from "@/hooks/useWarmupStatus";
import { computeReadinessScore } from "@/domains/analysis/services/sessionReadinessService";
import type { ReadinessLevel } from "@/domains/analysis/services/sessionReadinessService";
import { HudMeter } from "./HudPanel";
import type { MeterTone } from "./HudPanel";

const LEVEL: Record<
  ReadinessLevel,
  { headline: string; color: string; cta: string; ctaHref: string; alt: string; altHref: string }
> = {
  ready: {
    headline: "Ready to queue",
    color: "text-accent",
    cta: "Queue with focus",
    ctaHref: "/coaching",
    alt: "Review last game",
    altHref: "/coaching",
  },
  caution: {
    headline: "Proceed with caution",
    color: "text-warning",
    cta: "Warm up first",
    ctaHref: "/improvement",
    alt: "Queue anyway",
    altHref: "/coaching",
  },
  not_ready: {
    headline: "Not recommended",
    color: "text-danger",
    cta: "Start a 10-min drill",
    ctaHref: "/improvement",
    alt: "Queue anyway",
    altHref: "/coaching",
  },
};

const TILT_METER: Record<string, { pct: number; tone: MeterTone; label: string }> = {
  focused: { pct: 88, tone: "accent", label: "Focused" },
  caution: { pct: 52, tone: "warn", label: "Caution" },
  tilting: { pct: 18, tone: "danger", label: "Tilting" },
};

export function ReadinessVerdict({
  riotAccountId,
}: {
  riotAccountId: string | null | undefined;
}): React.ReactElement | null {
  const { data: tilt, isLoading: tiltLoading } = useTiltStatus(riotAccountId);
  const { data: warmup, isLoading: warmupLoading } = useWarmupStatus(riotAccountId);

  if (tiltLoading || warmupLoading) {
    return <div className="h-full min-h-[300px] animate-pulse bg-surface-dark" />;
  }
  if (!tilt || !warmup) return null;

  const result = computeReadinessScore(tilt, warmup);
  const cfg = LEVEL[result.level];
  const mental = TILT_METER[tilt.level] ?? TILT_METER.caution;

  const warmedUp = warmup.status === "warmed_up";
  const noRanked = warmup.status === "no_ranked_today";
  const warmPct = warmedUp ? 100 : noRanked ? 50 : 12;
  const warmTone: MeterTone = warmedUp ? "accent" : noRanked ? "info" : "danger";
  const warmLabel = warmedUp ? "Warmed up" : noRanked ? "No ranked yet" : "Cold";

  const CtaIcon = result.level === "ready" ? Play : Target;

  return (
    <div className="border-b border-border p-6 lg:border-b-0 lg:border-r">
      <p className={`font-mono text-[11px] uppercase tracking-label ${cfg.color}`}>
        {"// Session readiness"}
      </p>

      <div className="mt-3 flex items-baseline gap-2.5">
        <span className={`font-mono text-[56px] font-bold leading-[0.9] ${cfg.color}`}>
          {result.score}
        </span>
        <span className="font-mono text-xs tracking-wider text-text-faint">/100</span>
      </div>

      <p
        className={`mt-3 font-display text-[22px] font-extrabold uppercase leading-[1.1] ${cfg.color}`}
      >
        {cfg.headline}
      </p>
      <p className="mb-4 mt-2.5 text-[13.5px] text-text-body">{result.advice}</p>

      <div className="grid gap-3">
        <HudMeter value={mental.pct} tone={mental.tone} label="Mental" right={mental.label} />
        <HudMeter value={warmPct} tone={warmTone} label="Warm-up" right={warmLabel} />
      </div>

      <p className="mt-3 font-mono text-[10.5px] uppercase tracking-[0.12em] text-text-muted">
        {warmup.message}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={cfg.ctaHref}
          className="tag-cut flex h-8 items-center gap-1.5 bg-accent px-3 font-display text-[11px] font-bold uppercase tracking-[0.1em] text-background transition-colors hover:bg-acid-400 active:bg-acid-600"
        >
          <CtaIcon className="h-3.5 w-3.5" strokeWidth={1.75} />
          {cfg.cta}
        </Link>
        <Link
          href={cfg.altHref}
          className="flex h-8 items-center px-3 font-display text-[11px] font-bold uppercase tracking-[0.1em] text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
        >
          {cfg.alt}
        </Link>
      </div>
    </div>
  );
}
