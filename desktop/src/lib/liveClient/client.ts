import { allGameDataSchema, type AllGameData } from "./schema";

/**
 * Reader for Riot's Live Client Data API.
 *
 * The transport is injected rather than fetched here, and that is the whole point. A
 * browser cannot talk to `https://127.0.0.1:2999` at all: the game serves a self-signed
 * certificate, and no amount of front-end code gets past that. The request belongs in the
 * Rust core, which validates it against Riot's published root certificate (ADR-038).
 *
 * So this module owns the *shape* of the data and nothing about how it arrives. Phase 2
 * supplies a Tauri `invoke` transport; the tests supply Riot's own sample payload.
 */

/** Resolves to the parsed JSON body, or `null` when no game is running. */
export type LiveClientTransport = (path: string) => Promise<unknown | null>;

export type LiveRead<T> =
  | { status: "ok"; data: T }
  | { status: "no-game" }
  | { status: "unreadable"; reason: string };

export const ALL_GAME_DATA_PATH = "/liveclientdata/allgamedata";

/**
 * Riot documents a ~500ms refresh and discourages more than 10 requests a second. We poll
 * far below both. The companion runs on the same machine as the game it is reporting on,
 * so the budget that matters is the player's frame rate, not Riot's server.
 */
export const POLL_INTERVAL_MS = 1000;

/**
 * Backs off hard once there is no game. Between matches the client is idle for minutes at
 * a time, and a connection refused every second for that whole stretch is pure waste.
 */
export const IDLE_POLL_INTERVAL_MS = 5000;

export async function readAllGameData(
  transport: LiveClientTransport
): Promise<LiveRead<AllGameData>> {
  let body: unknown | null;
  try {
    body = await transport(ALL_GAME_DATA_PATH);
  } catch (err) {
    // A refused connection is the ordinary "League is closed" answer, not a fault. The
    // transport is expected to translate it to null; if one does not, treat it as no-game
    // rather than surfacing a scary error to a player who simply is not in a match.
    return { status: "unreadable", reason: errorMessage(err) };
  }

  if (body === null || body === undefined) return { status: "no-game" };

  const parsed = allGameDataSchema.safeParse(body);
  if (!parsed.success) {
    return { status: "unreadable", reason: firstIssue(parsed.error) };
  }
  return { status: "ok", data: parsed.data };
}

/** How long to wait before the next read, given how the last one went. */
export function nextDelayMs(read: LiveRead<unknown>): number {
  return read.status === "ok" ? POLL_INTERVAL_MS : IDLE_POLL_INTERVAL_MS;
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

function firstIssue(error: { issues: ReadonlyArray<{ path: PropertyKey[]; message: string }> }): string {
  const issue = error.issues[0];
  if (!issue) return "payload did not match the expected shape";
  const where = issue.path.length > 0 ? issue.path.join(".") : "(root)";
  return `${where}: ${issue.message}`;
}
