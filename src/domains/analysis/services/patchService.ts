import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/utils/logger";
import { patchNotesUrl } from "@/lib/lolPatch";
import { fetchJsonLastGood } from "@/lib/http/lastGoodJson";
import { getAccountPuuid } from "@/domains/riot/services/accountLookup";

const DDRAGON_VERSIONS_URL = "https://ddragon.leagueoflegends.com/api/versions.json";
const MIN_GAMES_PER_WINDOW = 5;
const SIGNIFICANT_DELTA_THRESHOLD = 3; // percentage points

export interface ChampionPatchImpact {
  championName: string;
  beforeWr: number; // win rate % before patch
  afterWr: number; // win rate % after patch
  wrDelta: number; // positive = improved, negative = declined
  beforeGames: number;
  afterGames: number;
}

export interface PatchImpactResult {
  currentVersion: string;
  patchDetectedAt: string;
  patchNotesUrl: string | null;
  champions: ChampionPatchImpact[];
  hasEnoughData: boolean;
}

// Fetches latest DDragon version and upserts into DB if new.
// Returns the current tracked version.
export async function getOrCreateCurrentPatch(): Promise<{
  version: string;
  detectedAt: Date;
  isNew: boolean;
}> {
  const versions = await fetchJsonLastGood<string[]>(DDRAGON_VERSIONS_URL, { ttlSeconds: 3600 });
  const latestVersion = versions?.[0];

  if (!latestVersion) {
    logger.warn("[patchService] DDragon version feed unavailable, falling back to the DB");
    const fallback = await prisma.patchVersion.findFirst({ orderBy: { detectedAt: "desc" } });
    if (fallback)
      return { version: fallback.version, detectedAt: fallback.detectedAt, isNew: false };
    throw new Error("No patch version available from Data Dragon or the database");
  }

  const existing = await prisma.patchVersion.findUnique({ where: { version: latestVersion } });
  if (existing) return { version: existing.version, detectedAt: existing.detectedAt, isNew: false };

  // New patch detected — create record
  const created = await prisma.patchVersion.create({
    data: { version: latestVersion, patchNotesUrl: patchNotesUrl(latestVersion) },
  });

  logger.info(`[patchService] New patch detected: ${latestVersion}`);
  return { version: created.version, detectedAt: created.detectedAt, isNew: true };
}

// Returns WR before/after current patch for the user's most-played champions.
export async function getPatchImpact(riotAccountId: string): Promise<PatchImpactResult> {
  const puuid = await getAccountPuuid(riotAccountId);
  const patch = await getOrCreateCurrentPatch();
  const patchDate = patch.detectedAt;

  // Get top 5 champions by total games
  const allParticipants = await prisma.matchParticipant.findMany({
    where: { puuid: puuid ?? "", match: { queueType: "RANKED_SOLO_5x5" } },
    select: { championName: true, won: true, match: { select: { gameStart: true } } },
    orderBy: { match: { gameStart: "desc" } },
    take: 200,
  });

  // Group by champion
  const champMap = new Map<
    string,
    { beforeWins: number; beforeGames: number; afterWins: number; afterGames: number }
  >();
  for (const p of allParticipants) {
    const entry = champMap.get(p.championName) ?? {
      beforeWins: 0,
      beforeGames: 0,
      afterWins: 0,
      afterGames: 0,
    };
    if (p.match.gameStart >= patchDate) {
      entry.afterGames++;
      if (p.won) entry.afterWins++;
    } else {
      entry.beforeGames++;
      if (p.won) entry.beforeWins++;
    }
    champMap.set(p.championName, entry);
  }

  // Filter: need at least MIN_GAMES in both windows; sort by abs(delta)
  const impacts: ChampionPatchImpact[] = [];
  for (const [championName, s] of champMap.entries()) {
    if (s.beforeGames < MIN_GAMES_PER_WINDOW || s.afterGames < MIN_GAMES_PER_WINDOW) continue;
    const beforeWr = Math.round((s.beforeWins / s.beforeGames) * 100);
    const afterWr = Math.round((s.afterWins / s.afterGames) * 100);
    const wrDelta = afterWr - beforeWr;
    if (Math.abs(wrDelta) < SIGNIFICANT_DELTA_THRESHOLD) continue;
    impacts.push({
      championName,
      beforeWr,
      afterWr,
      wrDelta,
      beforeGames: s.beforeGames,
      afterGames: s.afterGames,
    });
  }

  impacts.sort((a, b) => Math.abs(b.wrDelta) - Math.abs(a.wrDelta));

  const patchRecord = await prisma.patchVersion.findUnique({ where: { version: patch.version } });

  return {
    currentVersion: patch.version,
    patchDetectedAt: patchDate.toISOString(),
    patchNotesUrl: patchRecord?.patchNotesUrl ?? null,
    champions: impacts.slice(0, 5),
    hasEnoughData: impacts.length > 0,
  };
}
