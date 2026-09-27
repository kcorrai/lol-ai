"use client";

import { useLiveTimeline } from "@/hooks/useLiveEsports";
import { GoldCurve } from "@/domains/esports/components/GoldCurve";
import { formatGoldK } from "@/domains/esports/goldCurveGeometry";
import { goldDiff, sampleClock } from "@/domains/esports/timeline";
import type { GameTimeline } from "@/domains/esports/types";

/** "T1 +2.3k at 16:00", or level — the lead as of the newest sample. */
function currentLead(timeline: GameTimeline, blueName: string, redName: string): string {
  const latest = timeline.samples[timeline.samples.length - 1];
  const diff = goldDiff(latest);
  const at = sampleClock(latest.seconds);
  if (diff === 0) return `Level at ${at}`;
  return `${diff > 0 ? blueName : redName} ${formatGoldK(Math.abs(diff))} at ${at}`;
}

/**
 * The gold curve for a game still being played, refreshed once per sampling
 * window. Renders nothing until the walk has two samples to draw a line with.
 */
export function LiveGoldCurve({
  gameId,
  initial,
  live,
  blueName,
  redName,
}: {
  gameId: string;
  initial: GameTimeline | null;
  /** False once the scoreboard reports the game finished; polling stops. */
  live: boolean;
  blueName: string;
  redName: string;
}): React.ReactElement | null {
  const { data } = useLiveTimeline(gameId, initial, live);
  const timeline = data?.timeline ?? initial;
  if (!timeline || timeline.samples.length < 2) return null;

  return (
    <section className="mt-12">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-xl font-extrabold uppercase text-text md:text-2xl">
          How the game is going
        </h2>
        <span className="hud-label">{currentLead(timeline, blueName, redName)}</span>
      </div>
      <GoldCurve timeline={timeline} blueName={blueName} redName={redName} />
    </section>
  );
}
