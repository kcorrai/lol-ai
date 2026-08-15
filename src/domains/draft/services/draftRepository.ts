import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { createGames } from "@/domains/draft/engine/stateUtils";
import type {
  DraftGameState,
  DraftSeriesState,
  SeriesMode,
  TeamNumber,
} from "@/domains/draft/engine/draft.types";
import type { DraftSeriesRecord } from "./draftRecord";

/** Someone else advanced this game while we were deciding. The caller re-reads. */
export class DraftVersionConflictError extends Error {
  constructor() {
    super("draft game version conflict");
    this.name = "DraftVersionConflictError";
  }
}

export interface InsertSeriesInput {
  code: string;
  blueToken: string;
  redToken: string;
  team1Name: string;
  team2Name: string;
  mode: SeriesMode;
  gameCount: number;
  timerSeconds: number;
  disabledChampions: string[];
  createdById: string | null;
  expiresAt: Date;
}

const WITH_GAMES = {
  games: { include: { actions: true }, orderBy: { gameNumber: "asc" } },
} as const;

type SeriesRow = Prisma.DraftSeriesGetPayload<{
  include: { games: { include: { actions: true } } };
}>;

function toGameState(row: SeriesRow["games"][number]): DraftGameState {
  return {
    gameNumber: row.gameNumber,
    blueTeam: (row.blueTeam === 2 ? 2 : 1) as TeamNumber,
    phase: row.phase,
    step: row.step,
    blueReady: row.blueReady,
    redReady: row.redReady,
    turnStartedAt: row.turnStartedAt?.toISOString() ?? null,
    winnerSide: row.winnerSide,
    version: row.version,
    actions: [...row.actions]
      .sort((a, b) => a.step - b.step)
      .map((a) => ({
        step: a.step,
        side: a.side,
        kind: a.kind,
        championKey: a.championKey,
        timedOut: a.timedOut,
      })),
  };
}

export function toRecord(row: SeriesRow): DraftSeriesRecord {
  const state: DraftSeriesState = {
    code: row.code,
    team1Name: row.team1Name,
    team2Name: row.team2Name,
    mode: row.mode,
    gameCount: row.gameCount,
    timerSeconds: row.timerSeconds,
    disabledChampions: row.disabledChampions,
    createdAt: row.createdAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
    games: row.games.map(toGameState),
  };
  const gameIds: Record<number, string> = {};
  for (const game of row.games) gameIds[game.gameNumber] = game.id;

  return { id: row.id, state, blueToken: row.blueToken, redToken: row.redToken, gameIds };
}

export async function loadRecordFromDb(code: string): Promise<DraftSeriesRecord | null> {
  const row = await prisma.draftSeries.findUnique({ where: { code }, include: WITH_GAMES });
  return row ? toRecord(row) : null;
}

export async function insertSeries(input: InsertSeriesInput): Promise<DraftSeriesRecord> {
  const row = await prisma.draftSeries.create({
    data: {
      code: input.code,
      blueToken: input.blueToken,
      redToken: input.redToken,
      team1Name: input.team1Name,
      team2Name: input.team2Name,
      mode: input.mode,
      gameCount: input.gameCount,
      timerSeconds: input.timerSeconds,
      disabledChampions: input.disabledChampions,
      createdById: input.createdById,
      expiresAt: input.expiresAt,
      games: {
        create: createGames(input.gameCount).map((g) => ({
          gameNumber: g.gameNumber,
          blueTeam: g.blueTeam,
        })),
      },
    },
    include: WITH_GAMES,
  });
  return toRecord(row);
}

/**
 * Write one game's new state. The `version: prev.version` guard is what makes
 * two simultaneous locks impossible: the second `updateMany` matches nothing and
 * the caller is told to re-read rather than silently overwriting the first.
 *
 * Actions are synced by count because the engine only ever appends one or drops
 * one; a full diff would be more code for a case that cannot arise.
 */
export async function persistGameTransition(
  record: DraftSeriesRecord,
  prev: DraftGameState,
  next: DraftGameState
): Promise<void> {
  const gameId = record.gameIds[next.gameNumber];
  if (!gameId) throw new DraftVersionConflictError();

  await prisma.$transaction(async (tx) => {
    const updated = await tx.draftGame.updateMany({
      where: { id: gameId, version: prev.version },
      data: {
        blueTeam: next.blueTeam,
        phase: next.phase,
        step: next.step,
        blueReady: next.blueReady,
        redReady: next.redReady,
        turnStartedAt: next.turnStartedAt ? new Date(next.turnStartedAt) : null,
        winnerSide: next.winnerSide,
        version: next.version,
      },
    });
    if (updated.count === 0) throw new DraftVersionConflictError();

    if (next.actions.length < prev.actions.length) {
      await tx.draftAction.deleteMany({
        where: { gameId, step: { gte: next.actions.length } },
      });
    } else if (next.actions.length > prev.actions.length) {
      await tx.draftAction.createMany({
        data: next.actions.slice(prev.actions.length).map((a) => ({
          gameId,
          step: a.step,
          side: a.side,
          kind: a.kind,
          championKey: a.championKey,
          timedOut: a.timedOut,
        })),
      });
    }
  });
}

export async function deleteExpiredSeries(now: Date = new Date()): Promise<number> {
  const { count } = await prisma.draftSeries.deleteMany({ where: { expiresAt: { lt: now } } });
  return count;
}
