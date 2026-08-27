import { invoke, isTauri } from "@tauri-apps/api/core";
import type { LiveRead } from "./liveClient/client";
import type { PostGame } from "../../../src/domains/desktop/contract";

export type { PostGame };

/**
 * The post-game handoff, from the webview's side of the IPC boundary.
 *
 * Reporting a finished game is authenticated, so it goes through the Rust core like every
 * other call that carries the device token. Opening the report goes through the core too,
 * for a different reason: the address is built there from the compiled-in base, so this
 * module has no URL to pass and could not choose one.
 */

/** Thrown with the message the core produced, which is already written for the player. */
export class PostGameError extends Error {}

/**
 * Whether the game the app was watching has just ended.
 *
 * The edge, not the state. Only a real reading turning into "no game" counts: a read that
 * failed says the app could not look, which is not the same as a match being over, and
 * treating it as one would report a game every time the League client hiccuped.
 *
 * Nothing here fires on start-up, because the app opens with no previous reading to leave.
 */
export function gameJustEnded(
  previous: LiveRead<unknown> | null,
  next: LiveRead<unknown>
): boolean {
  return previous?.status === "ok" && next.status === "no-game";
}

/** `null` means this machine holds no token the website still accepts. */
export async function reportGameEnded(): Promise<PostGame | null> {
  if (!isTauri()) return null;

  try {
    return await invoke<PostGame | null>("post_game");
  } catch (err) {
    throw new PostGameError(
      typeof err === "string" ? err : "Could not tell LoL AI Coach the game ended."
    );
  }
}
