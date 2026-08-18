import type { EsportsEvent, EsportsEventTeam, EsportsTeam } from "@/domains/esports/types";

export interface TeamRecord {
  /** Series decided one way or the other. Anything the feed left open is skipped. */
  series: { wins: number; losses: number };
  /** Individual games across those series — a 2-1 and a 2-0 is 4-1 on games. */
  games: { wins: number; losses: number };
  /** Percentage of decided series won, or null when none have been. */
  seriesWinRate: number | null;
}

/**
 * The schedule payload identifies teams by name and code only — no ids — so
 * matching is on those, the same way `getTeamMatches` and `headToHead` do it.
 */
function sideFor(event: EsportsEvent, team: EsportsTeam): EsportsEventTeam | undefined {
  return event.teams.find(
    (entry) =>
      entry.code.toLowerCase() === team.code.toLowerCase() ||
      entry.name.toLowerCase() === team.name.toLowerCase()
  );
}

/**
 * A team's record over the results the section has cached.
 *
 * Not a season record and never labelled as one: `getTeamMatches` keeps the last
 * ten series, so this is what those ten say. Games are counted from the series
 * scores rather than assumed from the outcome, because a 2-1 win and a 2-0 win
 * are the same series result and different game records.
 */
export function teamRecord(team: EsportsTeam, results: EsportsEvent[]): TeamRecord {
  const record: TeamRecord = {
    series: { wins: 0, losses: 0 },
    games: { wins: 0, losses: 0 },
    seriesWinRate: null,
  };

  for (const event of results) {
    const side = sideFor(event, team);
    if (!side) continue;
    const opponent = event.teams.find((entry) => entry !== side);

    record.games.wins += side.gameWins;
    record.games.losses += opponent?.gameWins ?? 0;

    if (side.outcome === "win") record.series.wins += 1;
    else if (side.outcome === "loss") record.series.losses += 1;
  }

  const decided = record.series.wins + record.series.losses;
  if (decided > 0) record.seriesWinRate = (record.series.wins / decided) * 100;

  return record;
}
