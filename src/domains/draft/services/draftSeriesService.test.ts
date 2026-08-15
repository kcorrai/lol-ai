import { beforeEach, describe, expect, it, vi } from "vitest";
import { POOL } from "@/test/draftFixtures";
import { normaliseKey } from "@/domains/draft/engine/draft.types";
import { createGames, replaceGame } from "@/domains/draft/engine/stateUtils";
import { sideToAct } from "@/domains/draft/engine/sequence";
import type { DraftGameState, DraftSeriesState, SeriesMode } from "@/domains/draft/engine/draft.types";
import type { DraftSeriesRecord } from "./draftRecord";

vi.mock("./draftRepository", () => {
  class DraftVersionConflictError extends Error {}
  return {
    DraftVersionConflictError,
    insertSeries: vi.fn(),
    loadRecordFromDb: vi.fn(),
    persistGameTransition: vi.fn(),
    deleteExpiredSeries: vi.fn(),
  };
});

vi.mock("./draftStateCache", () => ({
  readCachedRecord: vi.fn(async () => null),
  writeCachedRecord: vi.fn(async () => undefined),
  invalidateCachedRecord: vi.fn(async () => undefined),
}));

vi.mock("./draftChampionPool", () => ({
  getChampionPool: vi.fn(),
  __resetChampionPool: vi.fn(),
}));

import * as repo from "./draftRepository";
import { getChampionPool } from "./draftChampionPool";
import {
  getSeriesForGame,
  resolveViewer,
  setBlueTeam,
  setGameResult,
  setReady,
  submitAction,
  undoAction,
} from "./draftSeriesService";

const BLUE_TOKEN = "blue-token";
const RED_TOKEN = "red-token";

/** The stand-in for Postgres: one record, mutated by persistGameTransition. */
let store: DraftSeriesRecord;
let conflictOnNextWrite = false;

function makeRecord(mode: SeriesMode = "NORMAL", gameCount = 1): DraftSeriesRecord {
  const games = createGames(gameCount);
  const state: DraftSeriesState = {
    code: "abcd2345",
    team1Name: "Team 1",
    team2Name: "Team 2",
    mode,
    gameCount,
    timerSeconds: 30,
    disabledChampions: [],
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
    games,
  };
  return {
    id: "series-1",
    state,
    blueToken: BLUE_TOKEN,
    redToken: RED_TOKEN,
    gameIds: Object.fromEntries(games.map((g) => [g.gameNumber, `game-${g.gameNumber}`])),
  };
}

function gameOf(gameNumber = 1): DraftGameState {
  const game = store.state.games.find((g) => g.gameNumber === gameNumber);
  if (!game) throw new Error(`no game ${gameNumber}`);
  return game;
}

async function readyBoth(gameNumber = 1): Promise<void> {
  await setReady(store.state.code, gameNumber, BLUE_TOKEN, true);
  await setReady(store.state.code, gameNumber, RED_TOKEN, true);
}

/** Plays `keys` in order, always on whichever side is up. */
async function playAll(keys: readonly string[], gameNumber = 1): Promise<void> {
  for (const key of keys) {
    const side = sideToAct(gameOf(gameNumber).step);
    if (!side) throw new Error("draft already complete");
    const token = side === "BLUE" ? BLUE_TOKEN : RED_TOKEN;
    const result = await submitAction(store.state.code, gameNumber, token, key);
    if (!result.ok) throw new Error(`rejected: ${result.reason}`);
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  store = makeRecord();
  conflictOnNextWrite = false;

  vi.mocked(repo.loadRecordFromDb).mockImplementation(async (code) =>
    code === store.state.code ? store : null
  );
  vi.mocked(repo.persistGameTransition).mockImplementation(async (record, prev, next) => {
    const current = store.state.games.find((g) => g.gameNumber === next.gameNumber);
    if (conflictOnNextWrite || !current || current.version !== prev.version) {
      throw new repo.DraftVersionConflictError();
    }
    store = { ...store, state: replaceGame(store.state, next) };
  });
  vi.mocked(getChampionPool).mockResolvedValue({
    ranked: [...POOL],
    known: new Set(POOL.map(normaliseKey)),
  });
});

describe("resolveViewer", () => {
  it("maps each token to its side and everything else to spectator", () => {
    const record = makeRecord();
    expect(resolveViewer(record, BLUE_TOKEN)).toBe("BLUE");
    expect(resolveViewer(record, RED_TOKEN)).toBe("RED");
    expect(resolveViewer(record, "not-a-token")).toBe("SPECTATOR");
    expect(resolveViewer(record, null)).toBe("SPECTATOR");
    expect(resolveViewer(record, undefined)).toBe("SPECTATOR");
  });
});

