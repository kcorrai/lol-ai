import { createCipheriv, createDecipheriv, randomBytes, timingSafeEqual } from "crypto";

// AES-256-GCM. The previous algorithm was AES-256-CBC with no MAC, which is
// unauthenticated: a stored ciphertext could be altered byte by byte and would still
// decrypt, to something else. That matters here because what this protects is a TOTP
// secret and a Discord webhook URL — the first is the thing a second factor rests on,
// the second is an outbound request the server makes on the user's behalf.
//
// `v2:` marks the new format. Records written before this change are still CBC and are
// still readable (see `decryptString`); they upgrade to GCM the next time they are
// written, which for both callers is the next time the user saves that setting.
const ALGORITHM = "aes-256-gcm";
const LEGACY_ALGORITHM = "aes-256-cbc";
const V2_PREFIX = "v2:";
const IV_BYTES = 12; // 96 bits — the size GCM is specified for
const TAG_BYTES = 16;

/**
 * `AUTH_ENCRYPTION_KEY`, falling back to `DISCORD_ENCRYPTION_KEY`.
 *
 * The old name is what the key was introduced for and is still read, so no deployment
 * has to change anything and no stored ciphertext becomes unreadable. But this key has
 * not been a Discord thing for a while: it also encrypts the TOTP secret behind
 * two-factor authentication. An operator who does not use Discord had every reason to
 * leave it unset, and the failure that produced was 2FA setup answering 500 — a
 * security feature switched off by the absence of an integration it has nothing to
 * do with.
 */
function getKey(): Buffer {
  const keyHex = process.env.AUTH_ENCRYPTION_KEY || process.env.DISCORD_ENCRYPTION_KEY || "";
  if (!keyHex || keyHex.length < 64) {
    throw new Error(
      "AUTH_ENCRYPTION_KEY must be a 32-byte hex string (64 hex chars). " +
        "Generate one with: openssl rand -hex 32"
    );
  }
  return Buffer.from(keyHex.slice(0, 64), "hex");
}

export function encryptString(plaintext: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${V2_PREFIX}${iv.toString("hex")}:${encrypted.toString("hex")}:${tag.toString("hex")}`;
}

export function decryptString(ciphertext: string): string {
  if (ciphertext.startsWith(V2_PREFIX)) {
    const [ivHex, encHex, tagHex] = ciphertext.slice(V2_PREFIX.length).split(":");
    if (!ivHex || !encHex || !tagHex) throw new Error("Invalid ciphertext format");

    const tag = Buffer.from(tagHex, "hex");
    if (tag.length !== TAG_BYTES) throw new Error("Invalid ciphertext format");

    const decipher = createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivHex, "hex"));
    decipher.setAuthTag(tag);
    // `final()` throws when the tag does not match, which is the whole point: a
    // tampered record fails loudly instead of decrypting to something plausible.
    return Buffer.concat([decipher.update(Buffer.from(encHex, "hex")), decipher.final()]).toString(
      "utf8"
    );
  }

  return decryptLegacyCbc(ciphertext);
}

/** Reads a record written before the move to GCM. Write path is GCM only. */
function decryptLegacyCbc(ciphertext: string): string {
  const [ivHex, encHex] = ciphertext.split(":");
  if (!ivHex || !encHex) throw new Error("Invalid ciphertext format");
  const decipher = createDecipheriv(LEGACY_ALGORITHM, getKey(), Buffer.from(ivHex, "hex"));
  return Buffer.concat([decipher.update(Buffer.from(encHex, "hex")), decipher.final()]).toString(
    "utf8"
  );
}

/** True when the record is in the old unauthenticated format and should be rewritten. */
export function needsReencryption(ciphertext: string): boolean {
  return !ciphertext.startsWith(V2_PREFIX);
}

/**
 * Constant-time comparison for secrets that arrive as strings — a cron bearer token,
 * a webhook signature. `===` on a secret leaks its prefix through how long the
 * comparison takes.
 */
export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
