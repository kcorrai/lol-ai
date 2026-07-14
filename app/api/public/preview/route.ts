import { NextRequest, NextResponse } from "next/server";
import { getAccountByRiotId, getSummonerByPuuid, getRankedEntriesForPuuid, getMatchIds, getMatch, VALID_REGIONS } from "@/domains/riot/services/riotApiClient";
import { getAiClient } from "@/lib/ai/client";
import { getCached, setCached, buildCacheKey } from "@/lib/ai/aiCache";
import { checkRateLimit, getIp, rateLimitResponse } from "@/lib/api/rateLimit";
import { logger } from "@/lib/utils/logger";
import type { PreviewMatch, PreviewChampion, PreviewResponse } from "@/types/preview";

export const dynamic = "force-dynamic";
export type { PreviewResponse };

const PREVIEW_RATE_LIMIT = { limit: 10, windowMs: 60 * 60 * 1000 }; // 10/hour

export async function GET(req: NextRequest): Promise<NextResponse> {
  const ip = getIp(req);
  const rl = await checkRateLimit(`preview:${ip}`, PREVIEW_RATE_LIMIT);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs, rl.limit);

  const { searchParams } = new URL(req.url);
  const gameName = searchParams.get("gameName")?.trim();
  const tagLine = searchParams.get("tagLine")?.trim();
  const region = searchParams.get("region")?.trim().toLowerCase();

  if (!gameName || !tagLine || !region) {
    return NextResponse.json(
      { error: "gameName, tagLine and region are required." },
      { status: 400 }
    );
  }

  if (!VALID_REGIONS.includes(region)) {
    return NextResponse.json({ error: "Invalid region." }, { status: 400 });
  }

  const cacheKey = buildCacheKey("preview", { gameName, tagLine, region });

  try {
    const cached = await getCached(cacheKey);
    if (cached) {
      return NextResponse.json({ data: cached });
    }
  } catch {
    // Cache unavailable — continue without it
  }

  try {
    const account = await getAccountByRiotId(gameName, tagLine, region);
    const [summoner, rankedEntries, matchIds] = await Promise.all([
      getSummonerByPuuid(account.puuid, region),
      getRankedEntriesForPuuid(account.puuid, region),
      getMatchIds(account.puuid, region, 5),
    ]);

    const soloEntry = rankedEntries.find(e => e.queueType === "RANKED_SOLO_5x5") ?? null;

    const matchDTOs = await Promise.all(
      matchIds.slice(0, 5).map(id => getMatch(id, region).catch(() => null))
    );

    const recentMatches: PreviewMatch[] = matchDTOs
      .filter((m): m is NonNullable<typeof m> => m !== null)
      .map(m => {
        const p = m.info.participants.find(x => x.puuid === account.puuid);
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

    const aiInsight = await generateAiInsight(gameName, tagLine, soloEntry, recentMatches, topChampions, cacheKey);

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
      aiInsight,
    };

    await setCached(cacheKey, "preview", result, 1); // 1 day TTL

    return NextResponse.json({ data: result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("[preview] handler error", { gameName, tagLine, region, error: msg });

    if (msg.includes("404") || msg.includes("Not Found") || msg.includes("RIOT_NOT_FOUND")) {
      return NextResponse.json(
        { error: `${gameName}#${tagLine} not found. Check your Riot ID and region.` },
        { status: 404 }
      );
    }
    if (msg.includes("429") || msg.includes("RIOT_RATE_LIMITED")) {
      return NextResponse.json(
        { error: "Riot API rate limit exceeded. Try again in a few seconds." },
        { status: 503 }
      );
    }
    if (msg.includes("401") || msg.includes("403") || msg.includes("RIOT_UNAUTHORIZED") || msg.includes("RIOT_FORBIDDEN")) {
      return NextResponse.json(
        { error: "Riot API configuration error. Please try again later." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Server error occurred." }, { status: 500 });
  }
}

async function generateAiInsight(
  gameName: string,
  _tagLine: string,
  ranked: { tier: string; rank: string; wins: number; losses: number } | null,
  matches: PreviewMatch[],
  topChamps: PreviewChampion[],
  _cacheKey: string
): Promise<string> {
  const rankStr = ranked
    ? `${ranked.tier} ${ranked.rank} (${ranked.wins}W / ${ranked.losses}L)`
    : "Unranked";
  const wins = matches.filter(m => m.win).length;
  const wr = matches.length > 0 ? Math.round((wins / matches.length) * 100) : 0;
  const topChamp = topChamps[0]?.championName ?? "unknown";
  const avgDeaths =
    matches.length > 0
      ? (matches.reduce((s, m) => s + m.deaths, 0) / matches.length).toFixed(1)
      : "?";

  const ai = getAiClient();
  const result = await ai.complete(
    "You are an experienced League of Legends coach. You construct short, specific, and motivating sentences.",
    `Player: ${gameName}, Rank: ${rankStr}, Last ${matches.length} matches WR: %${wr}, Most played: ${topChamp}, Avg deaths: ${avgDeaths}. ` +
      "Write a 2-sentence coaching message for this player. Be specific and actionable. Do not return JSON, just plain text.",
    { maxTokens: 150 }
  );

  return result.content.trim().replace(/^"|"$/g, "");
}
