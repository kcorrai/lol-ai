import { randomBytes, timingSafeEqual } from "crypto";

// The code a player reads off the website and retypes into the desktop app.
//
// It is short because a person retypes it, and short means low entropy: eight
// characters from a thirty-symbol alphabet is ~39 bits, which is nowhere near
// the strength of the token it mints. Every bit of the difference is paid for in
// the service rather than here — ten-minute expiry, consumed on first success,
// one live code per account, and a rate limit on both issuing and redeeming.
//
// The alphabet drops the six characters people confuse when copying by eye:
// I/1, L/1, O/0, U/V. Nothing here maps a mistyped character onto a valid one —
// a wrong character should fail, not silently become a different code.

const ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ";
const CODE_LENGTH = 8;
const CODE_PATTERN = new RegExp(`^[${ALPHABET}]{${CODE_LENGTH}}$`);

/** How long an issued code stays redeemable. */
export const CODE_TTL_MS = 10 * 60 * 1000;

export function generatePairingCode(): string {
  let code = "";
  while (code.length < CODE_LENGTH) {
    // Rejection sampling. `byte % 30` would make the first sixteen symbols a
    // little likelier than the rest, and on a code this short that is real bias
    // rather than a theoretical one.
    for (const byte of randomBytes(CODE_LENGTH * 2)) {
      if (byte >= 240) continue; // 240 = 8 * 30, the largest usable multiple
      code += ALPHABET[byte % ALPHABET.length];
      if (code.length === CODE_LENGTH) break;
    }
  }
  return code;
}

/**
 * What the player typed, as the database stores it.
 *
 * Case and the separators the display format adds are noise; anything else is
 * left alone so that a genuinely wrong character fails the format check instead
 * of being stripped into a shorter code that fails for a confusing reason.
 */
export function normalisePairingCode(input: string): string {
  return input.trim().replace(/[\s-]+/g, "").toUpperCase();
}

export function isPairingCodeFormat(code: string | null | undefined): code is string {
  return typeof code === "string" && CODE_PATTERN.test(code);
}

/** `ABCD-EFGH`. Grouping is the difference between reading eight characters and losing your place. */
export function formatPairingCode(code: string): string {
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

/**
 * Constant-time comparison, for paths that compare a presented code against one
 * already in hand rather than looking it up.
 */
export function pairingCodesMatch(candidate: string | null | undefined, actual: string): boolean {
  if (!candidate) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(actual);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export { ALPHABET as PAIRING_CODE_ALPHABET, CODE_LENGTH as PAIRING_CODE_LENGTH };
