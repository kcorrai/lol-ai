import { getTournamentIndex, type TournamentEntry } from "@/domains/esports/services/leagueService";
import { getStandings } from "@/domains/esports/services/standingsService";
import {
  daysBetween,
  groupTournaments,
  isoDay,
  tournamentChampion,
  type TournamentChampion,
} from "@/domains/esports/tournaments";

/** A tournament in the overview, with its champion once it has one. */
export interface TournamentOverviewEntry extends TournamentEntry {
  champion: TournamentChampion | null;
}

export interface TournamentOverview {
  /** Today, as the overview judged it — the pages count days from the same one. */
  today: string;
  running: TournamentOverviewEntry[];
  upcoming: TournamentOverviewEntry[];
  finished: TournamentOverviewEntry[];
}

/**
 * How far ahead "coming up" looks. Next year's splits are published months in
 * advance, and listing all of them would bury the one starting next week.
 */
const UPCOMING_HORIZON_DAYS = 120;

/**
 * How many finished tournaments the overview names a champion for. Each costs a
 * standings read (cached for an hour), and older splits are a click away on
 * their league's page.
 */
const FINISHED_LIMIT = 6;

function withoutChampion(entry: TournamentEntry): TournamentOverviewEntry {
  return { ...entry, champion: null };
}

/**
 * Every tournament of the prominent leagues, split into what is on now, what
 * is coming up and what has just finished — with the winner of each finished
 * one.
 *
 * A tournament the feed published without a start date is left out: it cannot
 * be placed on either side of today, and guessing would put it under "now".
 */
export async function getTournamentOverview(now: Date = new Date()): Promise<TournamentOverview> {
  const today = isoDay(now);
  const dated = (await getTournamentIndex()).filter((entry) => entry.tournament.startDate);
  const groups = groupTournaments(dated, today);

  const upcoming = groups.upcoming.filter(
    (entry) =>
      entry.tournament.startDate !== null &&
      daysBetween(today, entry.tournament.startDate) <= UPCOMING_HORIZON_DAYS
  );

  const finished = await Promise.all(
    groups.finished.slice(0, FINISHED_LIMIT).map(async (entry) => ({
      ...entry,
      champion: tournamentChampion(await getStandings(entry.tournament.id)),
    }))
  );

  return {
    today,
    running: groups.running.map(withoutChampion),
    upcoming: upcoming.map(withoutChampion),
    finished,
  };
}
