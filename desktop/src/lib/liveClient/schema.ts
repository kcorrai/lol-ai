import { z } from "zod";

/**
 * Shapes for Riot's Live Client Data API (`127.0.0.1:2999`).
 *
 * Every object is a *loose* object on purpose. This API ships with the game client and
 * changes on Riot's patch cadence, not ours; a field appearing is routine and must never
 * turn into a parse failure that blanks the HUD mid-game. So we require only what we
 * actually read and carry the rest through untouched.
 *
 * Verified against Riot's published sample payload, which is committed beside this file.
 */

export const TEAMS = ["ORDER", "CHAOS"] as const;
export type Team = (typeof TEAMS)[number];

export const scoresSchema = z.looseObject({
  kills: z.number(),
  deaths: z.number(),
  assists: z.number(),
  creepScore: z.number(),
  wardScore: z.number(),
});

/**
 * One entry of a player's inventory. The client sends the whole set every poll, trinket
 * and consumables included, so `slot` is what orders it rather than array position.
 */
export const itemSchema = z.looseObject({
  itemID: z.number(),
  slot: z.number(),
  count: z.number(),
  displayName: z.string().optional(),
  price: z.number().optional(),
});

/**
 * One rune or one summoner spell. `id` is numeric for runes and absent entirely for
 * summoner spells — the client identifies those by name alone — so it is optional here
 * rather than split into two near-identical shapes.
 */
export const namedIdSchema = z.looseObject({
  displayName: z.string().optional(),
  id: z.number().optional(),
});

/**
 * An ability is *not* a `namedIdSchema`: the client keys abilities by a string id
 * ("AnnieQ") where it keys runes by a number, and only abilities carry a rank. Riot's
 * committed sample is what settles this — an earlier draft of this file guessed a
 * number here and the fixture rejected it.
 */
export const abilitySchema = z.looseObject({
  abilityLevel: z.number().optional(),
  displayName: z.string().optional(),
  id: z.string().optional(),
});

export const summonerSpellsSchema = z.looseObject({
  summonerSpellOne: namedIdSchema,
  summonerSpellTwo: namedIdSchema,
});

/**
 * What the client publishes about *any* player's runes: the keystone and the two trees.
 * The minor runes are the active player's alone — see `fullRunesSchema`.
 */
export const runesSchema = z.looseObject({
  keystone: namedIdSchema,
  primaryRuneTree: namedIdSchema,
  secondaryRuneTree: namedIdSchema,
});

export const playerSchema = z.looseObject({
  championName: z.string(),
  team: z.enum(TEAMS),
  isDead: z.boolean(),
  respawnTimer: z.number(),
  level: z.number(),
  scores: scoresSchema,
  isBot: z.boolean().optional(),
  /**
   * Empty for every player at 0:00 and for anyone who has bought nothing, which is
   * ordinary rather than an error. Riot's own sample is a game at the gates, so the
   * committed fixture carries the empty case and nothing else.
   */
  items: z.array(itemSchema).optional(),
  summonerSpells: summonerSpellsSchema.optional(),
  runes: runesSchema.optional(),
  /**
   * Empty string in Riot's own sample, and empty in practice for every ARAM player and
   * for anyone the client has not resolved a lane for. Callers must treat "no position"
   * as normal rather than as an error.
   */
  position: z.string().optional(),
  /**
   * `riotId` is the modern identity and `summonerName` the one it replaced. Riot's
   * published sample still carries only the latter, and older clients still emit it, so
   * both are optional and `displayNameOf` picks whichever is present.
   */
  riotId: z.string().optional(),
  summonerName: z.string().optional(),
});

/**
 * The active player's full rune page, which the client publishes for them alone. Kept
 * loose and every field optional: nothing on this screen depends on it yet, and a
 * missing tree must not cost the player their scoreboard.
 */
export const fullRunesSchema = z.looseObject({
  keystone: namedIdSchema.optional(),
  primaryRuneTree: namedIdSchema.optional(),
  secondaryRuneTree: namedIdSchema.optional(),
  generalRunes: z.array(namedIdSchema).optional(),
  statRunes: z.array(namedIdSchema).optional(),
});

