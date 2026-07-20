import { prisma } from "@/lib/db/prisma";
import { getAccountPuuid } from "@/domains/riot";
import { rankTeammates, type DuoCandidate } from "@/domains/analysis/services/duoRanking";

export type { DuoCandidate };

export interface ActiveDuo {
  puuid: string;
  gameName: string;
  tagLine: string;
  games: number;
  wins: number;
  winRate: number;
  lastPlayedAt: string | null;
}

/**
 * How far back we look for duo partners. Deep enough that a regular duo stands clear of autofill
 * randoms, shallow enough that a partner someone stopped playing with months ago fades out.
 */
const MATCH_WINDOW = 200;
const CANDIDATE_LIMIT = 8;

const PARTICIPANT_FIELDS = {
  matchId: true,
  teamId: true,
  puuid: true,
  gameName: true,
  tagLine: true,
  won: true,
} as const;

/**
 * Ranks the people who share the player's team, over their last {@link MATCH_WINDOW} matches.
 * Two queries regardless of match count — never one per match.
 *
 * @param partnerPuuid restricts the scan to a single player (used to recompute one duo's record)
 */
async function scanTeammates(
  riotAccountId: string,
  opts: { partnerPuuid?: string; minGames?: number; limit?: number } = {},
): Promise<DuoCandidate[]> {
  const puuid = await getAccountPuuid(riotAccountId);
  if (!puuid) return [];

  const rows = await prisma.matchParticipant.findMany({
    where: { puuid },
    select: { matchId: true, teamId: true, match: { select: { gameStart: true } } },
    orderBy: { match: { gameStart: "desc" } },
    take: MATCH_WINDOW,
  });
  if (rows.length === 0) return [];

  const own = rows.map((r) => ({
    matchId: r.matchId,
    teamId: r.teamId,
    gameStart: r.match.gameStart,
  }));

  const others = await prisma.matchParticipant.findMany({
    where: {
      matchId: { in: own.map((m) => m.matchId) },
      puuid: opts.partnerPuuid ? opts.partnerPuuid : { not: puuid },
    },
    select: PARTICIPANT_FIELDS,
  });

  return rankTeammates(own, others, { minGames: opts.minGames, limit: opts.limit });
}

/** The people this player queues with most often. */
export function getDuoCandidates(riotAccountId: string): Promise<DuoCandidate[]> {
  return scanTeammates(riotAccountId, { limit: CANDIDATE_LIMIT });
}

// An explicit pick is honoured even below the auto-detect threshold, so these lookups use minGames 1.
function sharedRecord(riotAccountId: string, partnerPuuid: string): Promise<DuoCandidate[]> {
  return scanTeammates(riotAccountId, { partnerPuuid, minGames: 1, limit: 1 });
}

/** The duo the player picked, with their shared record recomputed from current match data. */
export async function getActiveDuo(riotAccountId: string): Promise<ActiveDuo | null> {
  const partner = await prisma.duoPartner.findFirst({
    where: { riotAccountId, isActive: true },
    select: { puuid: true, gameName: true, tagLine: true },
  });
  if (!partner) return null;

  const [record] = await sharedRecord(riotAccountId, partner.puuid);

  // Fall back to the stored name: the pair may have drifted out of the match window.
  return {
    puuid: partner.puuid,
    gameName: record?.gameName ?? partner.gameName,
    tagLine: record?.tagLine ?? partner.tagLine,
    games: record?.games ?? 0,
    wins: record?.wins ?? 0,
    winRate: record?.winRate ?? 0,
    lastPlayedAt: record?.lastPlayedAt ?? null,
  };
}

/**
 * Marks a teammate as the player's duo. The partner must appear in the player's own match
 * history — we hold no stats for anyone else, so accepting an arbitrary name would produce an
 * empty chart instead of an error.
 */
export async function setDuo(riotAccountId: string, partnerPuuid: string): Promise<ActiveDuo> {
  const [record] = await sharedRecord(riotAccountId, partnerPuuid);
  if (!record) throw new Error("That player hasn't been on your team in any synced match");

  // One active duo at a time; previous picks stay as history.
  await prisma.duoPartner.updateMany({ where: { riotAccountId }, data: { isActive: false } });
  await prisma.duoPartner.upsert({
    where: { riotAccountId_puuid: { riotAccountId, puuid: partnerPuuid } },
    create: {
      riotAccountId,
      puuid: partnerPuuid,
      gameName: record.gameName,
      tagLine: record.tagLine,
      isActive: true,
    },
    update: { isActive: true, gameName: record.gameName, tagLine: record.tagLine },
  });

  return record;
}

export async function clearDuo(riotAccountId: string): Promise<void> {
  await prisma.duoPartner.updateMany({ where: { riotAccountId }, data: { isActive: false } });
}

/**
 * Resolves a Riot ID the player typed to a teammate, searching only their own match history.
 * Returns null when that name never shared a team with them.
 */
export async function findTeammateByRiotId(
  riotAccountId: string,
  gameName: string,
  tagLine: string,
): Promise<DuoCandidate | null> {
  const all = await scanTeammates(riotAccountId, { minGames: 1, limit: Number.MAX_SAFE_INTEGER });
  const wanted = `${gameName}#${tagLine}`.toLowerCase();
  return all.find((c) => `${c.gameName}#${c.tagLine}`.toLowerCase() === wanted) ?? null;
}
