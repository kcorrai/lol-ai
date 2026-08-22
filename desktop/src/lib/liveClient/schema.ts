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

export const playerSchema = z.looseObject({
  championName: z.string(),
  team: z.enum(TEAMS),
  isDead: z.boolean(),
  respawnTimer: z.number(),
  level: z.number(),
  scores: scoresSchema,
  isBot: z.boolean().optional(),
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

export const activePlayerSchema = z.looseObject({
  level: z.number(),
  currentGold: z.number(),
  riotId: z.string().optional(),
  summonerName: z.string().optional(),
});

export const gameDataSchema = z.looseObject({
  gameMode: z.string(),
  /** Seconds since the gates opened, as a float. */
  gameTime: z.number(),
  mapName: z.string(),
  mapNumber: z.number(),
  mapTerrain: z.string(),
});

export const gameEventSchema = z.looseObject({
  EventID: z.number(),
  EventName: z.string(),
  EventTime: z.number(),
});

export const allGameDataSchema = z.looseObject({
  activePlayer: activePlayerSchema,
  allPlayers: z.array(playerSchema),
  events: z.looseObject({ Events: z.array(gameEventSchema) }),
  gameData: gameDataSchema,
});

export type Scores = z.infer<typeof scoresSchema>;
export type LivePlayer = z.infer<typeof playerSchema>;
export type ActivePlayer = z.infer<typeof activePlayerSchema>;
export type GameData = z.infer<typeof gameDataSchema>;
export type GameEvent = z.infer<typeof gameEventSchema>;
export type AllGameData = z.infer<typeof allGameDataSchema>;

/** Whichever identity this client version supplied, or a blank so the UI renders a dash. */
export function displayNameOf(p: { riotId?: string; summonerName?: string }): string {
  return p.riotId ?? p.summonerName ?? "";
}
