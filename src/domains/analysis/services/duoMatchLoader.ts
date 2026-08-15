import { prisma } from "@/lib/db/prisma";
import { getAccountPuuid } from "@/domains/riot";
import { ownParticipantWhere } from "@/domains/analysis/services/duoService";
import type { OwnRow, PartnerRow } from "@/domains/analysis/services/duoSynergy";

/**
 * How far back a duo scan looks. Deep enough that a regular partner stands clear of autofill
 * randoms, shallow enough that someone they stopped playing with fades out. Matches the window
 * `duoService` ranks candidates over, so the panel and the picker agree.
 */
export const MATCH_WINDOW = 200;

export interface DuoMatches {
  own: OwnRow[];
  partner: PartnerRow[];
}

/**
 * The player's matches and the partner's rows within them.
 *
 * Two queries whatever the match count — never one per match. Shared by the synergy figures and
 * the weekly quests so that a quest and the panel above it can never disagree about which games
 * the pair played.
 *
 * @param since only matches at or after this instant, for a weekly window
 */
export async function loadDuoMatches(
  riotAccountId: string,
  partnerPuuid: string,
  opts: { since?: Date } = {},
): Promise<DuoMatches> {
  const puuid = await getAccountPuuid(riotAccountId);
  if (!puuid) return { own: [], partner: [] };

  const rows = await prisma.matchParticipant.findMany({
    where: {
      ...ownParticipantWhere(riotAccountId, puuid),
      ...(opts.since ? { match: { gameStart: { gte: opts.since } } } : {}),
    },
    select: {
      matchId: true,
      teamId: true,
      won: true,
      championName: true,
      position: true,
      kills: true,
      deaths: true,
      assists: true,
      visionScore: true,
      csPerMinute: true,
      match: { select: { gameStart: true } },
    },
    orderBy: { match: { gameStart: "desc" } },
    take: MATCH_WINDOW,
  });

  if (rows.length === 0) return { own: [], partner: [] };

  const partner = await prisma.matchParticipant.findMany({
    where: { matchId: { in: rows.map((r) => r.matchId) }, puuid: partnerPuuid },
    select: {
      matchId: true,
      teamId: true,
      championName: true,
      position: true,
      kills: true,
      deaths: true,
      assists: true,
    },
  });

  return {
    own: rows.map((r) => ({
      matchId: r.matchId,
      teamId: r.teamId,
      gameStart: r.match.gameStart,
      won: r.won,
      championName: r.championName,
      position: r.position,
      kills: r.kills,
      deaths: r.deaths,
      assists: r.assists,
      visionScore: r.visionScore,
      // Decimal columns come back as Prisma Decimal, which arithmetic would silently stringify.
      csPerMinute: Number(r.csPerMinute),
    })),
    partner,
  };
}

/** The player's own rows for matches the partner was on their team for. */
export function sharedOnly({ own, partner }: DuoMatches): OwnRow[] {
  const ownTeamByMatch = new Map(own.map((r) => [r.matchId, r.teamId]));
  const sharedMatchIds = new Set(
    partner.filter((p) => ownTeamByMatch.get(p.matchId) === p.teamId).map((p) => p.matchId),
  );
  return own.filter((r) => sharedMatchIds.has(r.matchId));
}
