import Link from "next/link";
import type { CounterResult } from "@/domains/meta";
import { GameLengthCurve } from "@/domains/meta/components/build/GameLengthCurve";
import { TrendSparkline } from "@/domains/meta/components/build/TrendSparkline";
import { counterHowToPlay } from "./counterText";

interface CounterInsightsProps {
  data: CounterResult;
  laneLabel: string;
  gamePatch: string;
  enemyTips: string[];
}

// The data-rich "how to play against X" block: generated paragraph, the champion's
// game-length curve + patch trend, and a link to its full build.
export function CounterInsights({ data, laneLabel, gamePatch, enemyTips }: CounterInsightsProps) {
  const curve = data.build?.gameLengths ?? [];
  const trend = data.build?.trend ?? [];
  const hasCharts = curve.length > 0 || trend.length >= 2;

  return (
    <div className="mt-12">
      <h2 className="mb-3 font-display text-lg font-bold text-text">
        How to play against {data.name}
      </h2>
      <p className="leading-relaxed text-text-muted">
        {counterHowToPlay(data, laneLabel, gamePatch, enemyTips)}
      </p>

      {hasCharts && (
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {curve.length > 0 && <GameLengthCurve points={curve} />}
          {trend.length >= 2 && <TrendSparkline trend={trend} />}
        </div>
      )}

      <Link
        href={`/builds/${data.championKey}`}
        className="mt-6 inline-block rounded-lg border border-border bg-surface px-4 py-2 text-sm text-text-muted hover:border-accent/40 hover:text-text"
      >
        {data.name} build, runes &amp; skill order →
      </Link>
    </div>
  );
}
