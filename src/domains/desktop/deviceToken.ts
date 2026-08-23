import { randomBytes, timingSafeEqual } from "crypto";

// The device token is a capability: whoever holds it acts as the paired account
// on the desktop endpoints. It is the same mechanism as CreatorProfile.overlayKey
// (ADR-026) and DraftSeries.blueToken, for the same reason — the client cannot
// carry a session cookie.
//
// It is twice the length of an overlay key, and that difference is deliberate.
// An overlay key goes into a URL a streamer pastes into a cramped OBS field, so
// it trades length for typability. This one is never typed and never seen: it is
// written to the OS credential store by the Rust core and read back into an
// Authorization header. There is nothing to buy by making it shorter.

const TOKEN_BYTES = 32;
const TOKEN_LENGTH = 43; // ceil(32 * 4 / 3), base64url, unpadded
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function generateDeviceToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

/**
 * Cheap shape check before the database is touched, so a probe walking the
 * desktop endpoints with junk bearer tokens costs a regex rather than a query.
 */
export function isDeviceTokenFormat(token: string | null | undefined): token is string {
  return typeof token === "string" && TOKEN_PATTERN.test(token);
}

/** Reads the token out of an Authorization header. Null for anything malformed. */
export function readBearerToken(header: string | null | undefined): string | null {
  if (!header) return null;
  const match = /^Bearer (.+)$/.exec(header.trim());
  if (!match) return null;
  const token = match[1].trim();
  return isDeviceTokenFormat(token) ? token : null;
}

/** Constant-time comparison, for the paths that compare rather than look up. */
export function deviceTokensMatch(candidate: string | null | undefined, actual: string): boolean {
  if (!candidate) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(actual);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export { TOKEN_LENGTH as DEVICE_TOKEN_LENGTH };
