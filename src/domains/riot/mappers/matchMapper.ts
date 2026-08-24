import { createHash } from "crypto";
import type { Prisma, QueueType, Position } from "@prisma/client";
import type { MatchDTO, ParticipantDTO } from "@/domains/riot/types/riot.types";
import { logger } from "@/lib/utils/logger";

export const QUEUE_MAP: Partial<Record<number, QueueType>> = {
  420: "RANKED_SOLO_5x5",
  440: "RANKED_FLEX_SR",
  490: "NORMAL_BLIND", // Quick Play
  430: "NORMAL_BLIND", // Legacy Blind Pick
  400: "NORMAL_DRAFT",
  450: "ARAM",
  1700: "ARENA", // Arena (2v2v2v2)
  900: "URF", // ARURF
  1900: "URF", // Pick URF
  1020: "ONE_FOR_ALL",
  1300: "NEXUS_BLITZ",
};

function mapPosition(teamPosition: string): Position {
  const valid: Record<string, Position> = {
    TOP: "TOP",
    JUNGLE: "JUNGLE",
    MIDDLE: "MIDDLE",
    BOTTOM: "BOTTOM",
    UTILITY: "UTILITY",
  };
  return valid[teamPosition] ?? "UTILITY";
}

/**
 * `queueType` and `gameStart` are the parent match's own values, written onto the child row.
 *
 * They are duplicated, deliberately (ADR-040): a matches row is created once by the ingest
 * transaction and never updated, so the copy has nothing to drift from, and having them here is
 * what lets an index answer "this account's recent ranked games" without reaching into matches
 * for the sort key.
 */
function mapParticipant(
  p: ParticipantDTO,
  matchDbId: string,
  gameDurationSeconds: number,
  riotAccountId: string | null,
  queueType: QueueType,
  gameStart: Date
): Prisma.MatchParticipantCreateManyInput {
  const cs = p.totalMinionsKilled + p.neutralMinionsKilled;
  const minutes = gameDurationSeconds / 60;

  const primaryStyle = p.perks?.styles?.[0];
  const secondaryStyle = p.perks?.styles?.[1];

  return {
    matchId: matchDbId,
    riotAccountId,
    puuid: p.puuid,
    queueType,
    gameStart,
    teamId: p.teamId,
    championId: p.championId,
    championName: p.championName,
    position: mapPosition(p.teamPosition),
    kills: p.kills,
    deaths: p.deaths,
    assists: p.assists,
    cs,
    csPerMinute: parseFloat((cs / minutes).toFixed(2)),
    goldEarned: p.goldEarned,
    goldPerMinute: parseFloat((p.goldEarned / minutes).toFixed(2)),
    damageDealt: p.totalDamageDealtToChampions,
    damageTaken: p.totalDamageTaken,
    damageHealed: p.totalHeal,
    visionScore: p.visionScore,
    wardsPlaced: p.wardsPlaced,
    wardsKilled: p.wardsKilled,
    controlWardsBought: p.visionWardsBoughtInGame,
    turretsDestroyed: p.turretKills ?? 0,
    objectivesStolen: p.objectivesStolen,
    firstBlood: p.firstBloodKill,
    won: p.win,
    timeSpentDead: p.totalTimeSpentDead,
    totalTimeCCDealt: p.timeCCingOthers,
    itemIds: [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5],
    runePrimaryPath: primaryStyle?.style ?? null,
    runePrimaryKeystone: primaryStyle?.selections?.[0]?.perk ?? null,
    runeSecondaryPath: secondaryStyle?.style ?? null,
    summonerSpell1: p.summoner1Id,
    summonerSpell2: p.summoner2Id,
    gameName: p.riotIdGameName ?? null,
    tagLine: p.riotIdTagline ?? null,
  };
}

export type MappedMatch = {
  queueType: QueueType;
  match: Prisma.MatchCreateInput;
  participants: Prisma.MatchParticipantCreateManyInput[];
};

// Returns null for queue types we don't track
export function mapMatch(
  dto: MatchDTO,
  matchDbId: string,
  trackedPuuid: string,
  riotAccountId: string
): MappedMatch | null {
  const queueType = QUEUE_MAP[dto.info.queueId];
  if (!queueType) {
    logger.debug(
      `[matchMapper] skipping unknown queueId=${dto.info.queueId} matchId=${dto.metadata.matchId}`
    );
    return null;
  }

  // Riot sends gameDuration in seconds post-patch 11.20.1
  // Guard against old millisecond format just in case
  const durationSeconds =
    dto.info.gameDuration > 10_000
      ? Math.round(dto.info.gameDuration / 1000)
      : dto.info.gameDuration;

  const winningTeam = dto.info.teams.find((t) => t.win)?.teamId ?? 100;

  const rawHash = createHash("sha256").update(JSON.stringify(dto.info)).digest("hex");

  const gameStart = new Date(dto.info.gameCreation);
  const gameEnd = new Date(dto.info.gameCreation + durationSeconds * 1000);

  const teamObjectives: Record<
    string,
    { towers: number; dragons: number; barons: number; inhibitors: number; heralds: number }
  > = {};
  for (const t of dto.info.teams) {
    teamObjectives[String(t.teamId)] = {
      towers: t.objectives?.tower?.kills ?? 0,
      dragons: t.objectives?.dragon?.kills ?? 0,
      barons: t.objectives?.baron?.kills ?? 0,
      inhibitors: t.objectives?.inhibitor?.kills ?? 0,
      heralds: t.objectives?.riftHerald?.kills ?? 0,
    };
  }

  const match: Prisma.MatchCreateInput = {
    id: matchDbId,
    matchId: dto.metadata.matchId,
    region: dto.info.platformId.toLowerCase(),
    queueId: dto.info.queueId,
    queueType,
    gameMode: dto.info.gameMode,
    gameDuration: durationSeconds,
    gameStart,
    gameEnd,
    gameVersion: dto.info.gameVersion,
    winningTeam,
    teamObjectives,
    rawDataHash: rawHash,
  };

  const participants = dto.info.participants.map((p) =>
    mapParticipant(
      p,
      matchDbId,
      durationSeconds,
      p.puuid === trackedPuuid ? riotAccountId : null,
      queueType,
      gameStart
    )
  );

  return { queueType, match, participants };
}
