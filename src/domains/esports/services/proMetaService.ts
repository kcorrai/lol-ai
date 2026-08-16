import { cachedComputation, TTL } from "@/domains/esports/services/esportsApi";
import { getCompleted } from "@/domains/esports/services/scheduleService";
import { getMatch } from "@/domains/esports/services/matchService";
import { getGameStats } from "@/domains/esports/services/gameStatsService";
import { aggregateProMeta } from "@/domains/esports/proMeta";
import type { GameStats, ProMeta } from "@/domains/esports/types";

const CACHE_TYPE = "esports-pro-meta";

/**
 * How many finished series the sample walks.
 *
 * This is the cost knob for the whole cluster. Each series costs one match
 * lookup, and each game inside it two livestats reads — so 24 series is roughly
 * 150 feed requests to build from nothing. Every one of those reads is cached
 * for a month and shared with the match pages, so the second scope over the same
 * league is nearly free; it is the first, cold build that this number bounds.
 *
 * The all-leagues scope walks fewer series than it could because it spans every
 * region at once and the aggregate is the same shape either way.
 */
const SERIES_PER_LEAGUE = 24;
const SERIES_ALL_LEAGUES = 30;

/** Feed reads in flight at once. Enough to not be slow; not enough to look like a scrape. */
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

/** Every finished game in the most recent series, as game stats. */
async function collectGames(leagueId: string | undefined, series: number): Promise<GameStats[]> {
  const events = await getCompleted(leagueId ? { leagueId, limit: series } : { limit: series });

  const matches = await mapWithConcurrency(events, CONCURRENCY, (event) =>
    getMatch(event.matchId)
  );

  const gameIds = matches
    .flatMap((match) => match?.games ?? [])
    .filter((game) => game.state === "completed")
    .map((game) => game.id);

  const stats = await mapWithConcurrency(gameIds, CONCURRENCY, (gameId) =>
    getGameStats(gameId, { completed: true })
  );

  return stats.filter((entry): entry is GameStats => entry !== null);
}

export interface ProMetaQuery {
  /** Feed league id. Omitted aggregates every league in the recent window. */
  leagueId?: string;
}

/**
 * What the pros are picking, and how it is going for them.
 *
 * Cached for an hour: the sample only moves on a match day, and rebuilding it is
 * the most expensive read in the section. A failed rebuild serves the last good
 * aggregate rather than an empty table.
 */
export async function getProMeta({ leagueId }: ProMetaQuery = {}): Promise<ProMeta | null> {
  const series = leagueId ? SERIES_PER_LEAGUE : SERIES_ALL_LEAGUES;

  return cachedComputation({
    key: `pro-meta:${leagueId ?? "all"}`,
    type: CACHE_TYPE,
    ttlDays: TTL.standings,
    compute: async () => aggregateProMeta(await collectGames(leagueId, series)),
  });
}
