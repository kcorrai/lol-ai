// What a viewer is allowed to see of the creator's identity.
//
// Riot's own Streamer Mode hides a Riot ID from viewers on third-party trackers
// but does not hide it from the nine other people in the game. The half we
// control is our own output, and this is where that is decided — once, on the
// server, so a widget cannot leak an ID it was never sent (ADR-026).

export interface IdentityInput {
  streamSafe: boolean;
  /** What the creator chose to be called on stream. */
  displayName: string | null;
  gameName: string;
  tagLine: string;
}

export interface Identity {
  /** What the overlay prints. Null means print nothing. */
  name: string | null;
  /** The full Riot ID, or null when it must not leave the server. */
  riotId: string | null;
  redacted: boolean;
}

/** "kaanproak0#TR1" */
export function formatRiotId(gameName: string, tagLine: string): string {
  return `${gameName}#${tagLine}`;
}

/**
 * Resolve what may be published about who this is.
 *
 * With `streamSafe` on, the Riot ID is dropped from the payload entirely. A
 * `displayName` still passes through — it is a name the creator typed for this
 * purpose, and second-guessing it would mean silently blanking the label of
 * anyone whose handle happens to resemble their summoner name. What we will not
 * do is emit the ID ourselves.
 */
export function resolveIdentity(input: IdentityInput): Identity {
  const chosen = input.displayName?.trim() || null;

  if (input.streamSafe) {
    return { name: chosen, riotId: null, redacted: true };
  }

  return {
    name: chosen ?? formatRiotId(input.gameName, input.tagLine),
    riotId: formatRiotId(input.gameName, input.tagLine),
    redacted: false,
  };
}

/**
 * The name for a chat reply, which cannot render an empty label the way a widget
 * can — a line starting with " — Emerald II" reads as broken.
 */
export function chatSubject(identity: Identity): string {
  return identity.name ?? "The streamer";
}
