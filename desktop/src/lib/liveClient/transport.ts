import { invoke, isTauri } from "@tauri-apps/api/core";
import type { LiveClientTransport } from "./client";

/**
 * Picks the transport this build can actually use.
 *
 * There is exactly one way to read `https://127.0.0.1:2999` and it is not from here. The
 * game serves a certificate signed by Riot's own authority, which no browser trusts, so a
 * webview request fails before it starts. The call is made by the Rust core, which trusts
 * that one authority and nothing else, and handed back over IPC (ADR-038).
 *
 * Run in a plain browser — `npm run dev` without the core — this says so plainly instead
 * of reporting "no game": the player is not out of a match, the app cannot look, and those
 * are not the same answer.
 */
export function createLiveClientTransport(): LiveClientTransport {
  return isTauri() ? tauriTransport : browserTransport;
}

/**
 * `live_client_get` answers `null` when no game is running, which is exactly what the
 * reader treats as "no game". A rejection carries the Rust error's message, already
 * scrubbed of anything sensitive on that side.
 */
const tauriTransport: LiveClientTransport = (path) =>
  invoke<unknown | null>("live_client_get", { path });

const browserTransport: LiveClientTransport = async () => {
  throw new Error("Reading the League client needs the desktop core. This is the browser preview.");
};
