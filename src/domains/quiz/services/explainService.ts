import lexicon from "@/domains/quiz/data/emojiLexicon.json";
import { EMOJI_PER_CHAMPION } from "@/domains/quiz/services/clueLadder";
import {
  CATEGORY_LABELS,
  impostorBoard,
  valuesOf,
  type TraitCategory,
} from "@/domains/quiz/services/impostorMode";
import { visibleEmoji } from "@/domains/quiz/services/puzzleService";
import type {
  ChampionFingerprint,
  EchoSource,
  EmojiClue,
  PuzzleExplanation,
  QuizChampion,
  QuizMode,
} from "@/domains/quiz/types/quiz.types";

// Why the answer was the answer.
//
// Emoji and Impostor are the two modes whose answer arrives as a bare name: the
// five pictures are never decoded and nobody is ever told what the other seven
// champions had in common. Both explanations are derived rather than written —
// the lexicon says only what each picture depicts ("🦊" is a fox), and every
// claim about a champion is quoted straight out of the committed dataset. There
// is nowhere here for a fact to be invented.

/** Glyph → the word it depicts, then the other words it may be found under. */
const LEXICON = lexicon as Record<string, string[] | undefined>;

/** Where an echo is looked for, best first. A title beats a lore sentence. */
const SOURCE_ORDER: readonly EchoSource[] = [
  "name",
  "title",
  "ability",
  "species",
  "region",
  "class",
  "resource",
];

/** A lore quote is trimmed to this many characters around the matched word. */
const QUOTE_WIDTH = 150;

/**
 * Plain colour swatches. They are the one clue with no word behind them — "🔴"
 * means the champion reads red, and no title or ability will ever say so — so a
 * colour that finds no echo says "colour cue" rather than reporting a miss.
 */
const COLOUR_GLYPHS = new Set([
  "🔴",
  "🟠",
  "🟡",
  "🟢",
  "🔵",
  "🟣",
  "🟤",
  "⚫",
  "⚪",
  "🟦",
  "💙",
  "💚",
  "💛",
  "💜",
  "🖤",
]);

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * A whole word, tolerating a plural — "wings" still finds "wing" — or a word
 * that opens with the term, which is what catches "chem" inside "Chemtech" and
 * "transform" inside "Transform: Mercury Cannon". Short terms are held to the
 * whole word: three letters open half the roster's words by accident.
 */
function carries(haystack: string, term: string): boolean {
  if (new RegExp(`\\b${escapeRegExp(term)}s?\\b`, "i").test(haystack)) return true;
  return term.length >= 4 && new RegExp(`\\b${escapeRegExp(term)}`, "i").test(haystack);
}

function echoIn(
  champion: QuizChampion,
  source: EchoSource,
  term: string,
  used: ReadonlySet<string>
): string | undefined {
  switch (source) {
    case "name":
      // Substring rather than whole word, because the echo is usually buried:
      // "bear" in Volibear. Short terms are skipped — three letters land inside
      // half the roster by accident.
      return term.length >= 4 && champion.name.toLowerCase().includes(term.toLowerCase())
        ? champion.name
        : undefined;
    case "title":
      return carries(champion.title, term) ? champion.title : undefined;
    case "ability": {
      const ability = champion.abilities.find((a) => carries(a.name, term));
      return ability ? `${ability.slot} · ${ability.name}` : undefined;
    }
    case "species":
      return champion.species.find((s) => carries(s, term));
    case "region":
      return champion.regions.find((r) => carries(r, term));
    case "class":
      return champion.classes.find((c) => carries(c, term));
    case "resource":
      return carries(champion.resource, term) ? champion.resource : undefined;
    case "lore":
      return loreQuote(champion.lore, term, used);
  }
}

/**
 * The sentence of the champion's own lore that carries the word, trimmed around
 * the match so the word a player is being shown is always inside the quote. A
 * sentence another clue already quoted is passed over: five rows repeating one
 * line of lore reads as a bug rather than as five clues.
 */
function loreQuote(lore: string, term: string, used: ReadonlySet<string>): string | undefined {
  const sentences = lore.matchAll(
    new RegExp(`[^.!?]*\\b${escapeRegExp(term)}s?\\b[^.!?]*[.!?]`, "gi")
  );

  for (const match of sentences) {
    const text = match[0].trim();
    const quote = text.length <= QUOTE_WIDTH ? text : clip(text, term);
    if (!used.has(quote)) return quote;
  }
  return undefined;
}

/** A window of the sentence wide enough to carry the matched word with it. */
function clip(text: string, term: string): string {
  const at = text.toLowerCase().indexOf(term.toLowerCase());
  const start = Math.max(0, Math.min(at - QUOTE_WIDTH / 3, text.length - QUOTE_WIDTH));
  return `${start > 0 ? "…" : ""}${text.slice(start, start + QUOTE_WIDTH).trim()}…`;
}

/**
 * One decoded emoji. Every term is tried against the strong sources before the
 * lore is opened at all, so "🔮 orb" prefers Orb of Deception to a sentence that
 * happens to mention an orb.
 */
function decode(champion: QuizChampion, glyph: string, used: ReadonlySet<string>): EmojiClue {
  const terms = LEXICON[glyph] ?? [];
  const clue: EmojiClue = {
    glyph,
    label: terms[0] ?? glyph,
    kind: COLOUR_GLYPHS.has(glyph) ? "colour" : "symbol",
  };

  for (const source of [...SOURCE_ORDER, "lore" as const]) {
    for (const term of terms) {
      const text = echoIn(champion, source, term, used);
      // Two clues pointing at the same title teach nothing the first did not.
      if (text && !used.has(text)) return { ...clue, echo: { source, text, term } };
    }
  }

  return clue;
}

function fingerprint(champion: QuizChampion): ChampionFingerprint {
  return {
    id: champion.id,
    name: champion.name,
    title: champion.title,
    species: champion.species,
    regions: champion.regions,
    classes: champion.classes,
    resource: champion.resource,
    rangeType: champion.rangeType,
    positions: champion.positions,
  };
}

/** Every glyph the Emoji puzzle would have shown, decoded. */
export function explainEmoji(champion: QuizChampion): PuzzleExplanation {
  const used = new Set<string>();
  const clues = visibleEmoji(champion, EMOJI_PER_CHAMPION).map((glyph) => {
    const clue = decode(champion, glyph, used);
    if (clue.echo) used.add(clue.echo.text);
    return clue;
  });

  return { kind: "emoji", champion: fingerprint(champion), clues };
}

/**
 * What the seven shared and what the impostor had instead.
 *
 * The board is rebuilt from the same seed the puzzle was dealt with, so the eight
 * champions listed here are the eight the player was looking at.
 */
export function explainImpostor(champion: QuizChampion, scope: string): PuzzleExplanation {
  const board = impostorBoard(champion, scope);
  const category: TraitCategory = board.trait.category;

  return {
    kind: "impostor",
    category: CATEGORY_LABELS[category],
    value: board.trait.value,
    impostorValues: [...valuesOf(champion, category)],
    candidates: board.candidates.map((candidate) => ({
      id: candidate.id,
      name: candidate.name,
      isImpostor: candidate.id === champion.id,
      values: [...valuesOf(candidate, category)],
    })),
  };
}

/** The explanation for a finished puzzle, if its mode has one. */
export function explainFor(
  mode: QuizMode,
  champion: QuizChampion,
  scope: string
): PuzzleExplanation | undefined {
  if (mode === "emoji") return explainEmoji(champion);
  if (mode === "impostor") return explainImpostor(champion, scope);
  return undefined;
}
