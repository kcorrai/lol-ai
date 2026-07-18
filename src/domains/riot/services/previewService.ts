import {
  getAccountByRiotId,
  getSummonerByPuuid,
  getRankedEntriesForPuuid,
  getMatchIds,
  getMatch,
} from "@/domains/riot/services/riotApiClient";
import { getCached, setCached, buildCacheKey } from "@/lib/ai/aiCache";
import type { PreviewMatch, PreviewChampion, PreviewResponse } from "@/types/preview";

// Builds the free public account preview: recent ranked form + top champions +
// a rule-based coaching blurb. Caches the result for a day. Throws on Riot
// errors so the route can map them to status codes.
export async function buildAccountPreview(
  gameName: string,
  tagLine: string,
  region: string
): Promise<PreviewResponse> {
  const cacheKey = buildCacheKey("preview", { gameName, tagLine, region });

  try {
    const cached = await getCached(cacheKey);
    if (cached) return cached as PreviewResponse;
  } catch {
    // Cache unavailable — continue without it
  }

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

  // Top champion aggregation
  const champMap = new Map<string, { games: number; wins: number }>();
  for (const m of recentMatches) {
    const entry = champMap.get(m.championName) ?? { games: 0, wins: 0 };
    entry.games++;
    if (m.win) entry.wins++;
    champMap.set(m.championName, entry);
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

  const result: PreviewResponse = {
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

  await setCached(cacheKey, "preview", result, 1); // 1 day TTL
  return result;
}

// Deterministic, zero-cost coaching blurb derived from the player's recent games.
// (The full AI coaching report is a signed-in feature; the public preview stays free.)
function buildRuleBasedInsight(
  gameName: string,
  ranked: { tier: string; rank: string; wins: number; losses: number } | null,
  matches: PreviewMatch[],
  topChamps: PreviewChampion[]
): string {
  if (matches.length === 0) {
    return `We couldn't find recent ranked games for ${gameName}. Play a few ranked matches and check back to see where you can improve.`;
  }

  const wins = matches.filter((m) => m.win).length;
  const wr = Math.round((wins / matches.length) * 100);
  const avgDeaths = matches.reduce((s, m) => s + m.deaths, 0) / matches.length;
  const avgKda =
    matches.reduce((s, m) => s + (m.kills + m.assists) / Math.max(1, m.deaths), 0) / matches.length;
  const topChamp = topChamps[0];

  // Sentence 1 — recent form.
  let form: string;
  if (wr >= 60) {
    form = `You're on a strong run — ${wins}/${matches.length} wins in your last games${ranked ? ` at ${ranked.tier} ${ranked.rank}` : ""}.`;
  } else if (wr <= 40) {
    form = `You're in a rough patch — ${wins}/${matches.length} wins recently${ranked ? ` at ${ranked.tier} ${ranked.rank}` : ""}. Time to tighten up the fundamentals.`;
  } else {
    form = `Your recent form is steady at ${wr}% over your last ${matches.length} games${ranked ? ` (${ranked.tier} ${ranked.rank})` : ""}.`;
  }

  // Sentence 2 — the biggest lever.
  let lever: string;
  if (avgDeaths > 7) {
    lever = `You're averaging ${avgDeaths.toFixed(1)} deaths a game — cutting risky plays and warding more would swing your win rate the fastest.`;
  } else if (avgKda >= 3.5) {
    lever = `Your ${avgKda.toFixed(1)} average KDA is strong; converting that into objectives and closing games faster is your next step.`;
  } else if (topChamp && topChamp.games >= Math.ceil(matches.length * 0.5)) {
    lever = `You're leaning on ${topChamp.championName} (${topChamp.winRate}% win rate) — a focused 2-3 champion pool like this is exactly how you climb.`;
  } else {
    lever = `Tightening your champion pool and playing to your win conditions each game is the quickest path up.`;
  }

  return `${form} ${lever}`;
}
