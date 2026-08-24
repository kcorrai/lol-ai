import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";
import { getAiClient } from "@/lib/ai/client";
import { getCached, setCached, buildCacheKey } from "@/lib/ai/aiCache";
import { logger } from "@/lib/utils/logger";
import { getAccountPuuid } from "@/domains/riot/services/accountLookup";

export interface DeathPoint {
  x: number;
  y: number;
  gameTimeMs: number;
}

export interface HeatmapData {
  deaths: DeathPoint[];
  summary: string | null;
  totalDeaths: number;
  hasData: boolean;
}

const TIME_RANGES: Record<string, [number, number]> = {
  early: [0, 15 * 60 * 1000],
  mid: [15 * 60 * 1000, 30 * 60 * 1000],
  late: [30 * 60 * 1000, Number.MAX_SAFE_INTEGER],
};

function mapRegion(x: number): string {
  if (x < 4500) return "own side";
  if (x > 10000) return "enemy side";
  return "center";
}

async function generateSummary(deaths: DeathPoint[]): Promise<string> {
  if (deaths.length === 0) return "";
  const cacheKey = buildCacheKey("heatmap-summary", {
    deathCount: String(deaths.length),
    sample: deaths
      .slice(0, 5)
      .map((d) => `${d.x},${d.y}`)
      .join("|"),
  });

  const cached = await getCached(cacheKey);
  if (cached) return (cached as { summary: string }).summary;

  // Count deaths per region
  const counts: Record<string, number> = {};
  for (const d of deaths) {
    const region = mapRegion(d.x);
    counts[region] = (counts[region] ?? 0) + 1;
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const topRegion = sorted[0];
  const pct = Math.round((topRegion[1] / deaths.length) * 100);

  const prompt = `The player died ${deaths.length} times in recent matches. ${pct}% of deaths happen on ${topRegion[0]}. Other death distribution: ${sorted
    .slice(1)
    .map(([r, c]) => `${r}: ${Math.round((c / deaths.length) * 100)}%`)
    .join(", ")}. In English, provide 2 sentences with concrete positioning advice.`;

  try {
    const result = await getAiClient("heatmap-summary").complete(
      "You are a LoL coach. Analyze the player's death heatmap data.",
      prompt,
      { maxTokens: 120 }
    );
    await setCached(cacheKey, "heatmap-summary", { summary: result.content }, 1);
    return result.content;
  } catch (err) {
    logger.warn(
      `[heatmapService] AI summary failed: ${err instanceof Error ? err.message : String(err)}`
    );
    return `${pct}% of deaths happen on ${topRegion[0]}.`;
  }
}

export async function getHeatmapData(
  riotAccountId: string,
  options: {
    champion?: string;
    timeRange?: string;
    matchCount?: number;
    isPro?: boolean;
  } = {}
): Promise<HeatmapData> {
  const puuid = await getAccountPuuid(riotAccountId);
  const { champion, timeRange, isPro = false } = options;
  const matchCount = isPro ? Math.min(options.matchCount ?? 20, 50) : 10;

  // Get the most recent N ranked matches for this account
  const recentMatches = await prisma.matchParticipant.findMany({
    where: { puuid: puuid ?? "", match: { queueType: "RANKED_SOLO_5x5" } },
    select: { match: { select: { id: true } } },
    orderBy: { match: { gameStart: "desc" } },
    take: matchCount,
  });

  const matchDbIds = recentMatches.map((m) => m.match.id);

  const where: Prisma.MatchDeathEventWhereInput = {
    riotAccountId,
    matchId: { in: matchDbIds },
    positionX: { not: -1 }, // exclude sentinel records
  };

  if (champion) where.championName = champion;

  let events = await prisma.matchDeathEvent.findMany({
    where,
    select: { positionX: true, positionY: true, gameTimeMs: true },
  });

  // Time range filter
  if (timeRange && TIME_RANGES[timeRange]) {
    const [min, max] = TIME_RANGES[timeRange];
    events = events.filter((e) => e.gameTimeMs >= min && e.gameTimeMs <= max);
  }

  if (events.length === 0) {
    return { deaths: [], summary: null, totalDeaths: 0, hasData: false };
  }

  const deaths: DeathPoint[] = events.map((e) => ({
    x: e.positionX,
    y: e.positionY,
    gameTimeMs: e.gameTimeMs,
  }));

  const summary = isPro ? await generateSummary(deaths) : null;
  return { deaths, summary, totalDeaths: deaths.length, hasData: true };
}
