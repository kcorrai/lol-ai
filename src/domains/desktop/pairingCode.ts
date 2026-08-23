import { randomBytes, timingSafeEqual } from "crypto";
import { PAIRING_CODE_ALPHABET, PAIRING_CODE_LENGTH } from "@/domains/desktop/codeFormat";

// Minting the code a player reads off the website and retypes into the desktop
// app. Its *shape* lives in `codeFormat.ts`, which has no imports and is shared
// with the app itself; this half needs `node:crypto` and stays on the server.
//
// The code is short because a person retypes it, and short means low entropy:
// eight characters from a thirty-symbol alphabet is ~39 bits, which is nowhere
// near the strength of the token it mints. Every bit of the difference is paid
// for in the service rather than here — ten-minute expiry, consumed on first
// success, one live code per account, and a rate limit on both issuing and
// redeeming.

/** How long an issued code stays redeemable. */
export const CODE_TTL_MS = 10 * 60 * 1000;

export function generatePairingCode(): string {
  let code = "";
  while (code.length < PAIRING_CODE_LENGTH) {
    // Rejection sampling. `byte % 30` would make the first sixteen symbols a
    // little likelier than the rest, and on a code this short that is real bias
    // rather than a theoretical one.
    for (const byte of randomBytes(PAIRING_CODE_LENGTH * 2)) {
      if (byte >= 240) continue; // 240 = 8 * 30, the largest usable multiple
      code += PAIRING_CODE_ALPHABET[byte % PAIRING_CODE_ALPHABET.length];
      if (code.length === PAIRING_CODE_LENGTH) break;
    }
  }
  return code;
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

export {
  formatPairingCode,
  isPairingCodeFormat,
  normalisePairingCode,
  PAIRING_CODE_ALPHABET,
  PAIRING_CODE_LENGTH,
} from "@/domains/desktop/codeFormat";
