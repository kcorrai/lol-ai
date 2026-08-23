import { getChampionMastery } from "@/domains/riot/services/riotApiClient";
import { buildRuleBasedInsight } from "@/domains/riot/services/preview/previewInsight";
import { toPreviewMatch, toPreviewScoreboard } from "@/domains/riot/services/preview/previewMapper";
import {
  fetchPreviewSource,
  MATCH_DEPTH,
  type PreviewSource,
} from "@/domains/riot/services/preview/previewSource";
import { getCached, setCached, buildCacheKey } from "@/lib/ai/aiCache";
import { fetchAllChampions } from "@/lib/ddragon/championsData";
import type {
  PreviewChampion,
  PreviewMastery,
  PreviewMatch,
  PreviewResponse,
  PreviewScoreboard,
  PublicProfileResponse,
} from "@/types/preview";

const CACHE_TTL_DAYS = 1;
/** Top champions shown on the profile, and the mastery strip beside them. */
const TOP_CHAMPION_COUNT = 3;
const MASTERY_COUNT = 3;

function topChampionsOf(matches: PreviewMatch[]): PreviewChampion[] {
  const champMap = new Map<string, { games: number; wins: number }>();
  for (const m of matches) {
    const entry = champMap.get(m.championName) ?? { games: 0, wins: 0 };
    entry.games++;
    if (m.win) entry.wins++;
    champMap.set(m.championName, entry);
  }
  return Array.from(champMap.entries())
    .sort((a, b) => b[1].games - a[1].games)
    .slice(0, TOP_CHAMPION_COUNT)
    .map(([championName, s]) => ({
      championName,
      games: s.games,
      wins: s.wins,
      winRate: Math.round((s.wins / s.games) * 100),
    }));
}

function toPreviewResponse(source: PreviewSource, gameName: string): PreviewResponse {
  const { account, summoner, soloEntry } = source;

  const recentMatches = source.matches
    .map((dto) => toPreviewMatch(dto, account.puuid))
    .filter((m): m is PreviewMatch => m !== null);

  const topChampions = topChampionsOf(recentMatches);

  return {
    summoner: {
      gameName: account.gameName,
      tagLine: account.tagLine,
      summonerLevel: summoner.summonerLevel,
      profileIconId: summoner.profileIconId,
    },
    rank: soloEntry
      ? {
          tier: soloEntry.tier,
          division: soloEntry.rank,
          lp: soloEntry.leaguePoints,
          wins: soloEntry.wins,
          losses: soloEntry.losses,
        }
      : null,
    recentMatches,
    topChampions,
    aiInsight: buildRuleBasedInsight(gameName, soloEntry, recentMatches, topChampions),
  };
}

/**
 * Riot's mastery list carries champion *ids*; the UI needs names.
 *
 * Data Dragon's champion list is already cached for a day with a last-good fallback, so this is
 * effectively free — and if it is unavailable the mastery strip is dropped rather than rendering
 * numeric ids at a player.
 */
async function toMastery(
  entries: { championId: number; championLevel: number; championPoints: number }[]
): Promise<PreviewMastery[]> {
  const top = [...entries]
    .sort((a, b) => b.championPoints - a.championPoints)
    .slice(0, MASTERY_COUNT);
  if (top.length === 0) return [];

  const champions = await fetchAllChampions();
  const nameByKey = new Map(champions.map((c) => [c.key, c.name]));

  return top
    .map((e) => {
      const championName = nameByKey.get(String(e.championId));
      return championName
        ? {
            championId: e.championId,
            championName,
            championLevel: e.championLevel,
            championPoints: e.championPoints,
          }
        : null;
    })
    .filter((m): m is PreviewMastery => m !== null);
}

/**
 * The free public account preview: recent ranked form + top champions + a rule-based blurb.
 *
 * Feeds the landing demo box, `/api/public/preview` and the Discord bot. Caches for a day and
 * throws on Riot errors so callers can map them to status codes.
 */
export async function buildAccountPreview(
  gameName: string,
  tagLine: string,
  region: string
): Promise<PreviewResponse> {
  // The depth is part of the key: without it, raising it would keep serving day-old five-match
  // payloads to a page that says it shows ten. `v2` retires the payloads written before the rows
  // carried items, runes and CS — a stale one of those renders as a page of blanks.
  const cacheKey = buildCacheKey("preview-v2", {
    gameName,
    tagLine,
    region,
    depth: String(MATCH_DEPTH),
  });

  const cached = await readCache<PreviewResponse>(cacheKey);
  if (cached) return cached;

  const source = await fetchPreviewSource(gameName, tagLine, region);
  const result = toPreviewResponse(source, gameName);

  await writeCache(cacheKey, "preview", result);
  return result;
}

/**
 * Everything `/s/[region]/[gameName]/[tagLine]` renders.
 *
 * A superset of the preview: the same rows, plus each match's ten-player scoreboard and the
 * account's champion mastery. It keeps its own cache key rather than widening the preview's so
 * that the landing page and the Discord bot never pay to build scoreboards they do not draw —
 * the landing page is under an LCP budget (CLAUDE.md §10).
 */
export async function buildPublicProfile(
  gameName: string,
  tagLine: string,
  region: string
): Promise<PublicProfileResponse> {
  const cacheKey = buildCacheKey("public-profile-v1", {
    gameName,
    tagLine,
    region,
    depth: String(MATCH_DEPTH),
  });

  const cached = await readCache<PublicProfileResponse>(cacheKey);
  if (cached) return cached;

  const source = await fetchPreviewSource(gameName, tagLine, region);
  const preview = toPreviewResponse(source, gameName);

  // Mastery soft-fails to [] inside the client, so this cannot be the reason a profile 500s.
  const masteryEntries = await getChampionMastery(source.account.puuid, region);

  const scoreboards: Record<string, PreviewScoreboard> = {};
  for (const dto of source.matches) {
    scoreboards[dto.metadata.matchId] = toPreviewScoreboard(dto);
  }

  const result: PublicProfileResponse = {
    ...preview,
    puuid: source.account.puuid,
    mastery: await toMastery(masteryEntries),
    scoreboards,
  };

  await writeCache(cacheKey, "preview", result);
  return result;
}

/** A cache outage must never be the reason a profile fails to load (TASK-285). */
async function readCache<T>(key: string): Promise<T | null> {
  try {
    return ((await getCached(key)) as T | null) ?? null;
  } catch {
    return null;
  }
}

/**
 * The payload is already complete by the time this runs, so a write failure must not discard it.
 * Neon being unreachable used to turn a fully served preview into a 500 (TASK-285).
 */
async function writeCache(key: string, kind: string, value: unknown): Promise<void> {
  try {
    await setCached(key, kind, value, CACHE_TTL_DAYS);
  } catch {
    // Cache unavailable — serve the freshly built result anyway.
  }
}
