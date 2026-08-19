import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createCipheriv, randomBytes } from "crypto";
import { encryptString, decryptString, needsReencryption, safeEqual } from "./encrypt";

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

  it("refuses a ciphertext whose bytes were altered", () => {
    const sealed = encryptString("https://discord.com/api/webhooks/1/real");
    const [prefixed, enc, tag] = sealed.split(":");
    // Flip one hex digit of the body. Under the old CBC scheme this decrypted to
    // something else without complaint; under GCM the tag no longer matches.
    const flipped = (enc[0] === "0" ? "1" : "0") + enc.slice(1);
    expect(() => decryptString(`${prefixed}:${flipped}:${tag}`)).toThrow();
  });

  it("still reads a record written in the old CBC format", () => {
    const plain = "https://discord.com/api/webhooks/legacy/token";
    const iv = randomBytes(16);
    const cipher = createCipheriv("aes-256-cbc", Buffer.from(KEY, "hex"), iv);
    const body = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
    const legacy = `${iv.toString("hex")}:${body.toString("hex")}`;

    expect(decryptString(legacy)).toBe(plain);
    expect(needsReencryption(legacy)).toBe(true);
    expect(needsReencryption(encryptString(plain))).toBe(false);
  });
});

describe("safeEqual", () => {
  it("matches identical strings and rejects anything else", () => {
    expect(safeEqual("Bearer abc", "Bearer abc")).toBe(true);
    expect(safeEqual("Bearer abc", "Bearer abd")).toBe(false);
    expect(safeEqual("Bearer abc", "Bearer abcd")).toBe(false);
    expect(safeEqual("", "")).toBe(true);
  });
});
