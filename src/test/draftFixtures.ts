import type {
  DraftGameState,
  DraftSeriesState,
  SeriesMode,
} from "@/domains/draft/engine/draft.types";
import type { DraftChampion } from "@/domains/draft/draftCatalog.types";
import { applyAction } from "@/domains/draft/engine/reducer";
import { sideToAct } from "@/domains/draft/engine/sequence";
import { createGames } from "@/domains/draft/engine/stateUtils";

export const T0 = "2026-08-15T12:00:00.000Z";

interface SeriesOverrides {
  mode?: SeriesMode;
  gameCount?: number;
  timerSeconds?: number;
  disabledChampions?: string[];
}

export function makeSeries(overrides: SeriesOverrides = {}): DraftSeriesState {
  const gameCount = overrides.gameCount ?? 1;
  return {
    code: "testcode",
    team1Name: "Team 1",
    team2Name: "Team 2",
    mode: overrides.mode ?? "NORMAL",
    gameCount,
    timerSeconds: overrides.timerSeconds ?? 30,
    disabledChampions: overrides.disabledChampions ?? [],
    createdAt: T0,
    expiresAt: "2026-08-22T12:00:00.000Z",
    games: createGames(gameCount),
  };
}

/** A series whose game `gameNumber` has both sides ready and the clock running. */
export function started(series: DraftSeriesState, gameNumber = 1): DraftSeriesState {
  return {
    ...series,
    games: series.games.map((g) =>
      g.gameNumber === gameNumber
        ? { ...g, phase: "IN_PROGRESS", blueReady: true, redReady: true, turnStartedAt: T0 }
        : g
    ),
  };
}

export function gameOf(series: DraftSeriesState, gameNumber = 1): DraftGameState {
  const game = series.games.find((g) => g.gameNumber === gameNumber);
  if (!game) throw new Error(`no game ${gameNumber}`);
  return game;
}

/** Walks a live draft forward, taking each champion on whichever side is up. */
export function play(
  series: DraftSeriesState,
  keys: readonly string[],
  gameNumber = 1
): DraftSeriesState {
  return keys.reduce<DraftSeriesState>((acc, key) => {
    const side = sideToAct(gameOf(acc, gameNumber).step);
    if (!side) throw new Error("draft already complete");
    const result = applyAction(acc, gameNumber, side, key, T0);
    if (!result.ok) throw new Error(`step rejected: ${result.reason}`);
    return result.series;
  }, series);
}

/** Twenty distinct champion keys — enough to drive a full draft in a test. */
export const POOL: readonly string[] = [
  "Aatrox",
  "Ahri",
  "Akali",
  "Alistar",
  "Amumu",
  "Anivia",
  "Annie",
  "Ashe",
  "Azir",
  "Bard",
  "Braum",
  "Caitlyn",
  "Camille",
  "Darius",
  "Diana",
  "Draven",
  "Ekko",
  "Elise",
  "Ezreal",
  "Fiora",
];

/** A catalogue entry with sane defaults; override only what the test is about. */
export function makeDraftChampion(
  key: string,
  name: string,
  overrides: Partial<DraftChampion> = {}
): DraftChampion {
  return {
    key,
    name,
    lanes: ["MIDDLE"],
    winRate: 50,
    pickRate: 5,
    banRate: 2,
    tags: ["Mage"],
    attack: 3,
    magic: 8,
    ...overrides,
  };
}
