import { perRequest } from "@/lib/utils/perRequest";
import { cachedComputation, cachedValue, TTL } from "@/domains/esports/services/esportsApi";
import { getCompleted } from "@/domains/esports/services/scheduleService";
import { getMatch } from "@/domains/esports/services/matchService";
import { getGameStats } from "@/domains/esports/services/gameStatsService";
import { aggregateProMeta } from "@/domains/esports/proMeta";
import { aggregateProBuilds } from "@/domains/esports/proBuild";
import type { BuildItemCatalogue } from "@/domains/esports/proBuild";
import { fetchItems } from "@/lib/ddragon/itemsData";
import type { ItemInfo } from "@/lib/ddragon/itemsData";
import type { MatchDetail, ProChampionBuild, ProMeta, SampledGame } from "@/domains/esports/types";

const CACHE_TYPE = "esports-pro-meta";

/**
 * How many finished series the sample walks.
 *
 * This is the cost knob for the whole pro-play cluster. Each series costs one
 * match lookup and each game inside it two livestats reads, so 24 series is
 * roughly 150 feed requests to build from nothing. Every one of those reads is
 * cached for a month and shared with the match pages, so the second scope over
 * the same league is nearly free; it is the first, cold build this bounds.
 */
const SERIES_PER_LEAGUE = 24;
const SERIES_ALL_LEAGUES = 30;

/** Feed reads in flight at once. Enough not to be slow; not enough to look like a scrape. */
const CONCURRENCY = 6;

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;

  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    for (let index = cursor++; index < items.length; index = cursor++) {
      results[index] = await fn(items[index]);
    }
  });

  await Promise.all(workers);
  return results;
}

interface GameRef {
  match: MatchDetail;
  gameId: string;
  gameNumber: number;
}

/**
 * Names the two sides.
 *
 * The team ids on `getEventDetails`' game objects disagree with the livestats
 * payload about which side is which — the match page documents the same trap.
 * Livestats wins, because its team id sits beside the five players it lists, so
 * the side names come from `stats`, and the match only supplies id → name.
 */
function nameSides(
  match: MatchDetail,
  blueTeamId: string | null,
  redTeamId: string | null
): { blue: string | null; red: string | null } {
  const byId = new Map(match.teams.map((team) => [team.id, team.name]));
  return {
    blue: blueTeamId ? (byId.get(blueTeamId) ?? null) : null,
    red: redTeamId ? (byId.get(redTeamId) ?? null) : null,
  };
}

/** Every finished game in the most recent series, with the context to link back. */
async function collectSample(leagueId: string | undefined, series: number): Promise<SampledGame[]> {
  const events = await getCompleted(leagueId ? { leagueId, limit: series } : { limit: series });

  const matches = await mapWithConcurrency(events, CONCURRENCY, (event) => getMatch(event.matchId));

  const refs: GameRef[] = matches.flatMap((match) =>
    match
      ? match.games
          .filter((game) => game.state === "completed")
          .map((game) => ({ match, gameId: game.id, gameNumber: game.number }))
      : []
  );

  const sampled = await mapWithConcurrency(refs, CONCURRENCY, async (ref) => {
    const stats = await getGameStats(ref.gameId, { completed: true });
    if (!stats) return null;

    const names = nameSides(ref.match, stats.blue.teamId, stats.red.teamId);
    return {
      matchId: ref.match.matchId,
      gameNumber: ref.gameNumber,
      leagueName: ref.match.league.name,
      blueTeamName: names.blue,
      redTeamName: names.red,
      stats,
    } satisfies SampledGame;
  });

  return sampled.filter((game): game is SampledGame => game !== null);
}

export interface ProSample {
  meta: ProMeta;
  builds: Record<string, ProChampionBuild>;
}

export interface ProSampleQuery {
  /** Feed league id. Omitted aggregates every league in the recent window. */
  leagueId?: string;
}

/**
 * One walk of the recent pro games, producing both the pick/win table and the
 * per-champion builds.
 *
 * They share a walk deliberately: computing them apart would double the cache
 * reads for the same games and let the two disagree about which games they were
 * looking at, which is the kind of drift a reader notices by comparing a pick
 * count on one page with a game count on another.
 *
 * Cached for an hour — the sample only moves on a match day, and rebuilding it
 * is the most expensive read in the section. A failed rebuild serves the last
 * good sample rather than an empty table.
 *
 * Wrapped in React's `cache` as well, which is not the same thing: a champion
 * page asks for the sample once in `generateMetadata` and again while
 * rendering, and without request-level memoisation a cold cache would walk the
 * whole feed twice for one page view.
 */
export const getProSample = perRequest(async function getProSample({
  leagueId,
}: ProSampleQuery = {}): Promise<ProSample | null> {
  const series = leagueId ? SERIES_PER_LEAGUE : SERIES_ALL_LEAGUES;

  return cachedComputation({
    key: `pro-sample:${leagueId ?? "all"}`,
    type: CACHE_TYPE,
    ttlDays: TTL.standings,
    compute: async (): Promise<ProSample> => {
      const [games, items] = await Promise.all([
        collectSample(leagueId, series),
        // Item facts are a nicety: without them the builds carry no item list,
        // which is a worse page but not a broken one.
        fetchItems().catch(() => new Map<number, ItemInfo>()),
      ]);

      const catalogue: BuildItemCatalogue = new Map(
        [...items].map(([id, info]) => [
          id,
          { gold: info.gold, finished: info.finished, consumable: info.consumable },
        ])
      );

      return {
        meta: aggregateProMeta(games.map((game) => game.stats)),
        builds: aggregateProBuilds(games, catalogue),
      };
    },
  });
});

/**
 * The pro sample if it is already cached, and nothing at all if it is not.
 *
 * This is what the champion cluster reads. `/builds/[champion]` exists to answer
 * a question about ranked, and it must never block on a walk of the pro feed to
 * do it (TASK-310) — so a cold cache means no pro strip on that page, not a
 * slower page.
 */
export const getCachedProSample = perRequest(async function getCachedProSample(): Promise<ProSample | null> {
  return cachedValue<ProSample>("pro-sample:all");
});
