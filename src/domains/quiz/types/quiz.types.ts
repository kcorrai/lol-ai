// Shared vocabulary for the daily quiz. The champion attribute values here are
// the ones the Classic grid compares against, so they double as the contract
// between scripts/syncQuizChampionData.ts and everything that reads the data.

export type QuizMode =
  | "classic"
  | "ability"
  | "splash"
  | "lore"
  | "quote"
  | "emoji"
  | "build"
  | "impostor";

export const QUIZ_MODES: readonly QuizMode[] = [
  "classic",
  "ability",
  "splash",
  "lore",
  "quote",
  "emoji",
  "build",
  "impostor",
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

/**
 * One champion's signature item path, as `scripts/syncQuizBuildData.ts` compiles
 * it from op.gg. Baked into the repo for the same reason the champion facts are:
 * the quiz must not depend on a third party being up at request time (LA-13).
 *
 * `boots` is legitimately empty for the champions who never buy them, and that
 * absence is itself a clue rather than missing data.
 */
export interface ChampionBuildEntry {
  position: Position;
  core: number[];
  boots: number[];
  starter: number[];
  spells: number[];
  /** Ability max priority, e.g. ["Q", "E", "W"]. */
  skillMax: string[];
}

/** One item as the Build prompt shows it: the icon URL carries the id, the name
 *  is the alt text and the reveal. */
export interface BuildItem {
  id: number;
  name: string;
}

/** A summoner spell as the Build prompt shows it. `image` is the Data Dragon
 *  filename, which is what `spellIconUrl` needs. */
export interface BuildSpell {
  id: number;
  name: string;
  image: string;
}

/** Everything a build references, named, so nothing has to be looked up live. */
export interface BuildDataFile {
  version: string;
  items: Record<string, { name: string }>;
  /** Keyed by summoner spell id; `image` is the Data Dragon filename. */
  spells: Record<string, { name: string; image: string }>;
  builds: Record<string, ChampionBuildEntry>;
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
  | { kind: "emoji"; emojis: string[] }
  | {
      kind: "build";
      /** The opening items, always present. Everything below arrives with misses. */
      core: BuildItem[];
      boots?: BuildItem[];
      starter?: BuildItem[];
      spells?: BuildSpell[];
      /** Ability max order, e.g. ["Q", "E", "W"]. */
      skillMax?: string[];
    }
  | {
      kind: "impostor";
      /** Eight champions, one of which is the answer. Named, because reading
       *  splash art is not the puzzle and a button needs an accessible name. */
      candidates: { id: string; name: string }[];
      /** Null until three misses; `value` stays null until five. */
      trait: { category: string; value: string | null } | null;
    };

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
  /** Why the answer was the answer. Emoji and Impostor only, and only once the
   *  puzzle is over — it names the champion outright. */
  explanation?: PuzzleExplanation;
}

/** Where in a champion's own record an emoji's meaning turned up. */
export type EchoSource =
  | "name"
  | "title"
  | "ability"
  | "species"
  | "region"
  | "class"
  | "resource"
  | "lore";

/** One decoded emoji: what the picture shows, and where the champion echoes it. */
export interface EmojiClue {
  glyph: string;
  /** What the emoji depicts, in a word — "fox", "crown", "ice". */
  label: string;
  /** A plain colour swatch is a different kind of clue from a picture: there is
   *  usually no word for it anywhere, and saying so beats implying a failure. */
  kind: "colour" | "symbol";
  /** Absent when nothing in the champion's record carries the word. Saying
   *  nothing is better than inventing a connection. */
  echo?: {
    source: EchoSource;
    /** The champion's own text — a title, an ability name, a lore sentence. */
    text: string;
    /** The word that matched, so the UI can pick it out inside `text`. */
    term: string;
  };
}

/** The answer's public facts, shown alongside the decoded clues. */
export interface ChampionFingerprint {
  id: string;
  name: string;
  title: string;
  species: string[];
  regions: string[];
  classes: string[];
  resource: string;
  rangeType: RangeType;
  positions: Position[];
}

/** One of the eight Impostor portraits, with what it holds on the hidden axis. */
export interface ImpostorVerdict {
  id: string;
  name: string;
  isImpostor: boolean;
  /** Everything this champion carries on the trait's axis — its regions, its
   *  classes, and so on. Empty only if the dataset has nothing there. */
  values: string[];
}

/** Why the answer was the answer. Sent only once the puzzle is finished. */
export type PuzzleExplanation =
  | { kind: "emoji"; champion: ChampionFingerprint; clues: EmojiClue[] }
  | {
      kind: "impostor";
      /** How the axis reads: "region", "class", "release era". */
      category: string;
      /** What the other seven shared. */
      value: string;
      /** What the impostor had there instead — empty when it had nothing. */
      impostorValues: string[];
      candidates: ImpostorVerdict[];
    };
