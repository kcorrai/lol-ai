import { generateSecret, generateSync, verifySync } from "otplib";
import { encryptString, decryptString } from "@/lib/crypto/encrypt";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const APP_NAME = "LoL AI Coach";
const BACKUP_CODE_COUNT = 8;
const BACKUP_CODE_ROUNDS = 10;
const TOTP_OPTIONS = { algorithm: "sha1" as const, digits: 6, period: 30 };

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
    const result = verifySync({ token, secret, ...TOTP_OPTIONS });
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
