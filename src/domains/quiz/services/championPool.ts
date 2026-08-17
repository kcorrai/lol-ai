import attributes from "@/domains/quiz/data/championAttributes.json";
import type { QuizChampion } from "@/domains/quiz/types/quiz.types";

// The quiz reads champions from the committed dataset, never from the network.
// scripts/syncQuizChampionData.ts builds it; see that file for why.

interface AttributeFile {
  version: string;
  champions: QuizChampion[];
}

const file = attributes as unknown as AttributeFile;

/** Patch the dataset was generated from — shown in the UI as a freshness note. */
export const DATASET_VERSION: string = file.version;

const CHAMPIONS: readonly QuizChampion[] = Object.freeze(
  file.champions.slice().sort((a, b) => a.name.localeCompare(b.name))
);

export function allChampions(): readonly QuizChampion[] {
  return CHAMPIONS;
}

const BY_ID = new Map(CHAMPIONS.map((c) => [c.id.toLowerCase(), c]));

/**
 * Champion names are typed by hand, so matching has to survive punctuation and
 * spacing: "kaisa", "Kai'Sa" and "kai sa" are all the same guess. Data Dragon ids
 * already strip most of it, which is why they are the canonical key.
 */
function fold(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const BY_FOLDED = new Map<string, QuizChampion>();
for (const champ of CHAMPIONS) {
  BY_FOLDED.set(fold(champ.name), champ);
  BY_FOLDED.set(fold(champ.id), champ);
}
// Names players actually type that fold to something else entirely.
const ALIASES: Record<string, string> = {
  wukong: "MonkeyKing",
  monkeyking: "MonkeyKing",
  nunu: "Nunu",
  nunuwillump: "Nunu",
  mundo: "DrMundo",
  drmundo: "DrMundo",
  jarvan: "JarvanIV",
  jarvaniv: "JarvanIV",
  j4: "JarvanIV",
  mf: "MissFortune",
  tf: "TwistedFate",
  asol: "AurelionSol",
  yi: "MasterYi",
  gp: "GangPlank",
  renata: "Renata",
  ksante: "KSante",
  blitz: "Blitzcrank",
};

export function findChampion(id: string): QuizChampion | null {
  return BY_ID.get(id.toLowerCase()) ?? null;
}

/** Resolves a typed guess to a champion, or null if it matches nobody. */
export function resolveGuess(input: string): QuizChampion | null {
  const folded = fold(input);
  if (!folded) return null;
  const aliased = ALIASES[folded];
  if (aliased) {
    const byAlias = BY_ID.get(aliased.toLowerCase());
    if (byAlias) return byAlias;
  }
  return BY_FOLDED.get(folded) ?? null;
}

/** Name + id only — what the guess autocomplete needs, and nothing more. */
export function championIndex(): { id: string; name: string }[] {
  return CHAMPIONS.map((c) => ({ id: c.id, name: c.name }));
}

/** Champions with at least one skin beyond the base, for the Splash puzzle. */
export function splashPool(): readonly QuizChampion[] {
  return CHAMPIONS.filter((c) => c.skinNums.length > 0);
}