/**
 * Twenty-nine live combat stats. Only the handful this app reads are named; the rest
 * ride through untouched, which is what `looseObject` is for.
 */
export const championStatsSchema = z.looseObject({
  currentHealth: z.number().optional(),
  maxHealth: z.number().optional(),
  moveSpeed: z.number().optional(),
  attackDamage: z.number().optional(),
  abilityPower: z.number().optional(),
  armor: z.number().optional(),
  magicResist: z.number().optional(),
});

/** Ability ranks for the active player. Riot keys them by letter, not by index. */
export const abilitiesSchema = z.looseObject({
  Q: abilitySchema.optional(),
  W: abilitySchema.optional(),
  E: abilitySchema.optional(),
  R: abilitySchema.optional(),
  Passive: abilitySchema.optional(),
});

export const activePlayerSchema = z.looseObject({
  level: z.number(),
  currentGold: z.number(),
  riotId: z.string().optional(),
  summonerName: z.string().optional(),
  championStats: championStatsSchema.optional(),
  abilities: abilitiesSchema.optional(),
  fullRunes: fullRunesSchema.optional(),
});

export const gameDataSchema = z.looseObject({
  gameMode: z.string(),
  /** Seconds since the gates opened, as a float. */
  gameTime: z.number(),
  mapName: z.string(),
  mapNumber: z.number(),
  mapTerrain: z.string(),
});

/**
 * One thing that has already happened in this game.
 *
 * The three required fields are on every event. The optional ones are the payloads Riot's
 * own published sample carries — `liveclientdata_events.json`, which is what the docs point
 * at for the list — and each is declared exactly where that file shows it: `KillerName` on
 * everything with an actor, `VictimName` on a champion kill, `DragonType` and `Stolen` on
 * the objectives that have them, `KillStreak` on a multikill, `Acer` and `AcingTeam` on an
 * ace.
 *
 * `EventName` stays a plain string rather than an enum. Riot adds objectives between
 * patches, and an event name this build has not heard of must cost the reader a row rather
 * than failing the parse and blanking every panel that reads this payload mid-game.
 */
export const gameEventSchema = z.looseObject({
  EventID: z.number(),
  EventName: z.string(),
  EventTime: z.number(),
  KillerName: z.string().optional(),
  VictimName: z.string().optional(),
  Assisters: z.array(z.string()).optional(),
  /** Riot's own word for it, passed through — this app does not keep a list of dragons. */
  DragonType: z.string().optional(),
  Stolen: z.union([z.boolean(), z.string()]).optional(),
  /** An internal id like `Turret_T1_C_05_A`. Never decoded: see `timeline.ts`. */
  TurretKilled: z.string().optional(),
  InhibKilled: z.string().optional(),
  KillStreak: z.number().optional(),
  Acer: z.string().optional(),
  AcingTeam: z.string().optional(),
});

export const allGameDataSchema = z.looseObject({
  activePlayer: activePlayerSchema,
  allPlayers: z.array(playerSchema),
  events: z.looseObject({ Events: z.array(gameEventSchema) }),
  gameData: gameDataSchema,
});

export type Scores = z.infer<typeof scoresSchema>;
export type Item = z.infer<typeof itemSchema>;
export type NamedId = z.infer<typeof namedIdSchema>;
export type SummonerSpells = z.infer<typeof summonerSpellsSchema>;
export type Runes = z.infer<typeof runesSchema>;
export type ChampionStats = z.infer<typeof championStatsSchema>;
export type LivePlayer = z.infer<typeof playerSchema>;
export type ActivePlayer = z.infer<typeof activePlayerSchema>;
export type GameData = z.infer<typeof gameDataSchema>;
export type GameEvent = z.infer<typeof gameEventSchema>;
export type AllGameData = z.infer<typeof allGameDataSchema>;

/** Whichever identity this client version supplied, or a blank so the UI renders a dash. */
export function displayNameOf(p: { riotId?: string; summonerName?: string }): string {
  return p.riotId ?? p.summonerName ?? "";
}
