import {
  getAccountByRiotId,
  getChampionMastery,
  getRankedEntriesByPuuidDirect,
  getSummonerByPuuid,
} from "@/domains/riot/services/riotApiClient";
import { fetchAllChampions } from "@/lib/ddragon/championsData";
import type { PreviewMastery } from "@/types/preview";
import type { ParsedRiotId } from "./riotIds";
import type { LobbyPlayer, LobbyScout } from "./lobbyScout.types";

/** Champions shown per player. Three is enough to read a pool without becoming a second page. */
const MASTERY_COUNT = 3;

/**
 * A pasted lobby, scouted.
 *
 * This is the champion-select counterpart to the live page: the Spectator API cannot see champion
 * select at all, so before the game starts the only input is a paste of the lobby chat (LA-71).
 *
 * Deliberately **thin per player** — level, rank, mastery — because the cost is multiplied by ten.
 * A full profile is four Riot calls plus ten match fetches; that is thirteen each and a hundred
 * and thirty for a lobby, which is not a page, it is an outage. Recent form would be the most
 * useful addition and is exactly the thing that cannot be afforded here: it needs a match list
 * and five matches per player on top.
 *
 * Every player is independent and best-effort. One typo'd Riot ID in a paste of ten is the normal
 * case, and it must cost that row rather than the page.
 */
export async function buildLobbyScout(ids: ParsedRiotId[], region: string): Promise<LobbyScout> {
  // Data Dragon is cached for a day with a last-good fallback, so naming mastery champions is
  // effectively free — and shared across all ten players rather than fetched per player.
  const championsByKey = await championNameLookup();

  const players = await Promise.all(ids.map((id) => scoutOne(id, region, championsByKey)));

  return { region, players };
}

async function championNameLookup(): Promise<Map<string, string>> {
  try {
    const champions = await fetchAllChampions();
    return new Map(champions.map((c) => [c.key, c.name]));
  } catch {
    // A missing catalogue costs the mastery strip its names, not the page its players.
    return new Map();
  }
}

async function scoutOne(
  id: ParsedRiotId,
  region: string,
  championsByKey: Map<string, string>
): Promise<LobbyPlayer> {
  const base = {
    riotId: id.full,
    gameName: id.gameName,
    tagLine: id.tagLine,
  };

  let puuid: string;
  try {
    puuid = (await getAccountByRiotId(id.gameName, id.tagLine, region)).puuid;
  } catch {
    // The common failure by far: a typo, or a name that lives on another platform. It is a fact
    // about that row, not an error for the page to raise.
    return {
      ...base,
      found: false,
      summonerLevel: null,
      profileIconId: null,
      rank: null,
      mastery: [],
    };
  }

  const [summoner, rank, mastery] = await Promise.all([
    getSummonerByPuuid(puuid, region).catch(() => null),
    soloRank(puuid, region),
    topMastery(puuid, region, championsByKey),
  ]);

  return {
    ...base,
    found: true,
    summonerLevel: summoner?.summonerLevel ?? null,
    profileIconId: summoner?.profileIconId ?? null,
    rank,
    mastery,
  };
}

async function soloRank(puuid: string, region: string): Promise<LobbyPlayer["rank"]> {
  try {
    const entries = await getRankedEntriesByPuuidDirect(puuid, region);
    const solo = entries.find((e) => e.queueType === "RANKED_SOLO_5x5");
    if (!solo) return null;

    const games = solo.wins + solo.losses;
    return {
      tier: solo.tier,
      division: solo.rank,
      lp: solo.leaguePoints,
      wins: solo.wins,
      losses: solo.losses,
      winRate: games > 0 ? Math.round((solo.wins / games) * 100) : 0,
    };
  } catch {
    return null;
  }
}

async function topMastery(
  puuid: string,
  region: string,
  championsByKey: Map<string, string>
): Promise<PreviewMastery[]> {
  // `getChampionMastery` already soft-fails to an empty list, so an account with no mastery and a
  // failed lookup are the same shape here by design.
  const entries = await getChampionMastery(puuid, region);

  return [...entries]
    .sort((a, b) => b.championPoints - a.championPoints)
    .slice(0, MASTERY_COUNT)
    .map((e) => {
      const championName = championsByKey.get(String(e.championId));
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
