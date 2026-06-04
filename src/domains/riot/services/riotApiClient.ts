import { riotClient } from "@/lib/riot/client";
import { dedup } from "@/lib/riot/dedup";
import { CacheKeys } from "@/lib/riot/lifecycle";
import type {
  RiotAccountDTO,
  SummonerDTO,
  RankedEntryDTO,
  MatchDTO,
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
  const url = `https://${routing}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?count=${count}`;
  return riotClient.get<string[]>(url, {
    cacheTtl: 60,
    cacheKey: CacheKeys.matchIds(puuid, region),
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
