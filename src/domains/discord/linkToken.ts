import { decryptString, encryptString } from "@/lib/crypto/encrypt";

// Long enough to log in on another device, short enough that a token pasted
// into a public channel is worthless by the time anyone reads it.
const TTL_MS = 10 * 60 * 1000;

interface LinkTokenPayload {
  d: string; // Discord user id
  n: string; // Discord display name, shown on the confirmation page
  e: number; // expiry, epoch ms
}

export interface LinkTokenClaims {
  discordUserId: string;
  discordUsername: string;
}

/**
 * A one-way ticket from a Discord slash command to a signed-in web session.
 *
 * There is no OAuth round trip and no pending-link table: the interaction
 * payload already proves who the Discord user is, so the only thing that has to
 * survive the trip to the browser is that claim, unforgeably. AES-256-GCM
 * carries an authentication tag, so the existing encryptString does the job an
 * HMAC would — a tampered token fails to decrypt rather than decrypting to
 * something else.
 */
export function createLinkToken(claims: LinkTokenClaims, now = Date.now()): string {
  const payload: LinkTokenPayload = {
    d: claims.discordUserId,
    n: claims.discordUsername,
    e: now + TTL_MS,
  };
  return Buffer.from(encryptString(JSON.stringify(payload)), "utf8").toString("base64url");
}

/** Returns null for anything tampered with, malformed or expired. */
export function readLinkToken(token: string, now = Date.now()): LinkTokenClaims | null {
  try {
    const json = decryptString(Buffer.from(token, "base64url").toString("utf8"));
    const payload = JSON.parse(json) as Partial<LinkTokenPayload>;

    if (typeof payload.d !== "string" || typeof payload.n !== "string") return null;
    if (typeof payload.e !== "number" || payload.e < now) return null;

    return { discordUserId: payload.d, discordUsername: payload.n };
  } catch {
    return null;
  }
}
