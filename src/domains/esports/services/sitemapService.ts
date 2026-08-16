import { logger } from "@/lib/utils/logger";
import { getLeagues, prominentLeagues } from "@/domains/esports/services/leagueService";
import { getTeams, indexableTeams } from "@/domains/esports/services/teamService";
import { getPlayerIndex } from "@/domains/esports/services/playerService";
import { getUpcoming, getCompleted } from "@/domains/esports/services/scheduleService";
import type { EsportsLeague, EsportsTeam, PlayerEntry } from "@/domains/esports/types";

/** Deliberately not Next's `MetadataRoute` — the domain does not know about the app shell. */
export interface EsportsSitemapEntry {
  /** Site-relative, always starting with a slash. */
  path: string;
  lastModified?: Date;
  changeFrequency: "hourly" | "daily" | "weekly" | "monthly";
  priority: number;
}

/**
 * How far the match list reaches. The feed answers in windows of ~80 events, so
 * this is two windows either side of now — roughly the current and previous
 * split. Older matches stay reachable through league and team pages; they are
 * simply not worth asking a crawler to revisit (TASK-309).
 */
const MATCH_WINDOW = 200;

const SECTION_ROOTS: EsportsSitemapEntry[] = [
  { path: "/esports", changeFrequency: "hourly", priority: 0.9 },
  { path: "/esports/schedule", changeFrequency: "hourly", priority: 0.9 },
  { path: "/esports/leagues", changeFrequency: "weekly", priority: 0.7 },
  { path: "/esports/teams", changeFrequency: "weekly", priority: 0.7 },
  { path: "/esports/champions", changeFrequency: "daily", priority: 0.8 },
];

/**
 * Leagues worth publishing. `hidden` is Riot's own signal that a league is not
 * being featured — some are real but dormant — and a dormant league's page is
 * standings from a split nobody is searching for.
 */
function publishableLeagues(leagues: EsportsLeague[]): EsportsLeague[] {
  return leagues.filter((league) => league.displayStatus !== "hidden");
}

/**
 * How far down the prominence order player pages are published. Twelve reaches
 * LCK, LPL and LCP — the bands alone would not (see `prominentLeagues`).
 */
const PLAYER_LEAGUE_LIMIT = 12;

function leagueNameSet(leagues: EsportsLeague[]): Set<string> {
  return new Set(leagues.map((league) => league.name.toLowerCase()));
}

/**
 * Teams that pass both bars: the has-content rule (`indexableTeams` — active, in
 * a league, with a roster) and a league anyone is looking for.
 */
function publishableTeams(teams: EsportsTeam[], leagueNames: Set<string>): EsportsTeam[] {
  return indexableTeams(teams).filter((team) =>
    leagueNames.has(team.league?.name.toLowerCase() ?? "")
  );
}

/**
 * Starters in the leagues at the top of the prominence order.
 *
 * ADR-017 §4 excludes a player with no recorded games, but proving that costs a
 * per-player walk of the game feed — thousands of requests to build one file.
 * Two cheap proxies stand in. Role removes staff and unassigned substitutes,
 * who never appear in a scoreboard. The league bar removes the rest: Riot
 * publishes per-game livestats for the leagues at the top and, for most of the
 * long tail, not at all — so a player page outside them usually carries a name
 * and a team and nothing else.
 *
 * Teams stay on the wider bar. A team page is a roster and a fixture list, and
 * both of those exist for any league on the schedule.
 */
function publishablePlayers(index: PlayerEntry[], leagueNames: Set<string>): PlayerEntry[] {
  return index.filter(
    (entry) =>
      entry.player.role !== null && leagueNames.has(entry.team.league?.name.toLowerCase() ?? "")
  );
}

/**
 * Every esports URL worth putting in front of a crawler, computed from the
 * cached indexes rather than enumerated (ADR-017 §4).
 */
export async function esportsSitemapEntries(): Promise<EsportsSitemapEntry[]> {
  const [leagues, teams, players, upcoming, completed] = await Promise.all([
    getLeagues(),
    getTeams(),
    getPlayerIndex(),
    getUpcoming({ limit: MATCH_WINDOW }),
    getCompleted({ limit: MATCH_WINDOW }),
  ]);

  const published = publishableLeagues(leagues);
  const teamList = publishableTeams(teams, leagueNameSet(published));
  const playerList = publishablePlayers(
    players,
    leagueNameSet(prominentLeagues(leagues, PLAYER_LEAGUE_LIMIT))
  );

  const entries: EsportsSitemapEntry[] = [
    ...SECTION_ROOTS,
    ...published.map((league) => ({
      path: `/esports/leagues/${league.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...teamList.map((team) => ({
      path: `/esports/teams/${team.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...playerList.map((entry) => ({
      path: `/esports/players/${entry.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
    ...upcoming.map((event) => ({
      path: `/esports/matches/${event.matchId}`,
      changeFrequency: "daily" as const,
      priority: 0.6,
    })),
    ...completed.map((event) => ({
      path: `/esports/matches/${event.matchId}`,
      lastModified: new Date(event.startTime),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
  ];

  // A live series appears in both windows for as long as it is running.
  const seen = new Set<string>();
  const deduped = entries.filter((entry) => {
    if (seen.has(entry.path)) return false;
    seen.add(entry.path);
    return true;
  });

  // The counts are the only way to notice the feed going quiet: a sitemap that
  // silently shrinks from 3000 URLs to 40 looks exactly like a healthy one.
  logger.info("esports sitemap generated", {
    total: deduped.length,
    leagues: published.length,
    teams: teamList.length,
    players: playerList.length,
    matches:
      deduped.length -
      SECTION_ROOTS.length -
      published.length -
      teamList.length -
      playerList.length,
  });

  return deduped;
}
