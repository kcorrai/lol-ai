// Shared vocabulary for the daily quiz. The champion attribute values here are
// the ones the Classic grid compares against, so they double as the contract
// between scripts/syncQuizChampionData.ts and everything that reads the data.

export type QuizMode = "classic" | "ability" | "splash" | "lore" | "quote" | "emoji";

export const QUIZ_MODES: readonly QuizMode[] = [
  "classic",
  "ability",
  "splash",
  "lore",
  "quote",
  "emoji",
] as const;

export function isQuizMode(value: string): value is QuizMode {
  return (QUIZ_MODES as readonly string[]).includes(value);
}

export type Gender = "Male" | "Female" | "Other";
export type RangeType = "Melee" | "Ranged";
export type Position = "Top" | "Jungle" | "Mid" | "Bot" | "Support";
export type AbilitySlot = "P" | "Q" | "W" | "E" | "R";

export const ABILITY_SLOTS: readonly AbilitySlot[] = ["P", "Q", "W", "E", "R"] as const;

export interface ChampionAbility {
  slot: AbilitySlot;
  name: string;
  /** Data Dragon image filename, e.g. "AatroxQ.png" — the asset proxy needs it. */
  image: string;
}

/**
 * One champion as the quiz sees it. Everything except `gender`, `species` and
 * `regions` is derived from Data Dragon / Meraki by the sync script; those three
 * have no live source anywhere and come from the hand-curated overlay.
 */
export interface QuizChampion {
  id: string; // Data Dragon id, e.g. "Aatrox"
  key: number; // Riot numeric id, e.g. 266
  name: string; // display name, e.g. "Aatrox"
  title: string;
  gender: Gender;
  species: string[];
  regions: string[];
  positions: Position[];
  classes: string[]; // Data Dragon tags: Fighter, Mage, Assassin, Marksman, Tank, Support
  resource: string; // "Mana" | "Energy" | "Manaless" | "Blood Well" | …
  rangeType: RangeType;
  releaseYear: number;
  skinNums: number[]; // splash art indices available for this champion
  /** Lore prose, used by the Lore puzzle. Baked in so a Data Dragon outage
   *  cannot reach the quiz (LA-13). */
  lore: string;
  abilities: ChampionAbility[];
}

/** A single Classic-grid cell verdict. */
export type CellMatch = "exact" | "partial" | "none";

/** Release year is the one column that leaks a direction instead of a colour. */
export type YearHint = "higher" | "lower" | "equal";

export interface ClassicCell {
  value: string;
  match: CellMatch;
}

export interface ClassicRow {
  champion: Pick<QuizChampion, "id" | "name">;
  gender: ClassicCell;
  positions: ClassicCell;
  species: ClassicCell;
  resource: ClassicCell;
  rangeType: ClassicCell;
  regions: ClassicCell;
  classes: ClassicCell;
  releaseYear: ClassicCell & { hint: YearHint };
}

/** What `GET /api/quiz/today` returns — deliberately carries no answer. */
export interface DailyPuzzle {
  mode: QuizMode;
  dateKey: string; // "2026-08-17" (UTC)
  puzzleNumber: number;
  /** Set only in practice mode; echoed back so guesses land on the same puzzle. */
  practiceSeed?: string;
  /** Mode-specific prompt. Never contains anything that identifies the answer. */
  prompt: QuizPrompt;
  nextResetAt: string; // ISO timestamp of the next UTC midnight
}

export type QuizPrompt =
  | { kind: "classic" }
  | { kind: "ability"; assetUrl: string }
  | { kind: "splash"; assetUrl: string }
  | { kind: "lore"; text: string }
  | { kind: "quote"; text: string }
  | { kind: "emoji"; emojis: string[] };

/** What the server sends back for one guess. */
export interface GuessResult {
  guess: string;
  correct: boolean;
  /** Populated for Classic only — the eight compared columns. */
  row?: ClassicRow;
  /** Revealed once solved (or given up) so the UI can show the answer. */
  answer?: { id: string; name: string; title: string };
  /** Extra clue unlocked by this miss, if the mode has one. */
  hint?: string;
}
