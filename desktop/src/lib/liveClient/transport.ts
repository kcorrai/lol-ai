import type { LiveClientTransport } from "./client";

/**
 * Picks the transport this build can actually use.
 *
 * There is exactly one way to read `https://127.0.0.1:2999` and it is not from here. The
 * game serves a self-signed certificate, so a webview request fails before it starts; the
 * call has to be made by the Rust core and handed back over IPC (ADR-038).
 *
 * Until that core exists, this returns a transport that says so plainly instead of
 * reporting "no game" — the player is not out of a match, the app simply cannot look yet,
 * and those two are not the same answer.
 */
export function createLiveClientTransport(): LiveClientTransport {
  if (isTauri()) return tauriTransport;
  return shellOnlyTransport;
}

function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

const shellOnlyTransport: LiveClientTransport = async () => {
  throw new Error(
    "Reading the League client needs the desktop core, which this build does not have yet."
  );
};

/**
 * Placeholder for the Tauri command added in phase 2. It is unreachable in this build —
 * `isTauri()` is false without the core — and is here so the seam is visible rather than
 * discovered later.
 */
const tauriTransport: LiveClientTransport = async () => {
  throw new Error("The desktop core is present but its live-client command is not wired yet.");
};
