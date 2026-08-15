import { findGame } from "@/domains/draft/engine/stateUtils";
import { applyBlueTeam, applyGameResult, applyReady } from "@/domains/draft/engine/lobby";
import { applyAction, applyUndo, resolveTimeout } from "@/domains/draft/engine/reducer";
import type {
  DraftGameState,
  DraftSeriesState,
  DraftSide,
  SeriesMode,
  TeamNumber,
  TransitionResult,
} from "@/domains/draft/engine/draft.types";
import { getChampionPool } from "./draftChampionPool";
import type { DraftSeriesRecord, ViewerRole } from "./draftRecord";
import {
  DraftVersionConflictError,
  insertSeries,
  loadRecordFromDb,
  persistGameTransition,
} from "./draftRepository";
import { invalidateCachedRecord, readCachedRecord, writeCachedRecord } from "./draftStateCache";
import { generateCode, generateToken, tokensMatch } from "./draftTokens";

const SERIES_TTL_DAYS = 7;

export interface CreateSeriesInput {
  team1Name: string;
  team2Name: string;
  mode: SeriesMode;
  gameCount: number;
  timerSeconds: number;
  disabledChampions: string[];
  createdById: string | null;
}

export interface CreateSeriesResult {
  code: string;
  blueToken: string;
  redToken: string;
}

export type ServiceResult =
  | { ok: true; state: DraftSeriesState; role: ViewerRole }
  | { ok: false; status: number; reason: string };

export function resolveViewer(record: DraftSeriesRecord, token?: string | null): ViewerRole {
  if (tokensMatch(token, record.blueToken)) return "BLUE";
  if (tokensMatch(token, record.redToken)) return "RED";
  return "SPECTATOR";
}

async function loadRecord(code: string): Promise<DraftSeriesRecord | null> {
  const cached = await readCachedRecord(code);
  if (cached) return cached;
  const fresh = await loadRecordFromDb(code);
  if (fresh) await writeCachedRecord(fresh);
  return fresh;
}

export async function createSeries(input: CreateSeriesInput): Promise<CreateSeriesResult> {
  const expiresAt = new Date(Date.now() + SERIES_TTL_DAYS * 24 * 60 * 60 * 1000);
  const record = await insertSeries({
    ...input,
    code: generateCode(),
    blueToken: generateToken(),
    redToken: generateToken(),
    expiresAt,
  });
  await writeCachedRecord(record);
  return { code: record.state.code, blueToken: record.blueToken, redToken: record.redToken };
}

/**
 * Load, settle an expired turn, run a transition, persist. Everything a route
 * does goes through here, so the timeout is settled before any request is
 * judged — a drafter cannot benefit from having replied late.
 */
async function transition(
  code: string,
  gameNumber: number,
  token: string | null | undefined,
  requireDrafter: boolean,
  run: (series: DraftSeriesState, side: DraftSide) => TransitionResult
): Promise<ServiceResult> {
  const record = await loadRecord(code);
  if (!record) return { ok: false, status: 404, reason: "not-found" };

  const role = resolveViewer(record, token);
  if (requireDrafter && role === "SPECTATOR") {
    return { ok: false, status: 403, reason: "not-a-drafter" };
  }

  const prevGame = findGame(record.state, gameNumber);
  if (!prevGame) return { ok: false, status: 404, reason: "unknown-game" };

  const nowIso = new Date().toISOString();
  const pool = await getChampionPool();

  const settled = resolveTimeout(record.state, gameNumber, nowIso, pool.ranked);
  const base = settled.ok ? settled.series : record.state;

  const result = run(base, role === "SPECTATOR" ? "BLUE" : role);
  const finalState = result.ok ? result.series : base;
  const changed = (settled.ok && settled.changed) || (result.ok && result.changed);

  const persisted = await commit(record, prevGame, finalState, gameNumber, changed);
  if (persisted) return persisted;

  if (!result.ok) return { ok: false, status: 409, reason: result.reason };
  return { ok: true, state: finalState, role };
}

/** Returns a failure to short-circuit on, or null when the write went through. */
async function commit(
  record: DraftSeriesRecord,
  prevGame: DraftGameState,
  finalState: DraftSeriesState,
  gameNumber: number,
  changed: boolean
): Promise<ServiceResult | null> {
  if (!changed) return null;

  const nextGame = findGame(finalState, gameNumber);
  if (!nextGame) return { ok: false, status: 500, reason: "missing-game" };

  try {
    await persistGameTransition(record, prevGame, nextGame);
  } catch (err) {
    if (err instanceof DraftVersionConflictError) {
      // Our copy was stale. Drop the cached read model so the client's retry
      // reads Postgres rather than the same stale entry.
      await invalidateCachedRecord(record.state.code);
      return { ok: false, status: 409, reason: "version-conflict" };
    }
    throw err;
  }

  await writeCachedRecord({ ...record, state: finalState });
  return null;
}

export async function getSeries(code: string, token?: string | null): Promise<ServiceResult> {
  return transition(code, 1, token, false, (series) => ({ ok: true, series, changed: false }));
}

/** Same as `getSeries`, but settles an expired turn in the game being watched. */
export async function getSeriesForGame(
  code: string,
  gameNumber: number,
  token?: string | null
): Promise<ServiceResult> {
  return transition(code, gameNumber, token, false, (series) => ({
    ok: true,
    series,
    changed: false,
  }));
}

export async function setReady(
  code: string,
  gameNumber: number,
  token: string,
  ready: boolean
): Promise<ServiceResult> {
  const nowIso = new Date().toISOString();
  return transition(code, gameNumber, token, true, (series, side) =>
    applyReady(series, gameNumber, side, ready, nowIso)
  );
}

export async function submitAction(
  code: string,
  gameNumber: number,
  token: string,
  championKey: string | null
): Promise<ServiceResult> {
  const nowIso = new Date().toISOString();
  const pool = await getChampionPool();
  return transition(code, gameNumber, token, true, (series, side) =>
    applyAction(series, gameNumber, side, championKey, nowIso, pool.known)
  );
}

export async function undoAction(
  code: string,
  gameNumber: number,
  token: string
): Promise<ServiceResult> {
  const nowIso = new Date().toISOString();
  return transition(code, gameNumber, token, true, (series) =>
    applyUndo(series, gameNumber, nowIso)
  );
}

export async function setGameResult(
  code: string,
  gameNumber: number,
  token: string,
  winnerSide: DraftSide
): Promise<ServiceResult> {
  return transition(code, gameNumber, token, true, (series) =>
    applyGameResult(series, gameNumber, winnerSide)
  );
}

export async function setBlueTeam(
  code: string,
  gameNumber: number,
  token: string,
  blueTeam: TeamNumber
): Promise<ServiceResult> {
  return transition(code, gameNumber, token, true, (series) =>
    applyBlueTeam(series, gameNumber, blueTeam)
  );
}
