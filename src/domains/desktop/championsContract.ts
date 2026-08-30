import { z } from "zod";
// Relative, not aliased. The desktop app compiles this file with its own tsconfig, where
// `@/` points at `desktop/src` — an alias here would resolve on the website and nowhere else.
import { desktopAbilitySchema } from "./abilitiesContract";
import { liveBuildSchema, liveChampionSchema } from "./contract";

// The champion browser's half of the website contract (LA-75, ADR-042).
//
// A sibling of `contract.ts` rather than more of it: that file is the pairing and
// live-game contract and is already at the length CLAUDE.md calls a design smell.
// Everything else about it applies here unchanged — the desktop app imports these
// types by relative path, and the Rust core mirrors the shapes by hand because the
// device token that authenticates the request may never enter a webview.
//
// Nothing here is personal. It is the same patch-current reading the website's own
// tier list and counter pages show, carried to the machine the game runs on.

/** One champion's line in a lane's list. The same numbers the website's tier list ranks on. */
export const desktopChampionEntrySchema = z.object({
  /** The Data Dragon id — "Ahri", "MonkeyKing" — which is what every other service keys on. */
  championKey: z.string(),
  name: z.string(),
  /** 1 (best) .. 5. Zero means the snapshot gave none, which the app renders as no tier. */
  tier: z.number(),
  /** Ordinal within the lane. */
  rank: z.number(),
  winRate: z.number(),
  pickRate: z.number(),
  banRate: z.number(),
  games: z.number(),
  /** The sample is too small for the tier and rank to be worth reading. Said out loud. */
  lowConfidence: z.boolean(),
});
export type DesktopChampionEntry = z.infer<typeof desktopChampionEntrySchema>;

/** What `GET /api/desktop/champions` answers: one lane, best first. */
export const desktopChampionListSchema = z.object({
  position: z.string(),
  patch: z.string(),
  entries: z.array(desktopChampionEntrySchema),
});
export type DesktopChampionList = z.infer<typeof desktopChampionListSchema>;

/**
 * One matchup, from the subject champion's side.
 *
 * `subjectWinRate` is always the *subject's* rate into this opponent, in both lists, so a
 * single number means the same thing wherever it is rendered — under 50 in `counteredBy`
 * and 50 or over in `goodInto`.
 */
export const desktopCounterSchema = z.object({
  championKey: z.string(),
  name: z.string(),
  games: z.number(),
  subjectWinRate: z.number(),
});
export type DesktopCounter = z.infer<typeof desktopCounterSchema>;

/** The subject champion's own record in the lane being shown. */
export const desktopChampionStatsSchema = z.object({
  games: z.number(),
  winRate: z.number(),
  pickRate: z.number(),
  banRate: z.number(),
  tier: z.number(),
});
export type DesktopChampionStats = z.infer<typeof desktopChampionStatsSchema>;

/**
 * What `GET /api/desktop/champions/[key]` answers.
 *
 * `position` is what the website resolved rather than what was asked for: a champion that
 * is not played in the requested lane is answered in the lane it is played in, and
 * `availablePositions` is what lets the app say so instead of showing an empty page.
 *
 * `build` is `liveBuildSchema` — the same shape the live game panel already renders, so the
 * app has one build component and not two. Null when the snapshot carries no build for this
 * champion and lane.
 */
export const desktopChampionSchema = z.object({
  champion: liveChampionSchema,
  position: z.string(),
  patch: z.string(),
  availablePositions: z.array(z.string()),
  stats: desktopChampionStatsSchema,
  build: liveBuildSchema.nullable(),
  /**
   * The champion's epithet — "The Nine-Tailed Fox". Null when the Data Dragon catalogue
   * could not be read, which is a missing line rather than a missing champion: every
   * number on the screen comes from the patch snapshot and arrives regardless.
   */
  title: z.string().nullable(),
  /** Riot's own classes: ["Mage", "Assassin"]. Empty when the catalogue was unreachable. */
  tags: z.array(z.string()),
  /** Passive first, then Q/W/E/R. Empty when the catalogue was unreachable. */
  abilities: z.array(desktopAbilitySchema),
  /** Opponents that beat this champion — its counters, hardest first. */
  counteredBy: z.array(desktopCounterSchema),
  /** Opponents this champion beats, most favourable first. */
  goodInto: z.array(desktopCounterSchema),
});
export type DesktopChampion = z.infer<typeof desktopChampionSchema>;
