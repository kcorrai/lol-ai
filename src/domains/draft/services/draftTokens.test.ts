import { describe, expect, it } from "vitest";
import { generateCode, generateToken, tokensMatch } from "./draftTokens";

describe("generateCode", () => {
  it("produces the requested length from the unambiguous alphabet", () => {
    const code = generateCode();
    expect(code).toHaveLength(8);
    expect(code).toMatch(/^[abcdefghjkmnpqrstuvwxyz23456789]{8}$/);
  });

  it("omits the characters people mistype", () => {
    const sample = Array.from({ length: 200 }, () => generateCode(16)).join("");
    for (const char of ["l", "i", "0", "1", "o"]) {
      expect(sample).not.toContain(char);
    }
  });

  it("does not collide across a realistic number of drafts", () => {
    const codes = new Set(Array.from({ length: 5_000 }, () => generateCode()));
    expect(codes.size).toBe(5_000);
  });
});

describe("generateToken", () => {
  it("is 32 hex characters and unique", () => {
    const tokens = Array.from({ length: 1_000 }, () => generateToken());
    for (const token of tokens) expect(token).toMatch(/^[0-9a-f]{32}$/);
    expect(new Set(tokens).size).toBe(1_000);
  });
});

describe("tokensMatch", () => {
  it("accepts only an exact match", () => {
    const token = generateToken();
    expect(tokensMatch(token, token)).toBe(true);
    expect(tokensMatch(token.toUpperCase(), token)).toBe(false);
    expect(tokensMatch(token.slice(0, -1), token)).toBe(false);
    expect(tokensMatch(`${token}x`, token)).toBe(false);
  });

  it("treats a missing candidate as a miss rather than throwing", () => {
    const token = generateToken();
    expect(tokensMatch(null, token)).toBe(false);
    expect(tokensMatch(undefined, token)).toBe(false);
    expect(tokensMatch("", token)).toBe(false);
  });
});
