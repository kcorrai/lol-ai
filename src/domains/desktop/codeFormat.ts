// The shape of a pairing code, kept apart from the minting of one.
//
// Both ends need these: the website formats a code for display, and the desktop
// app validates what the player typed before spending a round trip on it. The
// app cannot import `pairingCode.ts` for them, because that module reaches for
// `node:crypto` — which is right where codes are made and unavailable in a
// webview. This file has no imports at all, which is what makes it shareable
// (ADR-038, K6).
//
// The alphabet drops the six characters people confuse when copying by eye:
// I/1, L/1, O/0, U/V. Nothing here maps a mistyped character onto a valid one —
// a wrong character should fail, not silently become a different code.

export const PAIRING_CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ";
export const PAIRING_CODE_LENGTH = 8;

const CODE_PATTERN = new RegExp(`^[${PAIRING_CODE_ALPHABET}]{${PAIRING_CODE_LENGTH}}$`);

/**
 * What the player typed, as the database stores it.
 *
 * Case and the separators the display format adds are noise; anything else is
 * left alone so that a genuinely wrong character fails the format check instead
 * of being stripped into a shorter code that fails for a confusing reason.
 */
export function normalisePairingCode(input: string): string {
  return input
    .trim()
    .replace(/[\s-]+/g, "")
    .toUpperCase();
}

export function isPairingCodeFormat(code: string | null | undefined): code is string {
  return typeof code === "string" && CODE_PATTERN.test(code);
}

/** `ABCD-EFGH`. Grouping is the difference between reading eight characters and losing your place. */
export function formatPairingCode(code: string): string {
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}
