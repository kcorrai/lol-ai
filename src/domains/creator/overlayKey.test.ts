import { describe, it, expect } from "vitest";
import {
  generateOverlayKey,
  isOverlayKeyFormat,
  KEY_LENGTH,
  overlayKeysMatch,
} from "@/domains/creator/overlayKey";

describe("generateOverlayKey", () => {
  it("produces a key of the documented length", () => {
    expect(generateOverlayKey()).toHaveLength(KEY_LENGTH);
  });

  // It goes in a URL path, so anything outside the base64url alphabet would need
  // escaping and would not survive a copy-paste into OBS.
  it("uses only URL-safe characters", () => {
    for (let i = 0; i < 50; i += 1) {
      expect(generateOverlayKey()).toMatch(/^[A-Za-z0-9_-]+$/);
    }
  });

  it("does not repeat", () => {
    const keys = new Set(Array.from({ length: 200 }, () => generateOverlayKey()));
    expect(keys.size).toBe(200);
  });
});

describe("isOverlayKeyFormat", () => {
  it("accepts a generated key", () => {
    expect(isOverlayKeyFormat(generateOverlayKey())).toBe(true);
  });

  it("rejects the wrong length", () => {
    expect(isOverlayKeyFormat("tooshort")).toBe(false);
    expect(isOverlayKeyFormat(`${generateOverlayKey()}x`)).toBe(false);
  });

  it("rejects characters outside the alphabet", () => {
    expect(isOverlayKeyFormat("aaaaaaaaaaaaaaaaaaaaa/")).toBe(false);
    expect(isOverlayKeyFormat("aaaaaaaaaaaaaaaaaaaa..")).toBe(false);
  });

  it("rejects nothing at all", () => {
    expect(isOverlayKeyFormat(null)).toBe(false);
    expect(isOverlayKeyFormat(undefined)).toBe(false);
    expect(isOverlayKeyFormat("")).toBe(false);
  });
});

describe("overlayKeysMatch", () => {
  it("matches a key against itself", () => {
    const key = generateOverlayKey();
    expect(overlayKeysMatch(key, key)).toBe(true);
  });

  it("rejects a different key of the same length", () => {
    expect(overlayKeysMatch(generateOverlayKey(), generateOverlayKey())).toBe(false);
  });

  // timingSafeEqual throws on a length mismatch, so the guard has to come first.
  it("rejects a key of a different length without throwing", () => {
    const key = generateOverlayKey();
    expect(overlayKeysMatch("short", key)).toBe(false);
    expect(overlayKeysMatch(`${key}${key}`, key)).toBe(false);
  });

  it("rejects a missing candidate", () => {
    expect(overlayKeysMatch(null, generateOverlayKey())).toBe(false);
    expect(overlayKeysMatch(undefined, generateOverlayKey())).toBe(false);
    expect(overlayKeysMatch("", generateOverlayKey())).toBe(false);
  });
});
