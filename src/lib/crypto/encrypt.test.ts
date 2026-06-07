import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { encryptString, decryptString } from "./encrypt";

const KEY = "a".repeat(64);
let original: string | undefined;

beforeAll(() => {
  original = process.env.DISCORD_ENCRYPTION_KEY;
  process.env.DISCORD_ENCRYPTION_KEY = KEY;
});

afterAll(() => {
  process.env.DISCORD_ENCRYPTION_KEY = original;
});

describe("encryptString / decryptString", () => {
  it("round-trip produces the original plaintext", () => {
    const plain = "https://discord.com/api/webhooks/12345/secret-token";
    expect(decryptString(encryptString(plain))).toBe(plain);
  });

  it("produces different ciphertext on each call (random IV)", () => {
    const plain = "same-input";
    const a = encryptString(plain);
    const b = encryptString(plain);
    expect(a).not.toBe(b);
    expect(decryptString(a)).toBe(plain);
    expect(decryptString(b)).toBe(plain);
  });

  it("ciphertext includes IV separator ':'", () => {
    expect(encryptString("test")).toContain(":");
  });

  it("throws on malformed ciphertext (missing separator)", () => {
    expect(() => decryptString("noSeparatorHere")).toThrow();
  });
});
