import { randomBytes, timingSafeEqual } from "crypto";

// The overlay key is a capability: whoever holds it may read this creator's
// overlay payload. That is the only authentication OBS and Nightbot can offer,
// since neither can carry a session cookie (ADR-026).
//
// Base64url rather than the hex used by draft tokens, for one practical reason:
// the key goes in a URL a streamer pastes into an OBS Browser Source field and
// into a Nightbot command, both of which are cramped. 16 bytes is 22 characters
// here against 32 as hex, at identical 128-bit strength.

const KEY_BYTES = 16;
const KEY_LENGTH = 22; // ceil(16 * 4 / 3), base64url, unpadded
const KEY_PATTERN = /^[A-Za-z0-9_-]{22}$/;

export function generateOverlayKey(): string {
  return randomBytes(KEY_BYTES).toString("base64url");
}

/**
 * Cheap shape check before the database is touched.
 *
 * A crawler walking `/overlay/<anything>` should cost us a regex, not a query.
 */
export function isOverlayKeyFormat(key: string | null | undefined): key is string {
  return typeof key === "string" && KEY_PATTERN.test(key);
}

/**
 * Constant-time comparison, for the paths that compare a presented key against a
 * stored one rather than looking it up. Comparing with `===` leaks the shared
 * prefix through response timing.
 */
export function overlayKeysMatch(candidate: string | null | undefined, actual: string): boolean {
  if (!candidate) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(actual);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export { KEY_LENGTH };
