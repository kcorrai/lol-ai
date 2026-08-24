import { invoke, isTauri } from "@tauri-apps/api/core";
import type {
  DesktopChampion,
  DesktopChampionEntry,
  DesktopChampionList,
  DesktopCounter,
} from "../../../src/domains/desktop/championsContract";

export type { DesktopChampion, DesktopChampionEntry, DesktopChampionList, DesktopCounter };

/**
 * The champion browser, from the webview's side of the IPC boundary.
 *
 * Nothing this reads is personal — it is the patch's own numbers, the same ones the website
 * shows anyone. It still goes through the Rust core, because the endpoint it comes from
 * wants the device token and the token is not allowed to exist in a browser context
 * (ADR-038). There is no call in this module that could produce one.
 */

/** The five lanes, named here rather than imported: `@/domains/meta` is server code. */
export const LANES = ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"] as const;
export type Lane = (typeof LANES)[number];

/**
 * Riot's own names for three of these are not what anybody calls them, and the short forms
 * are what fit: five tabs share the width of a window that sits beside a game, and
 * "SUPPORT" is clipped there where "SUP" is not.
 */
export const LANE_LABELS: Record<Lane, string> = {
  TOP: "Top",
  JUNGLE: "Jungle",
  MIDDLE: "Mid",
  BOTTOM: "Bot",
  UTILITY: "Sup",
};

/** Thrown with the message the core produced, which is already written for the player. */
export class ChampionsError extends Error {}

/** `null` means this machine holds no token the website still accepts. */
export async function readChampionList(lane: Lane): Promise<DesktopChampionList | null> {
  if (!isTauri()) return null;

  try {
    return await invoke<DesktopChampionList | null>("champion_list", { position: lane });
  } catch (err) {
    throw asError(err);
  }
}

/** `null` means unpaired, or that the patch has no reading for this champion in this lane. */
export async function readChampion(key: string, lane: Lane): Promise<DesktopChampion | null> {
  if (!isTauri()) return null;

  try {
    return await invoke<DesktopChampion | null>("champion_detail", { key, position: lane });
  } catch (err) {
    throw asError(err);
  }
}

/**
 * Tauri rejects with whatever the command serialised, and `AppError` serialises to its own
 * message — including the website's, for the cases where that is the half that tells the
 * player what to do next.
 */
function asError(err: unknown): ChampionsError {
  return new ChampionsError(typeof err === "string" ? err : "Could not reach LoL AI Coach.");
}
