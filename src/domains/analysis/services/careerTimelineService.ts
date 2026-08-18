// Assembles the career timeline on read. There is no career_events table and there is
// not going to be one (ADR-031): a stored copy of "your peak rank" is a second answer
// to a question `ranked_history` already answers, and the two drift.

import { prisma } from "@/lib/db/prisma";
import { Errors } from "@/lib/api/errors";
import { buildBands, curateIntoBands } from "./careerBands";
import { buildChampionEras, buildRecords } from "./careerEventBuilders";
import {
  buildAcademyEvents,
  buildAchievementEvents,
  buildHabitEvents,
  buildRankHistory,
  buildSeasonEvents,
} from "./careerSourceEvents";
import { EVENT_WEIGHT } from "./careerTimelineConstants";
import type {
  CareerEvent,
  CareerMastery,
  CareerMatchRow,
  CareerTimeline,
} from "./careerTimeline.types";

/**
 * How far back the page looks. Two years is not a product choice — it is roughly what
 * match-v5 retains, so anything older cannot be filled in even in principle.
 */
export const CAREER_WINDOW_DAYS = 730;

const TOP_MASTERY = 5;

async function loadMatchRows(puuid: string, since: Date): Promise<CareerMatchRow[]> {
  // Narrow on purpose. Fully backfilled this is on the order of a thousand rows of
  // small scalars, which is one pass in memory rather than a query per question.
  const rows = await prisma.matchParticipant.findMany({
    where: { puuid, match: { queueType: "RANKED_SOLO_5x5", gameStart: { gte: since } } },
    orderBy: { match: { gameStart: "asc" } },
    select: {
      championId: true,
      championName: true,
      kills: true,
      deaths: true,
      assists: true,
      cs: true,
      csPerMinute: true,
      visionScore: true,
      won: true,
      match: { select: { matchId: true, gameStart: true, gameDuration: true } },
    },
  });

  return rows.map((r) => ({
    matchId: r.match.matchId,
    championId: r.championId,
    championName: r.championName,
    kills: r.kills,
    deaths: r.deaths,
    assists: r.assists,
    cs: r.cs,
    csPerMinute: Number(r.csPerMinute),
    visionScore: r.visionScore,
    won: r.won,
    gameStart: r.match.gameStart,
    gameDuration: r.match.gameDuration,
  }));
}

async function loadMastery(riotAccountId: string): Promise<CareerMastery[]> {
  const rows = await prisma.championStat.findMany({
    where: { riotAccountId, masteryPoints: { not: null } },
    orderBy: { masteryPoints: "desc" },
    take: TOP_MASTERY,
    select: {
      championId: true,
      masteryLevel: true,
      masteryPoints: true,
      champion: { select: { name: true } },
    },
  });

  return rows.map((r) => ({
    championId: r.championId,
    championName: r.champion?.name ?? `Champion ${r.championId}`,
    level: r.masteryLevel ?? 0,
    // BigInt in the column; a points total is far inside a safe integer and has to
    // become one before anything can serialise it.
    points: Number(r.masteryPoints ?? 0),
  }));
}

export async function getCareerTimeline(
  userId: string,
  riotAccountId: string
): Promise<CareerTimeline> {
  const account = await prisma.riotAccount.findUnique({
    where: { id: riotAccountId },
    select: {
      puuid: true,
      gameName: true,
      tagLine: true,
      summonerLevel: true,
      createdAt: true,
    },
  });
  if (!account) throw Errors.notFound("Riot account");

  const since = new Date(Date.now() - CAREER_WINDOW_DAYS * 86_400_000);

  const [rows, mastery, rank, achievements, habits, academy, seasons] = await Promise.all([
    loadMatchRows(account.puuid, since),
    loadMastery(riotAccountId),
    buildRankHistory(riotAccountId, since),
    buildAchievementEvents(userId, since),
    buildHabitEvents(riotAccountId, since),
    buildAcademyEvents(userId, since),
    buildSeasonEvents(userId, since),
  ]);

  const events: CareerEvent[] = [
    ...rank.events,
    ...buildChampionEras(rows),
    ...buildRecords(rows),
    ...achievements,
    ...habits,
    ...academy,
    ...seasons,
  ];

  // The one event that is about us rather than about the game. It is deliberately not
  // called "you started playing" — we have no idea when that was, and saying so would
  // be the single most obvious lie on the page.
  if (account.createdAt >= since) {
    events.push({
      id: `joined:${riotAccountId}`,
      kind: "joined",
      group: "learning",
      at: account.createdAt.toISOString(),
      title: "Tracking started here",
      detail: `${account.gameName}#${account.tagLine} linked to LaneIQ`,
      tone: "neutral",
      weight: EVENT_WEIGHT.joined,
      href: null,
    });
  }

  const { bands, trimmed } = curateIntoBands(buildBands(rows), events);

  const withRank = bands.map((band) => {
    const month = rank.byMonth.get(band.key);
    return month ? { ...band, lpDelta: month.lpDelta, rankAtClose: month.rankAtClose } : band;
  });

  const peakPoint = rank.lpSeries.reduce<{ value: number; label: string } | null>(
    (best, point) => (!best || point.value > best.value ? point : best),
    null
  );
  const currentPoint = rank.lpSeries[rank.lpSeries.length - 1] ?? null;

  return {
    summary: {
      gameName: account.gameName,
      tagLine: account.tagLine,
      summonerLevel: account.summonerLevel,
      firstTrackedAt: rows[0]?.gameStart.toISOString() ?? null,
      lastTrackedAt: rows[rows.length - 1]?.gameStart.toISOString() ?? null,
      totalGames: rows.length,
      totalHours: Math.round(rows.reduce((sum, r) => sum + r.gameDuration, 0) / 3600),
      currentRank: currentPoint?.label ?? null,
      peakRank: peakPoint?.label ?? null,
      topMastery: mastery,
    },
    bands: withRank,
    lpSeries: rank.lpSeries,
    trimmed,
  };
}