describe("draft lifecycle", () => {
  it("runs create → ready → full draft → complete", async () => {
    await readyBoth();
    expect(gameOf().phase).toBe("IN_PROGRESS");

    await playAll(POOL);

    expect(gameOf().phase).toBe("COMPLETE");
    expect(gameOf().actions).toHaveLength(20);
    expect(gameOf().step).toBe(20);
  });

  it("records a winner once the draft is finished", async () => {
    await readyBoth();
    await playAll(POOL);
    const result = await setGameResult(store.state.code, 1, BLUE_TOKEN, "BLUE");
    expect(result.ok).toBe(true);
    expect(gameOf().winnerSide).toBe("BLUE");
  });

  it("undoes the last action", async () => {
    await readyBoth();
    await playAll(POOL.slice(0, 3));
    const result = await undoAction(store.state.code, 1, RED_TOKEN);
    expect(result.ok).toBe(true);
    expect(gameOf().actions).toHaveLength(2);
  });

  it("seats a team on blue before the ready check but not after", async () => {
    expect((await setBlueTeam(store.state.code, 1, BLUE_TOKEN, 2)).ok).toBe(true);
    expect(gameOf().blueTeam).toBe(2);
    await readyBoth();
    const late = await setBlueTeam(store.state.code, 1, BLUE_TOKEN, 1);
    expect(late).toMatchObject({ ok: false, status: 409, reason: "not-in-lobby" });
  });
});

describe("access control", () => {
  it("rejects an unknown code", async () => {
    const result = await getSeriesForGame("nosuchcode", 1, BLUE_TOKEN);
    expect(result).toMatchObject({ ok: false, status: 404, reason: "not-found" });
  });

  it("rejects an unknown game number", async () => {
    const result = await getSeriesForGame(store.state.code, 9, BLUE_TOKEN);
    expect(result).toMatchObject({ ok: false, status: 404, reason: "unknown-game" });
  });

  it("refuses to let a spectator act", async () => {
    await readyBoth();
    const result = await submitAction(store.state.code, 1, "not-a-token", "Ahri");
    expect(result).toMatchObject({ ok: false, status: 403, reason: "not-a-drafter" });
  });

  it("lets a spectator read, and reports their role", async () => {
    const result = await getSeriesForGame(store.state.code, 1, null);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.role).toBe("SPECTATOR");
  });

  it("refuses an action from the side that is not up", async () => {
    await readyBoth();
    const result = await submitAction(store.state.code, 1, RED_TOKEN, "Ahri");
    expect(result).toMatchObject({ ok: false, status: 409, reason: "not-your-turn" });
    expect(gameOf().actions).toHaveLength(0);
  });

  it("refuses a champion that is already gone", async () => {
    await readyBoth();
    await playAll(["Ahri"]);
    const result = await submitAction(store.state.code, 1, RED_TOKEN, "Ahri");
    expect(result).toMatchObject({ ok: false, status: 409, reason: "already-used" });
  });

  it("refuses a champion that does not exist", async () => {
    await readyBoth();
    const result = await submitAction(store.state.code, 1, BLUE_TOKEN, "NotAChampion");
    expect(result).toMatchObject({ ok: false, status: 409, reason: "unknown-champion" });
  });
});

describe("concurrency", () => {
  it("reports a version conflict and drops the cached read model", async () => {
    const { invalidateCachedRecord } = await import("./draftStateCache");
    conflictOnNextWrite = true;
    const result = await setReady(store.state.code, 1, BLUE_TOKEN, true);
    expect(result).toMatchObject({ ok: false, status: 409, reason: "version-conflict" });
    expect(invalidateCachedRecord).toHaveBeenCalledWith(store.state.code);
  });
});

describe("fearless series", () => {
  it("locks game 1's picks out of game 2", async () => {
    store = makeRecord("FEARLESS", 2);
    await readyBoth(1);
    await playAll(POOL, 1);

    const pickedInGameOne = gameOf(1)
      .actions.filter((a) => a.kind === "PICK")
      .map((a) => a.championKey);
    expect(pickedInGameOne).toHaveLength(10);

    await readyBoth(2);
    const result = await submitAction(store.state.code, 2, BLUE_TOKEN, pickedInGameOne[0]!);
    expect(result).toMatchObject({ ok: false, status: 409, reason: "series-locked" });

    // A champion only *banned* in game 1 is available again.
    const bannedInGameOne = gameOf(1).actions.find((a) => a.kind === "BAN")?.championKey;
    expect((await submitAction(store.state.code, 2, BLUE_TOKEN, bannedInGameOne!)).ok).toBe(true);
  });
});

describe("expired turns", () => {
  it("auto-locks a lapsed turn on the next read, without anyone acting", async () => {
    await readyBoth();
    // Rewind the turn's start well past the 30 s limit.
    const stale = { ...gameOf(), turnStartedAt: new Date(Date.now() - 120_000).toISOString() };
    store = { ...store, state: replaceGame(store.state, stale) };

    const result = await getSeriesForGame(store.state.code, 1, null);
    expect(result.ok).toBe(true);
    expect(gameOf().step).toBe(1);
    expect(gameOf().actions[0]).toMatchObject({ kind: "BAN", championKey: null, timedOut: true });
  });

  it("settles the lapsed turn before judging an incoming action", async () => {
    await readyBoth();
    const stale = { ...gameOf(), turnStartedAt: new Date(Date.now() - 120_000).toISOString() };
    store = { ...store, state: replaceGame(store.state, stale) };

    // Blue's ban lapsed, so it is red's turn — blue acting now is out of turn,
    // and the lapse is persisted regardless of that rejection.
    const result = await submitAction(store.state.code, 1, BLUE_TOKEN, "Ahri");
    expect(result).toMatchObject({ ok: false, status: 409, reason: "not-your-turn" });
    expect(gameOf().step).toBe(1);
    expect(gameOf().actions).toHaveLength(1);
  });
});
