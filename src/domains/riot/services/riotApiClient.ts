import { riotClient } from "@/lib/riot/client";
import { dedup } from "@/lib/riot/dedup";
import { CacheKeys } from "@/lib/riot/lifecycle";
import { logger } from "@/lib/utils/logger";
import type {
  RiotAccountDTO,
  SummonerDTO,
  RankedEntryDTO,
  MatchDTO,
  ChampionMasteryDTO,
} from "@/domains/riot/types/riot.types";
import type { MatchTimelineDTO } from "@/domains/riot/types/timeline.types";

// Region → routing cluster (for Account and Match v5 APIs)
const ROUTING: Record<string, string> = {
  na1: "americas",
  br1: "americas",
  la1: "americas",
  la2: "americas",
  euw1: "europe",
  eun1: "europe",
  tr1: "europe",
  ru: "europe",
  kr: "asia",
  jp1: "asia",
  oc1: "sea",
};

export function getRouting(region: string): string {
  return ROUTING[region] ?? "europe";
}

export const VALID_REGIONS = Object.keys(ROUTING) as string[];

/**
 * Cheapest authenticated call Riot offers — used as a preflight by unattended jobs.
 *
 * Unlike the lookups below, this one throws. Those soft-fail to an empty result on purpose, because
 * "no data" and "call failed" are the same shape for a player who simply has no rank; a batch job
 * cannot tell an expired key from an idle ladder that way, and would report a clean run while
 * recording nothing (TASK: rank sweep).
 */
export async function assertRiotApiReachable(region = "euw1"): Promise<void> {
  const url = `https://${region}.api.riotgames.com/lol/status/v4/platform-data`;
  await riotClient.get<unknown>(url, { cacheTtl: 60, cacheKey: `riot:status:${region}` });
}

export async function getMatchTimeline(
  matchId: string,
  region: string
): Promise<MatchTimelineDTO> {
  const routing = getRouting(region);
  const url = `https://${routing}.api.riotgames.com/lol/match/v5/matches/${matchId}/timeline`;
  return riotClient.get<MatchTimelineDTO>(url, { cacheTtl: 0 });
}

export async function getAccountByRiotId(
  gameName: string,
  tagLine: string,
  region: string
): Promise<RiotAccountDTO> {
  // Deterministic mock for E2E tests — bypasses real Riot API
  if (process.env.E2E_MOCK === "true") {
    return {
      puuid: `e2e-puuid-${gameName.toLowerCase().replace(/[^a-z0-9]/g, "")}-${region}`,
      gameName,
      tagLine,
    };
  }
  const routing = getRouting(region);
  const url = `https://${routing}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
  return riotClient.get<RiotAccountDTO>(url, {
    cacheTtl: 300,
    cacheKey: CacheKeys.summoner(`${gameName}#${tagLine}:${region}`),
  });
}

// Reverse lookup of a Riot ID from a puuid. Used by the GDPR right-to-be-forgotten
// sweep (TASK-287), which needs the *current* name for an account we already know
// the puuid of — a forgotten account keeps its puuid but is renamed to rtbf<id>.
export async function getAccountByPuuid(
  puuid: string,
  region: string
): Promise<RiotAccountDTO> {
  if (process.env.E2E_MOCK === "true") {
    return { puuid, gameName: "E2EPlayer", tagLine: "E2E" };
  }
  const routing = getRouting(region);
  const url = `https://${routing}.api.riotgames.com/riot/account/v1/accounts/by-puuid/${encodeURIComponent(puuid)}`;
  // Deliberately uncached: the sweep exists to observe a rename, and a cache hit
  // would serve exactly the stale name it is looking for.
  return riotClient.get<RiotAccountDTO>(url, { cacheTtl: 0 });
}

export async function getSummonerByPuuid(
  puuid: string,
  region: string
): Promise<SummonerDTO> {
  if (process.env.E2E_MOCK === "true") {
    return {
      id: `e2e-summoner-${puuid.slice(-8)}`,
      accountId: `e2e-account-${puuid.slice(-8)}`,
      puuid,
      name: puuid.split("-")[2] ?? "E2EPlayer",
      profileIconId: 588,
      revisionDate: Date.now(),
      summonerLevel: 100,
    };
  }
  const url = `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`;
  return riotClient.get<SummonerDTO>(url, {
    cacheTtl: 300,
    cacheKey: CacheKeys.summoner(puuid),
  });
}

export async function getMatchIds(
  puuid: string,
  region: string,
  count = 20
): Promise<string[]> {
  const routing = getRouting(region);
  // Riot API enforces a hard cap of 100 on the count parameter.
  const safeCount = Math.min(count, 100);
  const url = `https://${routing}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?count=${safeCount}`;
  return riotClient.get<string[]>(url, {
    cacheTtl: 60,
    cacheKey: CacheKeys.matchIds(puuid, region),
    // A transient empty list (new PUUID-only accounts lag in match-v5) must not stick and block
    // re-sync (TASK-227).
    noCacheEmptyArray: true,
  });
}

