"use client";

import { MatchTime } from "@/domains/esports/components/MatchTime";
import { StatBlock } from "@/components/dashboard/laneiq/HudPanel";

interface HubStatsProps {
  leagues: number;
  matchesToday: number;
  /** ISO kickoff of the next unstarted match, or null when the calendar is empty. */
  nextStart: string | null;
}

/**
 * The three numbers beside the title.
 *
 * "Next start" is a clock rather than a countdown on purpose: the page is served from a five
 * minute cache, so a rendered "in 41m" would be wrong by up to five minutes for most readers,
 * while a kickoff time stays true however long the HTML sits in front of them.
 */
export function HubStats({ leagues, matchesToday, nextStart }: HubStatsProps): React.ReactElement {
  return (
    <div className="flex flex-wrap gap-7 pb-1">
      <StatBlock label="Leagues" value={String(leagues)} />
      <StatBlock label="Matches today" value={String(matchesToday)} />
      <div>
        <p className="hud-label">Next start</p>
        {nextStart ? (
          <MatchTime
            startTime={nextStart}
            className="mt-1 block font-mono text-base font-bold tabular-nums text-text"
          />
        ) : (
          <p className="mt-1 font-mono text-base font-bold text-text-muted">—</p>
        )}
      </div>
    </div>
  );
}
