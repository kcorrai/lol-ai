import { prisma } from "@/lib/db/prisma";
import { buildAccountPreview, getAccountPuuid } from "@/domains/riot";
import { meanDuration, perMinute } from "@/domains/esports/duration";
import type { PlayerChampionAverages } from "@/domains/esports/comparison";
import { kdaRatio } from "@/lib/kda";

/** How far back a player's own games are read. The same window the profile uses. */
const GAMES_TO_READ = 20;

// kdaRatio, not computeKDA: these are averaged by meanOfPresent below, and rounding each reading
// before taking a mean rounds twice.
const kdaOf = kdaRatio;

/** Mean of the readings that exist, or null when none do. */
function meanOfPresent(values: (number | null)[]): number | null {
  const present = values.filter((value): value is number => value !== null);
  if (present.length === 0) return null;
  return present.reduce((sum, value) => sum + value, 0) / present.length;
}

/**
 * A connected account's own line on a champion, from the games we have synced.
 *
 * This is the richer of the two paths: our own rows carry CS, gold and wards,
 * which is why signing in adds three rows to the comparison rather than just
 * saving the reader some typing.
 */
export async function championAveragesFromDb(
  riotAccountId: string,
  championName: string
): Promise<PlayerChampionAverages | null> {
  const puuid = await getAccountPuuid(riotAccountId);
  if (!puuid) return null;

  const rows = await prisma.matchParticipant.findMany({
    where: {
      puuid,
      championName: { equals: championName, mode: "insensitive" },
      match: { queueType: "RANKED_SOLO_5x5" },
    },
    select: {
      kills: true,
      deaths: true,
      assists: true,
      cs: true,
      goldEarned: true,
      wardsPlaced: true,
      won: true,
      // The pro side's game length is derived from the livestats frames; ours has
      // been sitting in the match row all along, which is what makes the two
      // per-minute rows comparable at all.
      match: { select: { gameDuration: true } },
    },
    orderBy: { match: { gameStart: "desc" } },
    take: GAMES_TO_READ,
  });

  if (rows.length === 0) return null;

  const mean = (pick: (row: (typeof rows)[number]) => number): number =>
    rows.reduce((sum, row) => sum + pick(row), 0) / rows.length;

  // Averaged over the per-game rates, matching how the pro side computes them —
  // one reading per game, so a long game does not count for more than a short one.
  const durations = rows.map((row) => row.match?.gameDuration ?? null);
  const rate = (pick: (row: (typeof rows)[number]) => number): number | null =>
    meanOfPresent(rows.map((row, index) => perMinute(pick(row), durations[index])));

  return {
    games: rows.length,
    kda: mean((row) => kdaOf(row.kills, row.deaths, row.assists)),
    winRate: (rows.filter((row) => row.won).length / rows.length) * 100,
    creepScore: mean((row) => row.cs),
    gold: mean((row) => row.goldEarned),
    wardsPlaced: mean((row) => row.wardsPlaced),
    gameLengthSeconds: meanDuration(durations),
    creepScorePerMin: rate((row) => row.cs),
    goldPerMin: rate((row) => row.goldEarned),
  };
}

/**
 * Any Riot ID's line on a champion, without an account and without a sync.
 *
 * The public preview publishes each recent match's champion and KDA and its
 * result, and nothing else — no CS, no gold, no wards. Those come back as null
 * on purpose rather than as zero: a zero would render as a real number a reader
 * could compare against, and it is not one.
 */
export async function championAveragesFromRiotId(
  gameName: string,
  tagLine: string,
  region: string,
  championName: string
): Promise<PlayerChampionAverages | null> {
  const preview = await buildAccountPreview(gameName, tagLine, region);

  const games = preview.recentMatches.filter(
    (match) => match.championName.toLowerCase() === championName.toLowerCase()
  );
  if (games.length === 0) return null;

  return {
    games: games.length,
    kda: games.reduce((sum, g) => sum + kdaOf(g.kills, g.deaths, g.assists), 0) / games.length,
    winRate: (games.filter((g) => g.win).length / games.length) * 100,
    creepScore: null,
    gold: null,
    wardsPlaced: null,
    // The preview carries no game length either, so the two per-minute rows are
    // among the ones connecting an account adds.
    gameLengthSeconds: null,
    creepScorePerMin: null,
    goldPerMin: null,
  };
}
