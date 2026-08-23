import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { computeKDA } from "@/domains/analysis/calculators/performanceCalculator";
import {
  buildArchiveWhere,
  type ArchiveFilters,
  type CoPlayerRow,
  type ResolvedFacets,
} from "@/domains/match/services/matchArchiveFilters";

export type ArchiveRow = {
  participantId: string;
  matchDbId: string;
  riotMatchId: string;
  gameStart: string;
  gameDurationSeconds: number;
  queueType: string;
  gameVersion: string;
  championName: string;
  championId: number;
  position: string;
  won: boolean;
  kills: number;
  deaths: number;
  assists: number;
  kda: number;
  cs: number;
  csPerMinute: number;
  visionScore: number;
  goldEarned: number;
  damageDealt: number;
  itemIds: number[];
};

export type ArchiveTotals = {
  games: number;
  wins: number;
  losses: number;
  winRate: number;
  avgKda: number;
  avgKills: number;
  avgDeaths: number;
  avgAssists: number;
  avgCsPerMinute: number;
  avgVisionScore: number;
};

export type ArchivePage = {
  rows: ArchiveRow[];
  nextCursor: string | null;
  /**
   * Null on a continuation page.
   *
   * The totals cover the whole filtered set, not the page, so they do not change as you scroll —
   * which is exactly why recomputing them per page was two full aggregate scans bought for nothing.
   * They are returned once, with the first page, and the caller holds them.
   */
  totals: ArchiveTotals | null;
};

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

/**
 * Resolves the facets that a `where` cannot express on its own (see `ResolvedFacets`).
 *
 * Both resolutions are scoped to the searching player's own rows, so the id sets stay the size of
 * one player's archive rather than the whole table.
 */
async function resolveFacets(puuid: string, filters: ArchiveFilters): Promise<ResolvedFacets> {
  const resolved: ResolvedFacets = {};

  if (filters.playerPuuid) {
    // Only matches we were also in — the intersection is what "played with/against" means, and it
    // keeps the set to our own games rather than every game the other player has ever had indexed.
    const rows = await prisma.matchParticipant.findMany({
      where: { puuid: filters.playerPuuid, match: { participants: { some: { puuid } } } },
      select: { matchId: true, teamId: true },
    });
    resolved.coPlayer = rows satisfies CoPlayerRow[];
  }

  if (filters.minKda !== undefined) {
    resolved.kdaParticipantIds = await participantIdsAboveKda(puuid, filters.minKda);
  }

  return resolved;
}

/**
 * The one raw query in the archive, and the reason is arithmetic rather than joins: KDA is
 * `(kills + assists) / max(deaths, 1)`, computed on read everywhere else in the app
 * (`computeKDA`), and never stored. No Prisma operator compares a column to an expression over
 * other columns, so the threshold has to be evaluated by Postgres.
 *
 * Column names are quoted camelCase because that is what the tables actually have — Prisma maps
 * table names via `@@map` but leaves column names alone. Getting this wrong fails at runtime and
 * never at compile time, which is exactly how LA-38 went unnoticed.
 */
