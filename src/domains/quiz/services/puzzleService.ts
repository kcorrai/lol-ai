import { allChampions, splashPool } from "@/domains/quiz/services/championPool";
import {
  fnv1a,
  nextResetAt,
  pickDaily,
  puzzleNumber,
  utcDateKey,
} from "@/domains/quiz/services/dailySeed";
import quotes from "@/domains/quiz/data/championQuotes.json";
import emoji from "@/domains/quiz/data/championEmoji.json";
import type {
  ChampionAbility,
  DailyPuzzle,
  QuizChampion,
  QuizMode,
  QuizPrompt,
} from "@/domains/quiz/types/quiz.types";

// Both files carry a `_readme` key documenting how they are maintained, which is
// why these go through `unknown` — no champion is ever called "_readme", so the
// lookups below can never reach it.
const QUOTES = quotes as unknown as Record<string, string>;
const EMOJI = emoji as unknown as Record<string, string[]>;

/** Champions eligible for a mode. Quote and Emoji only cover what is curated, so
 *  a champion without a line or an emoji set is simply never dealt. */
function poolFor(mode: QuizMode): readonly QuizChampion[] {
  switch (mode) {
    case "splash":
      return splashPool();
    case "quote":
      return allChampions().filter((c) => Boolean(QUOTES[c.id]));
    case "emoji":
      return allChampions().filter((c) => (EMOJI[c.id]?.length ?? 0) > 0);
    default:
      return allChampions();
  }
}

/** The answer for a mode on a given UTC day. Server-side only — never serialised
 *  into a response until the player has solved or given up. */
export function answerFor(mode: QuizMode, dateKey: string): QuizChampion {
  return pickDaily(poolFor(mode), mode, dateKey);
}

/**
 * Which of the five abilities the Ability puzzle shows. Seeded off the date so it
 * is stable through the day, and separately from the champion pick so the same
 * champion dealt again next cycle is unlikely to show the same icon.
 */
export function abilityFor(champion: QuizChampion, dateKey: string): ChampionAbility {
  const index = fnv1a(`ability-slot:${dateKey}:${champion.id}`) % champion.abilities.length;
  return champion.abilities[index];
}

/** Which skin's splash art to crop. Base art is the giveaway, so skins are fair game. */
export function skinNumFor(champion: QuizChampion, dateKey: string): number {
  const index = fnv1a(`splash-skin:${dateKey}:${champion.id}`) % champion.skinNums.length;
  return champion.skinNums[index];
}

/**
 * 169 of 173 lores name the champion outright, and most name their own abilities,
 * titles and home region too. Everything that would hand the answer over is
 * blanked before the text is sent.
 */
export function redactLore(champion: QuizChampion): string {
  const terms = new Set<string>([
    champion.name,
    champion.id,
    ...champion.name.split(/[\s'&]+/).filter((w) => w.length > 2),
    ...champion.abilities.map((a) => a.name),
    ...champion.abilities.flatMap((a) => a.name.split(/\s+/).filter((w) => w.length > 3)),
    ...champion.title.split(/\s+/).filter((w) => w.length > 3),
  ]);

  let text = champion.lore;
  // Longest first, so "Aurelion Sol" is blanked before "Sol" can leave a stub.
  for (const term of [...terms].filter(Boolean).sort((a, b) => b.length - a.length)) {
    text = text.replace(new RegExp(`\\b${escapeRegExp(term)}${SUFFIX}\\b`, "gi"), "▮▮▮");
  }
  // Collapse the runs the replacement leaves behind ("▮▮▮ ▮▮▮" reveals a word count).
  return text.replace(/(?:▮▮▮[\s,'-]*)+/g, "▮▮▮ ").trim();
}

/**
 * Only ordinary inflections are swallowed along with a redacted term.
 *
 * Blanking the bare word left "▮▮▮ y broadsword" for Garen ("Might" → "Mighty")
 * and "▮▮▮ s from the sky" for Aurelion Sol ("Star" → "Stars"), which hands back
 * the shape of the hidden word. Swallowing any trailing letters instead went too
 * far the other way: "Sett" ate "settlement", and "Vi" would have eaten
 * "victory" and "vision" out of her own lore. A fixed suffix list is narrow
 * enough to leave unrelated words alone and wide enough to catch the real cases.
 */
const SUFFIX = "(?:'s|s|es|n|an|ian|ic|y|ed|ing)?";

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** How many emoji are visible after `misses` wrong guesses — one more per miss. */
export function visibleEmoji(champion: QuizChampion, misses: number): string[] {
  return (EMOJI[champion.id] ?? []).slice(0, Math.min(misses + 1, EMOJI[champion.id]?.length ?? 0));
}

export function quoteFor(champion: QuizChampion): string {
  return QUOTES[champion.id] ?? "";
}

/** A clue unlocked by a miss. Classic needs none — its grid is the clue. */
export function hintFor(mode: QuizMode, answer: QuizChampion, misses: number): string | undefined {
  if (misses < 5) return undefined;
  switch (mode) {
    case "quote":
    case "lore":
      return misses >= 8
        ? `${answer.regions.join(", ")} · ${answer.classes.join(", ")}`
        : answer.regions.join(", ");
    case "ability":
    case "splash":
    case "emoji":
      return answer.positions.join(", ");
    default:
      return undefined;
  }
}

function promptFor(mode: QuizMode, answer: QuizChampion, misses: number): QuizPrompt {
  switch (mode) {
    case "classic":
      return { kind: "classic" };
    case "ability":
      return { kind: "ability", assetUrl: "/api/quiz/asset/ability" };
    case "splash":
      // The crop tightens and loosens client-side; the bytes are the same all day,
      // which is what lets the response be cached until the next reset.
      return { kind: "splash", assetUrl: "/api/quiz/asset/splash" };
    case "lore":
      return { kind: "lore", text: redactLore(answer) };
    case "quote":
      return { kind: "quote", text: quoteFor(answer) };
    case "emoji":
      return { kind: "emoji", emojis: visibleEmoji(answer, misses) };
  }
}

/**
 * Today's puzzle for one mode, carrying no answer. `misses` only widens what the
 * prompt reveals (emoji), so passing an inflated count cannot uncover anything a
 * player could not have reached by guessing that many times anyway.
 */
export function buildPuzzle(mode: QuizMode, now: Date, misses = 0): DailyPuzzle {
  const dateKey = utcDateKey(now);
  const answer = answerFor(mode, dateKey);
  return {
    mode,
    dateKey,
    puzzleNumber: puzzleNumber(dateKey),
    prompt: promptFor(mode, answer, misses),
    nextResetAt: nextResetAt(now).toISOString(),
  };
}
