import type {
  CellMatch,
  ClassicCell,
  ClassicRow,
  QuizChampion,
  YearHint,
} from "@/domains/quiz/types/quiz.types";

// The eight-column comparison behind the Classic grid. Green means the guess and
// the answer agree, amber means they overlap without agreeing, red means neither.
// Only release year breaks the pattern: a colour there would waste the one
// attribute that can carry a direction, so it gets an arrow instead.

const JOIN = ", ";

function single(guess: string, answer: string): ClassicCell {
  return { value: guess, match: guess === answer ? "exact" : "none" };
}

/**
 * Amber is the whole reason multi-valued columns are worth having: a champion
 * who shares one of two regions with the answer has told the player something
 * that a plain right/wrong cell would have thrown away.
 */
function multi(guess: readonly string[], answer: readonly string[]): ClassicCell {
  const answerSet = new Set(answer);
  const shared = guess.filter((v) => answerSet.has(v)).length;
  let match: CellMatch = "none";
  if (shared > 0) match = shared === guess.length && shared === answer.length ? "exact" : "partial";
  return { value: guess.join(JOIN), match };
}

function year(guess: number, answer: number): ClassicCell & { hint: YearHint } {
  const hint: YearHint = guess === answer ? "equal" : answer > guess ? "higher" : "lower";
  return { value: String(guess), match: hint === "equal" ? "exact" : "none", hint };
}

/** Compares one guess against the day's answer. Pure — the answer never leaves. */
export function compareClassic(guess: QuizChampion, answer: QuizChampion): ClassicRow {
  return {
    champion: { id: guess.id, name: guess.name },
    gender: single(guess.gender, answer.gender),
    positions: multi(guess.positions, answer.positions),
    species: multi(guess.species, answer.species),
    resource: single(guess.resource, answer.resource),
    rangeType: single(guess.rangeType, answer.rangeType),
    regions: multi(guess.regions, answer.regions),
    classes: multi(guess.classes, answer.classes),
    releaseYear: year(guess.releaseYear, answer.releaseYear),
  };
}

/** Column order, shared by the grid header and the share summary. */
export const CLASSIC_COLUMNS = [
  { key: "gender", label: "Gender" },
  { key: "positions", label: "Position" },
  { key: "species", label: "Species" },
  { key: "resource", label: "Resource" },
  { key: "rangeType", label: "Range" },
  { key: "regions", label: "Region" },
  { key: "classes", label: "Class" },
  { key: "releaseYear", label: "Year" },
] as const;

export type ClassicColumnKey = (typeof CLASSIC_COLUMNS)[number]["key"];

/** True when every column matched — i.e. the player found the champion. */
export function isSolvedRow(row: ClassicRow): boolean {
  return CLASSIC_COLUMNS.every((col) => row[col.key].match === "exact");
}
