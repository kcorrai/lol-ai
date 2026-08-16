import { z } from "zod";
import { perRequest } from "@/lib/utils/perRequest";
import {
  cachedResource,
  esportsFetch,
  httpsAsset,
  TTL,
} from "@/domains/esports/services/esportsApi";
import type {
  EsportsLeague,
  EsportsTournament,
  LeagueDisplayStatus,
} from "@/domains/esports/types";

const CACHE_TYPE = "esports-league";

const DISPLAY_STATUSES = ["force_selected", "selected", "not_selected", "hidden"] as const;

const LeagueSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  region: z.string(),
  image: z.string().nullish(),
  displayPriority: z
    .object({
      position: z.number().nullish(),
      status: z.string().nullish(),
    })
    .nullish(),
});

const LeaguesResponseSchema = z.object({
  data: z.object({ leagues: z.array(LeagueSchema) }),
});

const TournamentSchema = z.object({
  id: z.string(),
  slug: z.string(),
  startDate: z.string().nullish(),
  endDate: z.string().nullish(),
});

const TournamentsResponseSchema = z.object({
  data: z.object({
    leagues: z.array(z.object({ tournaments: z.array(TournamentSchema) })),
  }),
});

function parseDisplayStatus(raw: string | null | undefined): LeagueDisplayStatus {
  return (DISPLAY_STATUSES as readonly string[]).includes(raw ?? "")
    ? (raw as LeagueDisplayStatus)
    : // An unrecognised status should not promote a league above the ones Riot
      // actually features, so it lands in the least prominent band.
      "hidden";
}

// Riot's own client orders leagues by display band first and position within the
// band second. `priority` looks like it should matter but is 1 for every league,
// so it is ignored here rather than sorted on.
const STATUS_RANK: Record<LeagueDisplayStatus, number> = {
  force_selected: 0,
  selected: 1,
  not_selected: 2,
  hidden: 3,
};

function compareLeagues(a: EsportsLeague, b: EsportsLeague): number {
  const byStatus = STATUS_RANK[a.displayStatus] - STATUS_RANK[b.displayStatus];
  if (byStatus !== 0) return byStatus;
  const byPosition = a.displayPosition - b.displayPosition;
  if (byPosition !== 0) return byPosition;
  return a.name.localeCompare(b.name);
}

/**
 * The most prominent leagues, in Riot's own order.
 *
 * `displayStatus` alone is the wrong bar for this and it is worth writing down
 * why: the band is a live merchandising signal, not a tier. At the time of
 * writing `selected` holds LCS, CBLOL, Americas Cup, LEC, EWC and CACG, while
 * **LCK and LPL sit in `not_selected`** and LTA North and South are `hidden`
 * outright. Filtering on the band drops the two biggest leagues in the world.
 *
 * What the feed does get right is the order *within* each band — `not_selected`
 * position 0 is LCK, 1 is LPL, 2 is LCP — so taking the head of the full sorted
 * list gives a stable, feed-driven prominence ranking that survives Riot moving
 * a league between bands mid-season. Hidden leagues are still excluded: that
 * band is the one that does mean "not being shown".
 */
export function prominentLeagues(leagues: EsportsLeague[], limit: number): EsportsLeague[] {
  return leagues.filter((league) => league.displayStatus !== "hidden").slice(0, limit);
}

function mapLeagues(parsed: z.infer<typeof LeaguesResponseSchema>): EsportsLeague[] {
  return parsed.data.leagues
    .map((raw) => ({
      id: raw.id,
      slug: raw.slug,
      name: raw.name,
      region: raw.region,
      image: httpsAsset(raw.image),
      displayStatus: parseDisplayStatus(raw.displayPriority?.status),
      // Missing position sorts last within its band rather than first.
      displayPosition: raw.displayPriority?.position ?? Number.MAX_SAFE_INTEGER,
    }))
    .sort(compareLeagues);
}

/**
 * Every league the feed publishes, in Riot's own display order. Hidden leagues
 * are included — some of them are real competitions — and callers that want only
 * the prominent ones filter on `displayStatus`.
 */
export async function getLeagues(): Promise<EsportsLeague[]> {
  const leagues = await cachedResource({
    key: "leagues",
    type: CACHE_TYPE,
    ttlDays: TTL.static,
    schema: LeaguesResponseSchema,
    fetcher: () => esportsFetch("getLeagues"),
    map: mapLeagues,
  });
  return leagues ?? [];
}

