import { generateSecret, verifySync } from "otplib";
import { encryptString, decryptString } from "@/lib/crypto/encrypt";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const APP_NAME = "LoL AI Coach";
const BACKUP_CODE_COUNT = 8;
const BACKUP_CODE_ROUNDS = 10;
const TOTP_OPTIONS = { algorithm: "sha1" as const, digits: 6, period: 30 };

/**
 * How far outside the current 30-second step a code is still accepted, in seconds.
 *
 * `verifySync` defaults to zero tolerance, so only the step the server is in counts.
 * That is not a threshold a person can meet: reading six digits off a phone and typing
 * them takes long enough to cross a boundary on its own, and the phone's clock only has
 * to be a second or two out for a correct code to be refused every time. Verified by
 * hand against a running server — a code generated and then used a few seconds later
 * was rejected.
 *
 * One step either side is what RFC 6238 §5.2 suggests and what authenticator apps
 * assume. It widens the guessing window from one code to three, which against a
 * six-digit space and this route's ten-attempts-per-fifteen-minutes limit is not the
 * part of this that an attacker would go at.
 */
const TOTP_TOLERANCE_SECONDS = 30;

export interface TotpSetupResult {
  secret: string;
  otpauthUrl: string;
  backupCodes: string[];
}

export function generateTotpSetup(email: string): TotpSetupResult {
  const secret = generateSecret();
  const issuer = encodeURIComponent(APP_NAME);
  const account = encodeURIComponent(email);
  const otpauthUrl = `otpauth://totp/${issuer}:${account}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
  const backupCodes = Array.from({ length: BACKUP_CODE_COUNT }, () =>
    crypto.randomBytes(4).toString("hex").toUpperCase()
  );

  return { secret, otpauthUrl, backupCodes };
}

export function verifyTotpToken(encryptedSecret: string, token: string): boolean {
  try {
    const secret = decryptString(encryptedSecret);
    const result = verifySync({
      token,
      secret,
      ...TOTP_OPTIONS,
      epochTolerance: TOTP_TOLERANCE_SECONDS,
    });
    return result !== null && result.valid;
  } catch {
    return false;
  }
}

export async function hashBackupCodes(codes: string[]): Promise<string[]> {
  return Promise.all(codes.map((c) => bcrypt.hash(c, BACKUP_CODE_ROUNDS)));
}

export async function verifyAndConsumeBackupCode(
  hashedCodes: string[],
  candidate: string
): Promise<{ valid: boolean; remaining: string[] }> {
  const normalized = candidate.replace(/\s/g, "").toUpperCase();
  let matchIndex = -1;

  for (let i = 0; i < hashedCodes.length; i++) {
    if (await bcrypt.compare(normalized, hashedCodes[i]!)) {
      matchIndex = i;
      break;
    }
  }

  if (matchIndex === -1) return { valid: false, remaining: hashedCodes };

  const remaining = hashedCodes.filter((_, i) => i !== matchIndex);
  return { valid: true, remaining };
}

export function encryptTotpSecret(secret: string): string {
  return encryptString(secret);
}
