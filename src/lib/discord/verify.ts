import { createPublicKey, verify as cryptoVerify, type KeyObject } from "node:crypto";

// Discord signs every interaction with Ed25519 and gives you the public key as
// 32 raw hex bytes. Node's `createPublicKey` will not take raw bytes — it wants
// SPKI DER — so the key is wrapped in the fixed 12-byte SPKI header for
// id-Ed25519 (RFC 8410 §4). The header never varies, which is why it can be a
// constant rather than a DER encoder: SEQUENCE(SEQUENCE(OID 1.3.101.112),
// BIT STRING(32 bytes)).
const ED25519_SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");
const RAW_KEY_BYTES = 32;

// createPublicKey parses DER on every call. The public key is one fixed value
// per deployment, so it is parsed once and reused — this runs on the hot path of
// every single interaction, including the ones Discord fires while you are
// typing an autocomplete.
const keyCache = new Map<string, KeyObject>();

function publicKeyFromHex(publicKeyHex: string): KeyObject | null {
  const cached = keyCache.get(publicKeyHex);
  if (cached) return cached;

  const raw = Buffer.from(publicKeyHex, "hex");
  // Buffer.from silently truncates invalid hex instead of throwing, so the
  // length check is the real validation.
  if (raw.length !== RAW_KEY_BYTES) return null;

  try {
    const key = createPublicKey({
      key: Buffer.concat([ED25519_SPKI_PREFIX, raw]),
      format: "der",
      type: "spki",
    });
    keyCache.set(publicKeyHex, key);
    return key;
  } catch {
    return null;
  }
}

/**
 * Verifies a Discord interaction request.
 *
 * `rawBody` must be the exact bytes Discord sent — the signature covers
 * `timestamp + body`, so a JSON round-trip (parse then re-stringify) changes the
 * bytes and fails verification even when the payload is identical.
 */
export function verifyDiscordSignature(params: {
  rawBody: string;
  signature: string | null;
  timestamp: string | null;
  publicKeyHex: string | undefined;
}): boolean {
  const { rawBody, signature, timestamp, publicKeyHex } = params;
  if (!signature || !timestamp || !publicKeyHex) return false;

  const key = publicKeyFromHex(publicKeyHex);
  if (!key) return false;

  const sig = Buffer.from(signature, "hex");
  if (sig.length !== 64) return false;

  try {
    // `null` algorithm: Ed25519 hashes internally, so no digest is passed.
    return cryptoVerify(null, Buffer.from(timestamp + rawBody, "utf8"), key, sig);
  } catch {
    return false;
  }
}
