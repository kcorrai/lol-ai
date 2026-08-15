import { randomBytes, timingSafeEqual } from "crypto";

// Codes are read aloud and typed by hand in scrim channels, so the alphabet drops
// the characters people confuse: i/l/1 and o/0.
const CODE_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
const CODE_LENGTH = 8;
const TOKEN_BYTES = 16; // 32 hex characters

// Rejection sampling rather than a plain modulo: 256 % 33 is not zero, so `% 33`
// alone would make the first six letters measurably likelier than the rest.
const CODE_LIMIT = Math.floor(256 / CODE_ALPHABET.length) * CODE_ALPHABET.length;

export function generateCode(length: number = CODE_LENGTH): string {
  let out = "";
  while (out.length < length) {
    for (const byte of randomBytes(length * 2)) {
      if (byte >= CODE_LIMIT) continue;
      out += CODE_ALPHABET[byte % CODE_ALPHABET.length];
      if (out.length === length) break;
    }
  }
  return out;
}

export function generateToken(): string {
  return randomBytes(TOKEN_BYTES).toString("hex");
}

/**
 * Constant-time token comparison. A drafter token is a capability — whoever
 * holds it may act for that side — so comparing it with `===` would leak its
 * prefix through response timing.
 */
export function tokensMatch(candidate: string | null | undefined, actual: string): boolean {
  if (!candidate) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(actual);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
