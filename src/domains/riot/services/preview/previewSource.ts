import {
  getAccountByRiotId,
  getMatch,
  getMatchIds,
  getRankedEntriesByPuuidDirect,
  getSummonerByPuuid,
} from "@/domains/riot/services/riotApiClient";
import type {
  MatchDTO,
  RankedEntryDTO,
  RiotAccountDTO,
  SummonerDTO,
} from "@/domains/riot/types/riot.types";

/**
 * How many recent matches the preview carries.
 *
 * Ten rather than five since TASK-310: this payload is no longer only the landing teaser, it is
 * also the public profile page, and five games is too thin to read a champion pool or a role
 * split off. Each one is a Riot call on a cache miss, which the callers' day-long cache absorbs.
 */
export const MATCH_DEPTH = 10;

export interface PreviewSource {
  account: RiotAccountDTO;
  summoner: SummonerDTO;
  soloEntry: RankedEntryDTO | null;
  /** Only the matches Riot actually served — a failed fetch is dropped, not held as a hole. */
  matches: MatchDTO[];
}

/**
 * Every Riot read the two preview builders share, done once.
 *
 * It lives apart from the builders so that neither can quietly double the account's cost at the
 * rate limiter: whatever `buildAccountPreview` and `buildPublicProfile` end up rendering, the
 * calls behind them are this list and nothing else.
 */
export async function fetchPreviewSource(
  gameName: string,
  tagLine: string,
  region: string,
  depth: number = MATCH_DEPTH
): Promise<PreviewSource> {
  const account = await getAccountByRiotId(gameName, tagLine, region);

  const [summoner, rankedEntries, matchIds] = await Promise.all([
    getSummonerByPuuid(account.puuid, region),
    getRankedEntriesByPuuidDirect(account.puuid, region),
    getMatchIds(account.puuid, region, depth),
  ]);

  const matchDTOs = await Promise.all(
    matchIds.slice(0, depth).map((id) => getMatch(id, region).catch(() => null))
  );

  return {
    account,
    summoner,
    soloEntry: rankedEntries.find((e) => e.queueType === "RANKED_SOLO_5x5") ?? null,
    matches: matchDTOs.filter((m): m is MatchDTO => m !== null),
  };
}
