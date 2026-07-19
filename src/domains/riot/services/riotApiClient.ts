import { riotClient } from "@/lib/riot/client";
import { dedup } from "@/lib/riot/dedup";
import { CacheKeys } from "@/lib/riot/lifecycle";
import { logger } from "@/lib/utils/logger";
import type {
  RiotAccountDTO,
  SummonerDTO,
  RankedEntryDTO,
  MatchDTO,
  MatchTimelineDTO,
} from "@/domains/riot/types/riot.types";

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

// Convenience wrapper: resolves summonerId via PUUID then fetches ranked entries.
// Returns empty array on any failure — some accounts have no rank or use the new
// PUUID-only system that doesn't expose a summonerId.
export async function getRankedEntriesForPuuid(
  puuid: string,
  region: string
): Promise<RankedEntryDTO[]> {
  try {
    const summoner = await getSummonerByPuuid(puuid, region);
    if (!summoner.id) return [];
    return await getRankedEntries(summoner.id, region);
  } catch {
    return [];
  }
}

// Rank lookup by PUUID: tries the v4 by-puuid endpoint first; falls back to
// resolving summonerId via PUUID then calling the by-summoner endpoint.
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
