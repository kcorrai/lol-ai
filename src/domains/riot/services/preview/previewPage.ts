import { getAccountByRiotId, getMatch, getMatchIds } from "@/domains/riot/services/riotApiClient";
import { toPreviewMatch, toPreviewScoreboard } from "@/domains/riot/services/preview/previewMapper";
import { MATCH_DEPTH } from "@/domains/riot/services/preview/previewSource";
import { buildCacheKey, getCached, setCached } from "@/lib/ai/aiCache";
import type { MatchDTO } from "@/domains/riot/types/riot.types";
import type { PreviewMatch, PreviewScoreboard } from "@/types/preview";
import type { PublicMatchesResponse } from "@/types/publicMatches";

const CACHE_TTL_DAYS = 1;

/**
 * A page of match rows past the profile's first ten.
 *
 * The opening page is server-rendered by `buildPublicProfile` so the profile is complete for a
 * crawler with no JavaScript; this is what "load more" asks for. It is a separate builder rather
 * than a `depth` argument on that one because the two have different cache lifetimes in practice:
 * the first page is hit by every visitor to a profile, a fourth page by almost none.
 *
 * `start` is clamped rather than validated into an error: the caller is a public, IP-rate-limited
 * route, and a nonsense offset should cost one empty page, not a 400 and a retry loop.
 */
export async function buildPublicMatchPage(
  gameName: string,
  tagLine: string,
  region: string,
  start: number,
  count: number = MATCH_DEPTH
): Promise<PublicMatchesResponse> {
  const safeStart = Math.max(0, Math.trunc(start));
  const safeCount = Math.min(Math.max(1, Math.trunc(count)), MATCH_DEPTH);

  const cacheKey = buildCacheKey("public-matches-v1", {
    gameName,
    tagLine,
    region,
    start: String(safeStart),
    count: String(safeCount),
  });

  const cached = await readCache(cacheKey);
  if (cached) return cached;

  const account = await getAccountByRiotId(gameName, tagLine, region);
  const matchIds = await getMatchIds(account.puuid, region, safeCount, safeStart);

  const dtos = (
    await Promise.all(matchIds.map((id) => getMatch(id, region).catch(() => null)))
  ).filter((m): m is MatchDTO => m !== null);

  const matches: PreviewMatch[] = [];
  const scoreboards: Record<string, PreviewScoreboard> = {};
  for (const dto of dtos) {
    const row = toPreviewMatch(dto, account.puuid);
    if (!row) continue;
    matches.push(row);
    scoreboards[row.matchId] = toPreviewScoreboard(dto);
  }

  const result: PublicMatchesResponse = {
    matches,
    scoreboards,
    // Advanced by the ids Riot returned, not by the rows we kept: a page whose matches all failed
    // to fetch is a reason to offer the next page, not to declare the history over.
    nextStart: matchIds.length === safeCount ? safeStart + safeCount : null,
  };

  await writeCache(cacheKey, result);
  return result;
}

/** A cache outage must never be the reason a page of matches fails to load (TASK-285). */
async function readCache(key: string): Promise<PublicMatchesResponse | null> {
  try {
    return ((await getCached(key)) as PublicMatchesResponse | null) ?? null;
  } catch {
    return null;
  }
}

async function writeCache(key: string, value: PublicMatchesResponse): Promise<void> {
  try {
    await setCached(key, "preview", value, CACHE_TTL_DAYS);
  } catch {
    // Cache unavailable — serve the freshly built page anyway.
  }
}