export async function getMatch(
  matchId: string,
  region: string
): Promise<MatchDTO> {
  const routing = getRouting(region);
  const url = `https://${routing}.api.riotgames.com/lol/match/v5/matches/${matchId}`;
  // dedup: two simultaneous syncs for the same match → one network call
  return dedup(CacheKeys.matchDetail(matchId), () =>
    riotClient.get<MatchDTO>(url, {
      cacheTtl: 0, // match detail never changes once finished; caller caches at a higher level
      cacheKey: CacheKeys.matchDetail(matchId),
    })
  );
}

export async function getRankedEntries(
  summonerId: string,
  region: string
): Promise<RankedEntryDTO[]> {
  const url = `https://${region}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerId}`;
  return riotClient.get<RankedEntryDTO[]>(url, {
    cacheTtl: 300,
    cacheKey: CacheKeys.rankedEntries(summonerId, region),
  });
}

// Rank lookup by PUUID: tries the v4 by-puuid endpoint first; falls back to
// resolving summonerId via PUUID then calling the by-summoner endpoint.
//
// Use this and never the by-summoner route on its own: Summoner-v4 no longer
// returns the encrypted `id` field (the response is puuid, profileIconId,
// revisionDate, summonerLevel), so a summonerId-only lookup silently yields no
// entries and every player renders as unranked.
export async function getRankedEntriesByPuuidDirect(
  puuid: string,
  region: string
): Promise<RankedEntryDTO[]> {
  // Try the newer by-puuid endpoint first
  try {
    const url = `https://${region}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`;
    const entries = await riotClient.get<RankedEntryDTO[]>(url, {
      cacheTtl: 300,
      cacheKey: CacheKeys.rankedEntries(puuid, region),
    });
    logger.debug(`[RiotClient] by-puuid rank: ${puuid.slice(0, 8)}… → ${entries.length} entries`);
    return entries;
  } catch (err) {
    logger.warn(`[RiotClient] by-puuid rank failed for ${puuid.slice(0, 8)}…: ${err instanceof Error ? err.message : String(err)} — trying summonerId fallback`);
  }

  // Fallback: resolve summonerId then call by-summoner endpoint
  try {
    const summoner = await getSummonerByPuuid(puuid, region);
    if (!summoner.id) return [];
    return await getRankedEntries(summoner.id, region);
  } catch (err) {
    logger.warn(`[RiotClient] summonerId fallback also failed for ${puuid.slice(0, 8)}…: ${err instanceof Error ? err.message : String(err)}`);
    return [];
  }
}

/**
 * Every champion this account has mastery on, all-time.
 *
 * One request per account, and the only place the app can see past the two years
 * match-v5 retains — a player with 480k points on a champion was playing it long
 * before we started recording anything.
 *
 * Cached for a day: mastery moves by a few thousand points a game and nothing in
 * the product reads it often enough to justify a fresher copy.
 */
export async function getChampionMastery(
  puuid: string,
  region: string
): Promise<ChampionMasteryDTO[]> {
  const url = `https://${region}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}`;
  try {
    return await riotClient.get<ChampionMasteryDTO[]>(url, {
      cacheTtl: 86_400,
      cacheKey: CacheKeys.championMastery(puuid, region),
    });
  } catch (err) {
    // Soft-fail, like the other lookups here: an account with no mastery and a
    // failed call are the same shape to a caller, and mastery is decoration on
    // every screen that reads it — never the reason a page exists.
    //
    // There is deliberately no by-summoner fallback the way ranked has one:
    // Summoner-v4 stopped returning the encrypted `id`, so that route resolves
    // to nothing anyway (see getRankedEntriesByPuuidDirect above).
    logger.warn(
      `[RiotClient] mastery failed for ${puuid.slice(0, 8)}…: ${err instanceof Error ? err.message : String(err)}`
    );
    return [];
  }
}

export interface ActiveGameParticipantDTO {
  puuid: string;
  teamId: number;
  championId: number;
  spell1Id: number;
  spell2Id: number;
}

export interface ActiveGameDTO {
  gameId: number;
  gameMode: string;
  gameQueueConfigId?: number;
  gameLength: number;
  participants: ActiveGameParticipantDTO[];
}

/**
 * The game this player is in right now, or null when they aren't in one.
 *
 * Riot answers "not in a game" with a 404, which the client turns into a thrown RIOT_NOT_FOUND —
 * so the absence of a game arrives here as an exception and has to be translated back into a
 * value. 404 is not retryable, so this costs exactly one call against the rate limit.
 *
 * Note this is the *live* game, not champion select: spectator only sees a game once it has
 * started. Champion select lives behind the localhost-only LCU API (see ADR-005).
 */
export async function getActiveGame(
  puuid: string,
  region: string
): Promise<ActiveGameDTO | null> {
  const url = `https://${region}.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${puuid}`;
  try {
    return await riotClient.get<ActiveGameDTO>(url, {
      // Short TTL: a draft doesn't change mid-game, but the player may press the button twice.
      cacheTtl: 60,
      cacheKey: `active-game:${puuid}`,
    });
  } catch (err) {
    const status = (err as { statusCode?: number; status?: number }).statusCode
      ?? (err as { status?: number }).status;
    if (status === 404) return null;
    throw err;
  }
}
