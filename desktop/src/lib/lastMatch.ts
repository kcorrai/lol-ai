import type { ArchiveRow } from "../../../src/domains/match/services/matchArchiveService";

export type { ArchiveRow };

/**
 * The game that just ended, once the website has it.
 *
 * The app already tells the website a match is over the moment it is — that is the one
 * thing this window knows and no server does. What it could not do was say when the pull
 * had landed: the sync is asynchronous and nothing tells this window it finished, so the
 * panel said "on its way" and offered a link to a browser.
 *
 * This is the other half. The archive is read until the match appears, and then the panel
 * draws it. Every competitor puts a post-game breakdown on screen the moment the match ends;
 * the difference here is that the app waits to be sure rather than claiming a game is ready
 * and handing over a list that does not have it yet.
 *
 * The request goes out through the same bridge every lifted screen uses (ADR-043): a
 * relative `/api/*` call is answered by the Rust core, which attaches the device token. So
 * this module opens no socket and never sees a token, exactly like the website's own hooks.
 */

/** How the newest match is asked for. `limit=1` because only the top row can be the new one. */
export function archiveUrl(riotAccountId: string): string {
  return `/api/match/archive?riotAccountId=${encodeURIComponent(riotAccountId)}&limit=1`;
}

/**
 * The newest match in the archive, or null when there is not one yet.
 *
 * Throws only on a failure worth reporting. A 401 or a 404 comes back as null: this runs on
 * a timer behind a panel that already says what it is waiting for, and turning a transient
 * answer into an error message over a finished game buys the player nothing.
 */
export async function readLatestMatch(riotAccountId: string): Promise<ArchiveRow | null> {
  const response = await fetch(archiveUrl(riotAccountId));
  if (!response.ok) return null;

  const body: unknown = await response.json();
  return firstRow(body);
}

/**
 * The first row out of the website's `{ data }` envelope.
 *
 * Checked rather than cast. This is the one place the app reads a shape it does not mirror
 * in Rust, so the shape not being what was expected has to be an empty panel and not a
 * thrown error inside a `setInterval`.
 */
export function firstRow(body: unknown): ArchiveRow | null {
  if (typeof body !== "object" || body === null) return null;

  const data = (body as { data?: unknown }).data;
  if (typeof data !== "object" || data === null) return null;

  const rows = (data as { rows?: unknown }).rows;
  if (!Array.isArray(rows) || rows.length === 0) return null;

  const row: unknown = rows[0];
  if (typeof row !== "object" || row === null) return null;
  if (typeof (row as { riotMatchId?: unknown }).riotMatchId !== "string") return null;

  return row as ArchiveRow;
}

/**
 * Whether this row is the game that just ended rather than the one before it.
 *
 * Compared against what was on top when the game finished, which is read once at that
 * moment. An account with no matches at all has no top row, and then any row is the new one.
 */
export function isNewMatch(before: string | null, row: ArchiveRow | null): boolean {
  if (!row) return false;
  return row.riotMatchId !== before;
}

/** The player's own line from a finished game, in the words a scoreboard uses. */
export function scoreline(row: ArchiveRow): string {
  return `${row.kills}/${row.deaths}/${row.assists}`;
}

/** `gameDurationSeconds` is what the record stores; a match is talked about in minutes. */
export function matchLength(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}
