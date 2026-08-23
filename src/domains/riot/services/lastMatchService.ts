import { QUEUE_MAP } from "@/domains/riot/mappers/matchMapper";
import { getAccountByRiotId, getMatch, getMatchIds } from "@/domains/riot/services/riotApiClient";
import type { MatchDTO, ParticipantDTO } from "@/domains/riot/types/riot.types";
import { computeKDA } from "@/lib/kda";

export interface LastMatchPlayer {
  championName: string;
  position: string;
  riotId: string;
}

export interface LastMatchSummary {
  matchId: string;
  /** A `QueueType` when the queue is known, otherwise Riot's raw game mode. */
  queue: string;
  durationSeconds: number;
  endedAt: Date;
  win: boolean;
  /** True for a game that ended in a remake — the stats are meaningless. */
  remake: boolean;
  player: LastMatchPlayer;
  kills: number;
  deaths: number;
  assists: number;
  kda: number;
  cs: number;
  csPerMinute: number;
  goldEarned: number;
  damageToChampions: number;
  /** This player's share of their team's champion damage, 0–1. */
  damageShare: number;
  visionScore: number;
  /** Finished items, trinket excluded — an empty slot is dropped, not zero. */
  items: number[];
  opponent: LastMatchPlayer | null;
}

// Riot marks a remake by ending the game early; below this the summary would be
// reporting a 0/0/0 nobody played.
const REMAKE_SECONDS = 300;

function riotIdOf(p: ParticipantDTO): string {
  return p.riotIdGameName && p.riotIdTagline
    ? `${p.riotIdGameName}#${p.riotIdTagline}`
    : p.championName;
}

function findOpponent(dto: MatchDTO, player: ParticipantDTO): ParticipantDTO | null {
  if (!player.teamPosition) return null;
  return (
    dto.info.participants.find(
      (p) => p.teamId !== player.teamId && p.teamPosition === player.teamPosition
    ) ?? null
  );
}

function summarise(dto: MatchDTO, puuid: string): LastMatchSummary | null {
  const player = dto.info.participants.find((p) => p.puuid === puuid);
  if (!player) return null;

  const minutes = dto.info.gameDuration / 60;
  const cs = player.totalMinionsKilled + player.neutralMinionsKilled;
  const teamDamage = dto.info.participants
    .filter((p) => p.teamId === player.teamId)
    .reduce((sum, p) => sum + p.totalDamageDealtToChampions, 0);
  const opponent = findOpponent(dto, player);

  return {
    matchId: dto.metadata.matchId,
    queue: QUEUE_MAP[dto.info.queueId] ?? dto.info.gameMode,
    durationSeconds: dto.info.gameDuration,
    endedAt: new Date(dto.info.gameEndTimestamp),
    win: player.win,
    remake: dto.info.gameDuration < REMAKE_SECONDS,
    player: {
      championName: player.championName,
      position: player.teamPosition,
      riotId: riotIdOf(player),
    },
    kills: player.kills,
    deaths: player.deaths,
    assists: player.assists,
    kda: computeKDA(player.kills, player.deaths, player.assists),
    cs,
    csPerMinute: minutes > 0 ? Math.round((cs / minutes) * 10) / 10 : 0,
    goldEarned: player.goldEarned,
    damageToChampions: player.totalDamageDealtToChampions,
    damageShare: teamDamage > 0 ? player.totalDamageDealtToChampions / teamDamage : 0,
    visionScore: player.visionScore,
    items: [
      player.item0,
      player.item1,
      player.item2,
      player.item3,
      player.item4,
      player.item5,
    ].filter((id) => id > 0),
    opponent: opponent
      ? {
          championName: opponent.championName,
          position: opponent.teamPosition,
          riotId: riotIdOf(opponent),
        }
      : null,
  };
}

/**
 * The most recent game for a Riot ID, summarised.
 *
 * `buildAccountPreview` already returns recent matches, but only champion, win
 * and K/D/A — not CS per minute, damage share or items, which is the difference
 * between a line in a list and a card worth reading. That costs one extra
 * match-v5 call, so it is its own service rather than a widening of the preview
 * every landing-page visitor pays for.
 *
 * Returns null when the account has no match history at all.
 */
export async function getLastMatchSummary(
  gameName: string,
  tagLine: string,
  region: string
): Promise<LastMatchSummary | null> {
  const account = await getAccountByRiotId(gameName, tagLine, region);
  const [matchId] = await getMatchIds(account.puuid, region, 1);
  if (!matchId) return null;

  const dto = await getMatch(matchId, region);
  return summarise(dto, account.puuid);
}
