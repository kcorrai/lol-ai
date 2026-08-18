import { StatBlock, type StatTone } from "@/domains/esports/components/StatBlock";
import type { TeamRecord } from "@/domains/esports/teamRecord";
import type { StandingsRow } from "@/domains/esports/types";

interface TeamSeasonStripProps {
  record: TeamRecord;
  /** The team's own row in its league table, when it has one. */
  placement: StandingsRow | undefined;
  /** How many teams that table holds — the denominator of the placement. */
  tableSize: number;
  rosterSize: number;
}

function Cell({ children }: { children: React.ReactNode }): React.ReactElement {
  return <div className="bg-background px-4 py-3.5">{children}</div>;
}

function winRateTone(winRate: number | null): StatTone {
  if (winRate === null) return "default";
  if (winRate >= 60) return "accent";
  if (winRate < 40) return "loss";
  return "warn";
}

/**
 * The four numbers that describe a team's split, under its name.
 *
 * "Record" here is over the results the section caches — the last ten series —
 * so the label says record and never "season", which is a longer window than
 * anything on this page can see.
 */
export function TeamSeasonStrip({
  record,
  placement,
  tableSize,
  rosterSize,
}: TeamSeasonStripProps): React.ReactElement {
  return (
    <>
      <Cell>
        <StatBlock
          label="Series record"
          value={`${record.series.wins}–${record.series.losses}`}
          unit={
            record.seriesWinRate === null ? undefined : `${record.seriesWinRate.toFixed(0)}% win`
          }
          tone={winRateTone(record.seriesWinRate)}
        />
      </Cell>
      <Cell>
        <StatBlock
          label="Game record"
          value={`${record.games.wins}–${record.games.losses}`}
          unit="games"
        />
      </Cell>
      <Cell>
        <StatBlock
          label="Placement"
          value={placement ? (placement.tied ? `T${placement.rank}` : `${placement.rank}`) : "—"}
          unit={placement ? `of ${tableSize}` : "not in a table"}
        />
      </Cell>
      <Cell>
        <StatBlock label="Roster" value={String(rosterSize)} unit="listed" />
      </Cell>
    </>
  );
}
