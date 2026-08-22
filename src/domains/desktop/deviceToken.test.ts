import { describe, it, expect } from "vitest";
import {
  DEVICE_TOKEN_LENGTH,
  deviceTokensMatch,
  generateDeviceToken,
  isDeviceTokenFormat,
  readBearerToken,
} from "@/domains/desktop/deviceToken";

describe("generateDeviceToken", () => {
  it("produces a token of the documented length", () => {
    expect(generateDeviceToken()).toHaveLength(DEVICE_TOKEN_LENGTH);
  });

  // It travels in an Authorization header and is stored by three different OS
  // credential stores. Anything outside base64url is a portability question
  // nobody should have to answer.
  it("uses only URL-safe characters", () => {
    for (let i = 0; i < 50; i += 1) {
      expect(generateDeviceToken()).toMatch(/^[A-Za-z0-9_-]+$/);
    }
  });

  it("does not repeat", () => {
    const tokens = new Set(Array.from({ length: 200 }, () => generateDeviceToken()));
    expect(tokens.size).toBe(200);
  });
});

describe("isDeviceTokenFormat", () => {
  it("accepts what the generator produces", () => {
    for (let i = 0; i < 50; i += 1) {
      expect(isDeviceTokenFormat(generateDeviceToken())).toBe(true);
    }
  });

  it.each([
    ["null", null],
    ["undefined", undefined],
    ["empty", ""],
    ["a pairing code", "ABCDEFGH"],
    ["an overlay key", "a".repeat(22)],
    ["one character short", "a".repeat(42)],
    ["one character long", "a".repeat(44)],
    ["base64 padding", `${"a".repeat(41)}==`],
    ["a plus and a slash", `${"a".repeat(41)}+/`],
  ])("rejects %s", (_label, value) => {
    expect(isDeviceTokenFormat(value)).toBe(false);
  });
});

describe("readBearerToken", () => {
  it("reads a well-formed header", () => {
    const token = generateDeviceToken();
    expect(readBearerToken(`Bearer ${token}`)).toBe(token);
  });

  it("tolerates surrounding whitespace", () => {
    const token = generateDeviceToken();
    expect(readBearerToken(`  Bearer ${token}  `)).toBe(token);
  });

  it.each([
    ["a missing header", null],
    ["an empty header", ""],
    ["no scheme", generateDeviceToken()],
    ["the wrong scheme", `Basic ${generateDeviceToken()}`],
    ["the wrong case", `bearer ${generateDeviceToken()}`],
    ["a malformed token", "Bearer not-a-token"],
  ])("returns null for %s", (_label, header) => {
    expect(readBearerToken(header)).toBeNull();
  });
});

describe("deviceTokensMatch", () => {
  it("matches a token against itself", () => {
    const token = generateDeviceToken();
    expect(deviceTokensMatch(token, token)).toBe(true);
  });

  it("rejects a different token, a missing one and a different length", () => {
    expect(deviceTokensMatch(generateDeviceToken(), generateDeviceToken())).toBe(false);
    expect(deviceTokensMatch(null, generateDeviceToken())).toBe(false);
    expect(deviceTokensMatch("", generateDeviceToken())).toBe(false);
    expect(deviceTokensMatch("short", generateDeviceToken())).toBe(false);
  });
});