async function participantIdsAboveKda(puuid: string, minKda: number): Promise<string[]> {
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT mp."id"
    FROM match_participants mp
    WHERE mp."puuid" = ${puuid}
      AND (mp."kills" + mp."assists")::float / GREATEST(mp."deaths", 1) >= ${minKda}
  `;
  return rows.map((r) => r.id);
}

export async function searchArchive(
  puuid: string,
  filters: ArchiveFilters,
  cursor?: string,
  limit = DEFAULT_LIMIT
): Promise<ArchivePage> {
  const take = Math.min(Math.max(limit, 1), MAX_LIMIT);
  const where = buildArchiveWhere(puuid, filters, await resolveFacets(puuid, filters));

  const [rows, totals] = await Promise.all([
    prisma.matchParticipant.findMany({
      where,
      // `id` is the tiebreaker that makes the cursor stable: ordering by gameStart alone is not a
      // total order, and two games that start in the same second would page inconsistently.
      orderBy: [{ match: { gameStart: "desc" } }, { id: "desc" }],
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        championName: true,
        championId: true,
        position: true,
        won: true,
        kills: true,
        deaths: true,
        assists: true,
        cs: true,
        csPerMinute: true,
        visionScore: true,
        goldEarned: true,
        damageDealt: true,
        itemIds: true,
        match: {
          select: {
            id: true,
            matchId: true,
            gameStart: true,
            gameDuration: true,
            queueType: true,
            gameVersion: true,
          },
        },
      },
    }),
    // Only for the first page. Every continuation page re-ran both aggregates over an identical
    // where and got an identical answer back, so paging to page five cost ten full-set scans to
    // learn what page one already said.
    cursor ? Promise.resolve(null) : archiveTotals(where),
  ]);

  const hasMore = rows.length > take;
  const page = hasMore ? rows.slice(0, take) : rows;

  return {
    rows: page.map((p) => ({
      participantId: p.id,
      matchDbId: p.match.id,
      riotMatchId: p.match.matchId,
      gameStart: p.match.gameStart.toISOString(),
      gameDurationSeconds: p.match.gameDuration,
      queueType: p.match.queueType,
      gameVersion: p.match.gameVersion,
      championName: p.championName,
      championId: p.championId,
      position: p.position,
      won: p.won,
      kills: p.kills,
      deaths: p.deaths,
      assists: p.assists,
      kda: computeKDA(p.kills, p.deaths, p.assists),
      cs: p.cs,
      csPerMinute: Number(p.csPerMinute),
      visionScore: p.visionScore,
      goldEarned: p.goldEarned,
      damageDealt: p.damageDealt,
      itemIds: p.itemIds,
    })),
    nextCursor: hasMore ? (page[page.length - 1]?.id ?? null) : null,
    totals,
  };
}

/**
 * Aggregates over the *whole* filtered set rather than the page — a win rate that changed as you
 * scrolled would be worse than showing none at all.
 *
 * `avgKda` is the ratio of sums, `(ΣK + ΣA) / ΣD`, not the mean of each game's KDA. Two reasons:
 * it is what every LoL site means by an aggregate KDA, and the mean is not robust here — a single
 * deathless game scores 20+ under `computeKDA`'s `max(deaths, 1)` and drags the average of a
 * hundred games with it. It also costs one aggregate instead of reading every matching row.
 */
export async function archiveTotals(
  where: Prisma.MatchParticipantWhereInput
): Promise<ArchiveTotals> {
  const [agg, wins] = await Promise.all([
    prisma.matchParticipant.aggregate({
      where,
      _count: { _all: true },
      _sum: { kills: true, deaths: true, assists: true },
      _avg: { kills: true, deaths: true, assists: true, csPerMinute: true, visionScore: true },
    }),
    prisma.matchParticipant.count({ where: { AND: [where, { won: true }] } }),
  ]);

  const games = agg._count._all;
  const totalKills = agg._sum.kills ?? 0;
  const totalAssists = agg._sum.assists ?? 0;
  const totalDeaths = agg._sum.deaths ?? 0;
  const avgKda = games > 0 ? computeKDA(totalKills, totalDeaths, totalAssists) : 0;

  return {
    games,
    wins,
    losses: games - wins,
    winRate: games > 0 ? (wins / games) * 100 : 0,
    avgKda,
    avgKills: Number(agg._avg.kills ?? 0),
    avgDeaths: Number(agg._avg.deaths ?? 0),
    avgAssists: Number(agg._avg.assists ?? 0),
    avgCsPerMinute: Number(agg._avg.csPerMinute ?? 0),
    avgVisionScore: Number(agg._avg.visionScore ?? 0),
  };
}

/** The champions and patches actually present in this player's archive, for the filter controls. */
export async function archiveFacetOptions(
  puuid: string
): Promise<{ champions: string[]; patches: string[]; queueTypes: string[] }> {
  const [championRows, matchRows] = await Promise.all([
    prisma.matchParticipant.findMany({
      where: { puuid },
      select: { championName: true },
      distinct: ["championName"],
    }),
    prisma.match.findMany({
      where: { participants: { some: { puuid } } },
      select: { gameVersion: true, queueType: true },
      distinct: ["gameVersion", "queueType"],
    }),
  ]);

  // Patches are grouped to major.minor: "15.14.1" and "15.14.582" are the same patch to a player.
  const patches = [
    ...new Set(matchRows.map((r) => r.gameVersion.split(".").slice(0, 2).join("."))),
  ];

  return {
    champions: championRows.map((r) => r.championName).sort((a, b) => a.localeCompare(b)),
    patches: patches.sort((a, b) => b.localeCompare(a, undefined, { numeric: true })),
    queueTypes: [...new Set(matchRows.map((r) => r.queueType))].sort(),
  };
}
