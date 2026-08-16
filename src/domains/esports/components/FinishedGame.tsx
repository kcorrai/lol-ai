import { DraftPanel } from "@/domains/esports/components/DraftPanel";
import { Scoreboard } from "@/domains/esports/components/Scoreboard";
import { StatSheet, hasFinalStats } from "@/domains/esports/components/StatSheet";
import { GoldCurve } from "@/domains/esports/components/GoldCurve";
import { ObjectiveLedger } from "@/domains/esports/components/ObjectiveLedger";
import { formatDuration } from "@/domains/esports/duration";
import { peakLead } from "@/domains/esports/timeline";
import type { GameStats, GameTimeline } from "@/domains/esports/types";

/**
 * Everything there is to say about one finished game: the draft, the
 * scoreboard, the shape of the game, and the stat lines it ended on.
 *
 * Extracted from the match page when that page passed the component size limit.
 * The live counterpart is `LiveGameStats`, which shows the first two of these
 * and refreshes them — a game still being played has no final anything.
 */

function Section({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <section className="mt-12 first:mt-0">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-xl font-extrabold uppercase text-text md:text-2xl">
          {title}
        </h2>
        {aside ? <span className="hud-label">{aside}</span> : null}
      </div>
      {children}
    </section>
  );
}

export function FinishedGame({
  stats,
  timeline,
  blueName,
  redName,
}: {
  stats: GameStats;
  /** Null when the walk found nothing — the other three sections still render. */
  timeline: GameTimeline | null;
  blueName: string;
  redName: string;
}): React.ReactElement {
  const peak = timeline ? peakLead(timeline) : null;
  const sides = { blue: stats.blue, red: stats.red, blueName, redName };

  return (
    <>
      <Section title="Draft" aside={stats.patch ? `Patch ${stats.patch}` : undefined}>
        <DraftPanel {...sides} />
      </Section>

      <Section
        title="Scoreboard"
        aside={
          stats.durationSeconds !== null ? `${formatDuration(stats.durationSeconds)} game` : undefined
        }
      >
        <Scoreboard {...sides} durationSeconds={stats.durationSeconds} />
      </Section>

      {/* One sample is a dot, not a curve. */}
      {timeline && timeline.samples.length > 1 && (
        <Section
          title="How the game went"
          aside={
            peak
              ? `Biggest lead ${(peak.gold / 1000).toFixed(1)}k · ${
                  peak.side === "blue" ? blueName : redName
                }`
              : undefined
          }
        >
          <div className="grid gap-4">
            <GoldCurve timeline={timeline} />
            <ObjectiveLedger timeline={timeline} blueName={blueName} redName={redName} />
          </div>
        </Section>
      )}

      {/* What they were holding, as opposed to what they did with it. */}
      {hasFinalStats(stats.blue, stats.red) && (
        <Section title="Final stats" aside="Attack speed and life steal are percentages">
          <StatSheet {...sides} />
        </Section>
      )}
    </>
  );
}
