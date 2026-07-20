import { describe, it, expect, beforeAll } from "vitest";
import { generateSync } from "otplib";
import {
  generateTotpSetup,
  verifyTotpToken,
  encryptTotpSecret,
  hashBackupCodes,
  verifyAndConsumeBackupCode,
} from "./totpService";

// encryptString reads this at call time, so it only has to exist before the
// first encrypt. It is a throwaway 32-byte hex key, not a real secret.
beforeAll(() => {
  process.env.DISCORD_ENCRYPTION_KEY = "a".repeat(64);
});

const TOTP_OPTIONS = { algorithm: "sha1" as const, digits: 6, period: 30 };

describe("generateTotpSetup", () => {
  it("produces a secret, an otpauth URI and 8 backup codes", () => {
    const setup = generateTotpSetup("player@example.com");

    expect(setup.secret).toBeTruthy();
    expect(setup.backupCodes).toHaveLength(8);
    expect(setup.otpauthUrl).toContain(`secret=${setup.secret}`);
  });

  // The URI is scanned by an authenticator app; a raw "@" or space breaks the
  // parse in some clients, so both the issuer and the account must be encoded.
  it("url-encodes the account label", () => {
    const setup = generateTotpSetup("player+tag@example.com");

    expect(setup.otpauthUrl).toContain("player%2Btag%40example.com");
    expect(setup.otpauthUrl).toContain("LoL%20AI%20Coach");
  });

  it("issues distinct secrets and backup codes on each call", () => {
    const a = generateTotpSetup("a@example.com");
    const b = generateTotpSetup("b@example.com");

    expect(a.secret).not.toBe(b.secret);
    expect(a.backupCodes).not.toEqual(b.backupCodes);
  });

  it("issues 8 unique backup codes within a single setup", () => {
    const { backupCodes } = generateTotpSetup("a@example.com");

    expect(new Set(backupCodes).size).toBe(8);
  });
});

describe("verifyTotpToken", () => {
  it("accepts the current token for the enrolled secret", () => {
    const { secret } = generateTotpSetup("player@example.com");
    const encrypted = encryptTotpSecret(secret);
    const token = generateSync({ secret, ...TOTP_OPTIONS });

    expect(verifyTotpToken(encrypted, token)).toBe(true);
  });

  it("rejects a token generated from a different secret", () => {
    const { secret } = generateTotpSetup("player@example.com");
    const other = generateTotpSetup("other@example.com");
    const encrypted = encryptTotpSecret(secret);
    const wrongToken = generateSync({ secret: other.secret, ...TOTP_OPTIONS });

    expect(verifyTotpToken(encrypted, wrongToken)).toBe(false);
  });

  // Everything here must return false rather than throw: verifyTotpToken sits on
  // the login path, and an exception would surface as a 500 instead of a failed
  // second factor — which is both a worse UX and an oracle.
  it.each([
    ["an empty token", ""],
    ["a non-numeric token", "abcdef"],
    ["a wrong-length token", "1234"],
    ["a plain 6-digit guess", "000000"],
  ])("rejects %s without throwing", (_label, token) => {
    const { secret } = generateTotpSetup("player@example.com");
    const encrypted = encryptTotpSecret(secret);

    expect(() => verifyTotpToken(encrypted, token)).not.toThrow();
    expect(verifyTotpToken(encrypted, token)).toBe(false);
  });

  it.each([
    ["malformed ciphertext", "not-a-valid-ciphertext"],
    ["ciphertext with no IV separator", "deadbeef"],
    ["empty ciphertext", ""],
  ])("returns false for %s rather than throwing", (_label, encrypted) => {
    expect(() => verifyTotpToken(encrypted, "123456")).not.toThrow();
    expect(verifyTotpToken(encrypted, "123456")).toBe(false);
  });
});

describe("verifyAndConsumeBackupCode", () => {
  it("accepts a valid code and returns the remaining seven", async () => {
    const codes = ["AAAA1111", "BBBB2222", "CCCC3333"];
    const hashed = await hashBackupCodes(codes);

    const result = await verifyAndConsumeBackupCode(hashed, "BBBB2222");

    expect(result.valid).toBe(true);
    expect(result.remaining).toHaveLength(2);
  });

  // Consuming exactly one is the security property: if the matched code stayed
  // in the list it would be replayable forever.
  it("removes only the matched code", async () => {
    const codes = ["AAAA1111", "BBBB2222", "CCCC3333"];
    const hashed = await hashBackupCodes(codes);

    const first = await verifyAndConsumeBackupCode(hashed, "BBBB2222");
    const replay = await verifyAndConsumeBackupCode(first.remaining, "BBBB2222");

    expect(replay.valid).toBe(false);
    const stillWorks = await verifyAndConsumeBackupCode(first.remaining, "AAAA1111");
    expect(stillWorks.valid).toBe(true);
  });

  // Codes are shown uppercase and often retyped with the spacing users see.
  it.each([
    ["lowercase", "bbbb2222"],
    ["internal spaces", "BBBB 2222"],
    ["surrounding whitespace", "  BBBB2222  "],
    ["mixed case and spaces", " bBbB 2222 "],
  ])("normalizes %s", async (_label, candidate) => {
    const hashed = await hashBackupCodes(["AAAA1111", "BBBB2222"]);

    const result = await verifyAndConsumeBackupCode(hashed, candidate);

    expect(result.valid).toBe(true);
  });

  it("leaves the list intact when nothing matches", async () => {
    const hashed = await hashBackupCodes(["AAAA1111", "BBBB2222"]);

    const result = await verifyAndConsumeBackupCode(hashed, "ZZZZ9999");

    expect(result.valid).toBe(false);
    expect(result.remaining).toEqual(hashed);
  });

  it("handles an exhausted code list", async () => {
    const result = await verifyAndConsumeBackupCode([], "AAAA1111");

    expect(result.valid).toBe(false);
    expect(result.remaining).toEqual([]);
  });

  it("stores codes hashed, never in plaintext", async () => {
    const hashed = await hashBackupCodes(["AAAA1111"]);

    expect(hashed[0]).not.toContain("AAAA1111");
    expect(hashed[0]).toMatch(/^\$2[aby]\$/);
  });
});
