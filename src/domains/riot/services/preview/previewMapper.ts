import type { ParticipantDetail } from "@/domains/match";
import { computeDamageShare, computeKillParticipation } from "@/domains/analysis";
import { computeKDA } from "@/lib/kda";
import { QUEUE_MAP } from "@/domains/riot/mappers/matchMapper";
import type { MatchDTO, ParticipantDTO } from "@/domains/riot/types/riot.types";
import type { PreviewMatch, PreviewScoreboard } from "@/types/preview";

/**
 * DTO → view-model for the public profile.
 *
 * Deliberately separate from `matchMapper.ts`: that one produces Prisma create-inputs for the
 * sync pipeline and is bound to the schema's enums, while nothing here is ever written down. The
 * two agree on the arithmetic (CS is minions + neutrals, runes come off `perks.styles`) and are
 * both tested, which is the property that matters.
 */

/** Riot reports a remake as a near-zero duration; dividing by it produces nonsense per-minute rates. */
const MIN_MINUTES = 1 / 60;

function minutesOf(gameDurationSeconds: number): number {
  return Math.max(gameDurationSeconds / 60, MIN_MINUTES);
}

function creepScore(p: ParticipantDTO): number {
  return p.totalMinionsKilled + p.neutralMinionsKilled;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Kills scored by the participant's own side, the denominator for kill participation. */
function teamKills(dto: MatchDTO, teamId: number): number {
  return dto.info.participants.reduce((sum, p) => (p.teamId === teamId ? sum + p.kills : sum), 0);
}

function teamDamage(dto: MatchDTO, teamId: number): number {
  return dto.info.participants.reduce(
    (sum, p) => (p.teamId === teamId ? sum + p.totalDamageDealtToChampions : sum),
    0
  );
}

/**
 * The subject player's row in the match list.
 *
 * Returns null when the PUUID is not in the match, which happens when Riot's match-ids endpoint
 * hands back an id the account has since been removed from — the caller drops the row rather
 * than rendering an empty one.
 */
export function toPreviewMatch(dto: MatchDTO, puuid: string): PreviewMatch | null {
  const p = dto.info.participants.find((x) => x.puuid === puuid);
  if (!p) return null;

  const duration = dto.info.gameDuration;
  const cs = creepScore(p);

  return {
    matchId: dto.metadata.matchId,
    // A queue we have no name for is null rather than a guess: the filter tabs only offer queues
    // they can label, and an unlabelled row still renders under "All".
    queueType: QUEUE_MAP[dto.info.queueId] ?? null,
    gameDurationSeconds: duration,
    // `gameEndTimestamp` is absent on very old matches; falling back to creation keeps the stamp
    // approximately right instead of printing 1970.
    gameEndedAt: new Date(dto.info.gameEndTimestamp || dto.info.gameCreation).toISOString(),
    championId: p.championId,
    championName: p.championName,
    champLevel: p.champLevel,
    win: p.win,
    // Riot leaves `teamPosition` empty for ARAM and for a game it could not assign a lane in.
    position: p.teamPosition || "FILL",
    kills: p.kills,
    deaths: p.deaths,
    assists: p.assists,
    cs,
    csPerMinute: round2(cs / minutesOf(duration)),
    visionScore: p.visionScore,
    goldEarned: p.goldEarned,
    damageDealt: p.totalDamageDealtToChampions,
    killParticipation: computeKillParticipation(p.kills, p.assists, teamKills(dto, p.teamId)),
    itemIds: [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5],
    trinketId: p.item6,
    summonerSpell1: p.summoner1Id,
    summonerSpell2: p.summoner2Id,
    runePrimaryKeystone: p.perks?.styles?.[0]?.selections?.[0]?.perk ?? null,
    runePrimaryPath: p.perks?.styles?.[0]?.style ?? null,
    runeSecondaryPath: p.perks?.styles?.[1]?.style ?? null,
  };
}

/**
 * All ten rows, shaped for `MatchScoreboard`.
 *
 * Ranks stay null throughout — see `PreviewScoreboard`. `id` is the PUUID because the component
 * only uses it as a React key and no database row exists for these players.
 */
export function toPreviewScoreboard(dto: MatchDTO): PreviewScoreboard {
  const duration = dto.info.gameDuration;
  const minutes = minutesOf(duration);

  const participants: ParticipantDetail[] = dto.info.participants.map((p) => {
    const cs = creepScore(p);
    return {
      id: p.puuid,
      riotAccountId: null,
      puuid: p.puuid,
      gameName: p.riotIdGameName || null,
      tagLine: p.riotIdTagline || null,
      championName: p.championName,
      position: p.teamPosition || "FILL",
      teamId: p.teamId,
      kills: p.kills,
      deaths: p.deaths,
      assists: p.assists,
      cs,
      csPerMinute: round2(cs / minutes),
      goldEarned: p.goldEarned,
      goldPerMinute: round2(p.goldEarned / minutes),
      damageDealt: p.totalDamageDealtToChampions,
      damageTaken: p.totalDamageTaken,
      visionScore: p.visionScore,
      firstBlood: p.firstBloodKill,
      won: p.win,
      kda: computeKDA(p.kills, p.deaths, p.assists),
      damageShare: computeDamageShare(p.totalDamageDealtToChampions, teamDamage(dto, p.teamId)),
      killParticipation: computeKillParticipation(p.kills, p.assists, teamKills(dto, p.teamId)),
      itemIds: [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5],
      summonerSpell1: p.summoner1Id,
      summonerSpell2: p.summoner2Id,
      runePrimaryKeystone: p.perks?.styles?.[0]?.selections?.[0]?.perk ?? null,
      runePrimaryPath: p.perks?.styles?.[0]?.style ?? null,
      runeSecondaryPath: p.perks?.styles?.[1]?.style ?? null,
      rankTier: null,
      rankDivision: null,
      rankLp: null,
    };
  });

  const winner = dto.info.teams.find((t) => t.win);

  return {
    participants,
    // Falling back to the participants rather than defaulting to 100: a wrong winning team makes
    // the scoreboard print the losing half first and label it the winner.
    winningTeam: winner?.teamId ?? participants.find((p) => p.won)?.teamId ?? 100,
  };
}
