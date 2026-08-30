import { invoke, isTauri } from "@tauri-apps/api/core";
import { z } from "zod";

/**
 * Champion select, read through the League Client Update API.
 *
 * **The core ships with this switched off.** Riot does not support the LCU for
 * third-party applications and requires pre-release approval for every release and every
 * update, plus a ban on using it for players in Korea (ADR-038). `isChampSelectAvailable`
 * is asked first so the UI can say "not in this build" rather than rendering a panel that
 * could only ever be empty.
 *
 * Nothing here automates anything. Accepting a queue, picking a champion or banning one is
 * input taken on the player's behalf, which is Riot's own definition of scripting.
 */

/** One pick or ban slot, as the client publishes it. */
export const champSelectActionSchema = z.looseObject({
  /** 0 when nobody has hovered anything yet, which is the ordinary opening state. */
  championId: z.number(),
  completed: z.boolean(),
  type: z.string(),
  actorCellId: z.number(),
});

export const champSelectPlayerSchema = z.looseObject({
  cellId: z.number(),
  championId: z.number(),
  assignedPosition: z.string().optional(),
});

/**
 * Loose, like the Live Client schemas and for the same reason — but more so: this API is
 * explicitly undocumented and Riot guarantees no change communication for it. Anything
 * not read here rides through untouched.
 */
export const champSelectSchema = z.looseObject({
  actions: z.array(z.array(champSelectActionSchema)).optional(),
  myTeam: z.array(champSelectPlayerSchema).optional(),
  theirTeam: z.array(champSelectPlayerSchema).optional(),
  localPlayerCellId: z.number().optional(),
});

export type ChampSelectAction = z.infer<typeof champSelectActionSchema>;
export type ChampSelectPlayer = z.infer<typeof champSelectPlayerSchema>;
export type ChampSelect = z.infer<typeof champSelectSchema>;

/** The rune page shape the Rust core writes, mirroring what `getChampionBuild` returns. */
export interface PerkPage {
  name: string;
  primaryStyleId: number;
  subStyleId: number;
  selectedPerkIds: number[];
}

/** Whether this build can talk to the League client at all. False in every shipped build. */
export async function isChampSelectAvailable(): Promise<boolean> {
  if (!isTauri()) return false;
  try {
    return await invoke<boolean>("lcu_available");
  } catch {
    return false;
  }
}

/**
 * The current champion select, or `null` when there is not one — which covers the client
 * being closed, the player being in a lobby, and this build not carrying the capability.
 */
export async function readChampSelect(): Promise<ChampSelect | null> {
  if (!isTauri()) return null;

  const body = await invoke<unknown>("lcu_champ_select");
  if (body === null || body === undefined) return null;

  const parsed = champSelectSchema.safeParse(body);
  // An unreadable session is treated as no session. This API changes without notice, and
  // a shape that has moved must cost the panel rather than the app.
  return parsed.success ? parsed.data : null;
}

/**
 * Writes one rune page into the client. `false` means the client is not running.
 *
 * The player asks for this; it never happens on its own. An import that fired by itself on
 * lock-in would be the app changing the game's state without being told to.
 */
export async function applyRunes(page: PerkPage): Promise<boolean> {
  if (!isTauri()) return false;
  return invoke<boolean>("lcu_apply_runes", { page });
}

/**
 * The champion the local player has locked or hovered, or null.
 *
 * Derived from the two fields that name it: the local player's cell, and the entry in
 * `myTeam` that matches. A `championId` of 0 means nothing is hovered yet, which is not a
 * champion.
 */
export function localChampionId(session: ChampSelect): number | null {
  const cellId = session.localPlayerCellId;
  if (cellId === undefined) return null;

  const me = session.myTeam?.find((p) => p.cellId === cellId);
  if (!me || me.championId === 0) return null;
  return me.championId;
}

/**
 * The champions the enemy team has locked in.
 *
 * Only completed picks, and only champions — never the players holding them. Riot requires
 * non-party summoner names in ranked champion select to be shown as "Ally 1" and so on,
 * and the cleanest way to honour that is for the name never to leave this module.
 */
export function enemyChampionIds(session: ChampSelect): number[] {
  return (session.theirTeam ?? []).map((p) => p.championId).filter((id) => id > 0);
}
