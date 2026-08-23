import { invoke, isTauri } from "@tauri-apps/api/core";
import type { LiveContext, LiveContextRequest } from "../../../src/domains/desktop/contract";

export type { LiveContext, LiveContextRequest };

/**
 * The live dashboard, from the webview's side of the IPC boundary.
 *
 * The request goes through the Rust core rather than out of this window directly, for the
 * reason the whole of ADR-038 turns on: the reading is personal, so it has to be
 * authenticated, and the device token that authenticates it is not allowed to exist in a
 * browser context. There is no call in this module that could produce one.
 */

/** Thrown with the message the core produced, which is already written for the player. */
export class LiveContextError extends Error {}

/** `null` means this machine holds no token the website still accepts. */
export async function readLiveContext(request: LiveContextRequest): Promise<LiveContext | null> {
  if (!isTauri()) return null;

  try {
    return await invoke<LiveContext | null>("live_context", { request });
  } catch (err) {
    // Tauri rejects with whatever the command serialised, and AppError serialises to its
    // own message — including the website's, for the cases where that is the half that
    // tells the player what to do next.
    throw new LiveContextError(
      typeof err === "string" ? err : "Could not reach LoL AI Coach."
    );
  }
}
