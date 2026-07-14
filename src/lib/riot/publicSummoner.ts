import {
  getAccountByRiotId,
  getSummonerByPuuid,
  getRankedEntriesForPuuid,
  getMatchIds,
  getMatch,
  VALID_REGIONS,
} from "@/domains/riot/services/riotApiClient";
import type { PreviewResponse, PreviewMatch, PreviewChampion } from "@/types/preview";

export { VALID_REGIONS };

export type SummonerNotFoundError = { code: "NOT_FOUND" };
export type SummonerRateLimitError = { code: "RATE_LIMIT" };
export type SummonerFetchResult =
  | { ok: true; data: PreviewResponse }
  | { ok: false; error: SummonerNotFoundError | SummonerRateLimitError | { code: "ERROR"; message: string } };

export async function fetchPublicSummonerData(
  gameName: string,
  tagLine: string,
  region: string
): Promise<SummonerFetchResult> {
  if (!VALID_REGIONS.includes(region.toLowerCase())) {
    return { ok: false, error: { code: "NOT_FOUND" } };
  }

  try {
    const account = await getAccountByRiotId(gameName, tagLine, region);
    const [summoner, rankedEntries, matchIds] = await Promise.all([
      getSummonerByPuuid(account.puuid, region),
      getRankedEntriesForPuuid(account.puuid, region),
      getMatchIds(account.puuid, region, 5),
    ]);

    const soloEntry = rankedEntries.find((e) => e.queueType === "RANKED_SOLO_5x5") ?? null;

    const matchDTOs = await Promise.all(
      matchIds.slice(0, 5).map((id) => getMatch(id, region).catch(() => null))
    );

    const recentMatches: PreviewMatch[] = matchDTOs
      .filter((m): m is NonNullable<typeof m> => m !== null)
      .map((m) => {
        const p = m.info.participants.find((x) => x.puuid === account.puuid);
        if (!p) return null;
        return {
          championName: p.championName,
          win: p.win,
          kills: p.kills,
          deaths: p.deaths,
          assists: p.assists,
          position: p.teamPosition || "FILL",
        };
      })
      .filter((x): x is PreviewMatch => x !== null);

    const champMap = new Map<string, { games: number; wins: number }>();
    for (const m of recentMatches) {
      const e = champMap.get(m.championName) ?? { games: 0, wins: 0 };
      e.games++;
      if (m.win) e.wins++;
      champMap.set(m.championName, e);
    }
    const topChampions: PreviewChampion[] = Array.from(champMap.entries())
      .sort((a, b) => b[1].games - a[1].games)
      .slice(0, 3)
      .map(([championName, s]) => ({
        championName,
        games: s.games,
        wins: s.wins,
        winRate: Math.round((s.wins / s.games) * 100),
      }));

    const wins = recentMatches.filter((m) => m.win).length;

    return {
      ok: true,
      data: {
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
        aiInsight: `${account.gameName} played the last ${recentMatches.length} matches with a ${recentMatches.length > 0 ? Math.round((wins / recentMatches.length) * 100) : 0}% win rate.`,
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("404") || msg.includes("Not Found")) {
      return { ok: false, error: { code: "NOT_FOUND" } };
    }
    if (msg.includes("429")) {
      return { ok: false, error: { code: "RATE_LIMIT" } };
    }
    return { ok: false, error: { code: "ERROR", message: msg } };
  }
}