/** One league by its feed slug, or null when the slug is unknown. */
export async function getLeague(slug: string): Promise<EsportsLeague | null> {
  const needle = slug.toLowerCase();
  const leagues = await getLeagues();
  return leagues.find((league) => league.slug.toLowerCase() === needle) ?? null;
}

/**
 * A league's tournaments (splits), newest first. The feed already returns them in
 * descending date order, but that is not documented anywhere, so the sort is
 * explicit.
 */
export async function getTournamentsForLeague(leagueId: string): Promise<EsportsTournament[]> {
  const tournaments = await cachedResource({
    key: `tournaments:${leagueId}`,
    type: CACHE_TYPE,
    ttlDays: TTL.tournaments,
    schema: TournamentsResponseSchema,
    fetcher: () => esportsFetch("getTournamentsForLeague", { params: { leagueId } }),
    map: (parsed): EsportsTournament[] =>
      parsed.data.leagues
        .flatMap((league) => league.tournaments)
        .map((raw) => ({
          id: raw.id,
          slug: raw.slug,
          startDate: raw.startDate ?? null,
          endDate: raw.endDate ?? null,
          leagueId,
        }))
        .sort((a, b) => (b.startDate ?? "").localeCompare(a.startDate ?? "")),
  });
  return tournaments ?? [];
}

/**
 * The split a league hub should lead with: the one running today, or failing
 * that the most recent one to have started.
 *
 * Not simply "the newest": next year's split is often published months early,
 * and leading with a tournament that has not begun would show an empty table
 * while the split people are actually watching sits a click away.
 */
export function pickCurrentTournament(
  tournaments: EsportsTournament[],
  now: Date
): EsportsTournament | null {
  if (tournaments.length === 0) return null;

  const today = now.toISOString().slice(0, 10);

  const running = tournaments.find(
    (t) => t.startDate && t.startDate <= today && (!t.endDate || t.endDate >= today)
  );
  if (running) return running;

  // Sorted newest first, so the first already-started split is the latest one.
  return tournaments.find((t) => t.startDate && t.startDate <= today) ?? tournaments[0];
}

/** `pickCurrentTournament` over a league's cached tournament list. */
export async function getCurrentTournament(
  leagueId: string,
  now: Date = new Date()
): Promise<EsportsTournament | null> {
  return pickCurrentTournament(await getTournamentsForLeague(leagueId), now);
}

/** A tournament with the league it belongs to — what a tournament page needs. */
export interface TournamentEntry {
  tournament: EsportsTournament;
  league: EsportsLeague;
}

/**
 * How far down the prominence order tournament pages are published.
 *
 * Every league below this still has its own hub with standings and results; what
 * it does not get is a page per split, because the long tail publishes splits
 * with no standings and no bracket behind them (ADR-017 §4).
 */
const TOURNAMENT_LEAGUE_LIMIT = 12;

/**
 * Every tournament worth a page, and the league each belongs to.
 *
 * Built by walking the prominent leagues rather than by asking for a tournament
 * by slug, because the feed has no such endpoint — `getTournamentsForLeague` is
 * the only way in, and it needs a league id. Each league's list is cached for an
 * hour on its own, so this is a dozen cache reads rather than a dozen requests.
 *
 * Memoised per request as well: a tournament page resolves its slug once in
 * `generateMetadata` and again while rendering, and without this a cold cache
 * would walk all twelve leagues twice for one page view.
 */
export const getTournamentIndex = perRequest(async function getTournamentIndex(): Promise<
  TournamentEntry[]
> {
  const leagues = prominentLeagues(await getLeagues(), TOURNAMENT_LEAGUE_LIMIT);

  const perLeague = await Promise.all(
    leagues.map(async (league) => {
      const tournaments = await getTournamentsForLeague(league.id);
      return tournaments.map((tournament) => ({ tournament, league }));
    })
  );

  return perLeague.flat();
});

/** One tournament by its feed slug, or null when nothing published carries it. */
export async function getTournament(slug: string): Promise<TournamentEntry | null> {
  const needle = slug.toLowerCase();
  const index = await getTournamentIndex();
  return index.find((entry) => entry.tournament.slug.toLowerCase() === needle) ?? null;
}
