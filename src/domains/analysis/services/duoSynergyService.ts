import { prisma } from "@/lib/db/prisma";
import { getAccountPuuid } from "@/domains/riot";
import {
  getActiveDuo,
  ownParticipantWhere,
  type ActiveDuo,
} from "@/domains/analysis/services/duoService";
import {
  computeDuoSynergy,
  type DuoSynergy,
  type OwnRow,
  type PartnerRow,
} from "@/domains/analysis/services/duoSynergy";

export type { DuoSynergy };

export interface DuoSynergyResponse extends DuoSynergy {
  partner: ActiveDuo;
}

/**
 * Same window as `duoService.scanTeammates`: deep enough that a regular duo stands clear of
 * autofill randoms, shallow enough that someone they stopped playing with fades out.
 */
const MATCH_WINDOW = 200;

/**
 * Everything the duo panel shows, for the partner the player has marked.
 *
 * Two queries regardless of match count — never one per match. Returns null when no duo is
 * selected, which is a state the panel renders rather than an error.
 */
export async function getDuoSynergy(riotAccountId: string): Promise<DuoSynergyResponse | null> {
  const partner = await getActiveDuo(riotAccountId);
  if (!partner) return null;

  const puuid = await getAccountPuuid(riotAccountId);
  if (!puuid) return null;

  const own = await prisma.matchParticipant.findMany({
    // Same row definition as the candidate scan, so the partner header and the figures beneath it
    // cannot disagree about how many games the pair has played.
    where: ownParticipantWhere(riotAccountId, puuid),
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

  if (own.length === 0) {
    return { partner, ...computeDuoSynergy([], []) };
  }

  const partnerRows = await prisma.matchParticipant.findMany({
    where: { matchId: { in: own.map((r) => r.matchId) }, puuid: partner.puuid },
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

  const ownRows: OwnRow[] = own.map((r) => ({
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
  }));

  return { partner, ...computeDuoSynergy(ownRows, partnerRows as PartnerRow[]) };
}
