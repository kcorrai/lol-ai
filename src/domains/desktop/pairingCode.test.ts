import { describe, it, expect } from "vitest";
import {
  formatPairingCode,
  generatePairingCode,
  isPairingCodeFormat,
  normalisePairingCode,
  pairingCodesMatch,
  PAIRING_CODE_ALPHABET,
  PAIRING_CODE_LENGTH,
} from "@/domains/desktop/pairingCode";

describe("generatePairingCode", () => {
  it("produces a code of the documented length", () => {
    expect(generatePairingCode()).toHaveLength(PAIRING_CODE_LENGTH);
  });

  it("uses only the confusion-free alphabet", () => {
    for (let i = 0; i < 200; i += 1) {
      for (const ch of generatePairingCode()) {
        expect(PAIRING_CODE_ALPHABET).toContain(ch);
      }
    }
  });

  // The whole point of the alphabet. A code containing these is a support ticket.
  it("never emits a character people confuse by eye", () => {
    const codes = Array.from({ length: 300 }, () => generatePairingCode()).join("");
    for (const ch of ["I", "L", "O", "U", "0", "1"]) {
      expect(codes).not.toContain(ch);
    }
  });

  it("does not repeat", () => {
    const codes = new Set(Array.from({ length: 500 }, () => generatePairingCode()));
    expect(codes.size).toBe(500);
  });

  // Rejection sampling exists so the first sixteen symbols are not likelier than
  // the rest: 256 is not a multiple of 30, so `byte % 30` would draw them 9 times
  // in 256 against 8 for the rest. That is a 1.125:1 skew — small enough that
  // eyeballing a histogram will not find it, so this is a chi-squared test sized
  // to separate the two. 120k draws over 30 symbols expects 4000 each; a correct
  // generator lands near 29 (the degrees of freedom), the biased one near 410.
  it("draws each symbol uniformly, not with a modulo skew", () => {
    const codes = 15_000;
    const counts = new Map<string, number>();
    for (let i = 0; i < codes; i += 1) {
      for (const ch of generatePairingCode()) {
        counts.set(ch, (counts.get(ch) ?? 0) + 1);
      }
    }
    expect(counts.size).toBe(PAIRING_CODE_ALPHABET.length);

    const expected = (codes * PAIRING_CODE_LENGTH) / PAIRING_CODE_ALPHABET.length;
    let chiSquared = 0;
    for (const count of counts.values()) {
      chiSquared += (count - expected) ** 2 / expected;
    }
    expect(chiSquared).toBeLessThan(120);
  });
});

describe("normalisePairingCode", () => {
  it("accepts the code as it is displayed", () => {
    expect(normalisePairingCode("ABCD-EFGH")).toBe("ABCDEFGH");
  });

  it("forgives case, spaces and stray separators", () => {
    expect(normalisePairingCode("  abcd - efgh ")).toBe("ABCDEFGH");
  });

  // A wrong character has to survive normalisation, so the format check can
  // reject it. Stripping it would produce a seven-character code and an error
  // message about length, which sends the player looking in the wrong place.
  it("leaves an invalid character in place", () => {
    expect(normalisePairingCode("ABC0-EFGH")).toBe("ABC0EFGH");
    expect(isPairingCodeFormat(normalisePairingCode("ABC0-EFGH"))).toBe(false);
  });
});

describe("isPairingCodeFormat", () => {
  it("accepts what the generator produces", () => {
    for (let i = 0; i < 50; i += 1) {
      expect(isPairingCodeFormat(generatePairingCode())).toBe(true);
    }
  });

  it.each([
    ["null", null],
    ["undefined", undefined],
    ["empty", ""],
    ["too short", "ABCDEFG"],
    ["too long", "ABCDEFGHJ"],
    ["lower case", "abcdefgh"],
    ["an excluded character", "ABCDEFG0"],
    ["the display format", "ABCD-EFGH"],
  ])("rejects %s", (_label, value) => {
    expect(isPairingCodeFormat(value)).toBe(false);
  });
});

describe("formatPairingCode", () => {
  it("groups the code in fours", () => {
    expect(formatPairingCode("ABCDEFGH")).toBe("ABCD-EFGH");
  });
});

describe("pairingCodesMatch", () => {
  it("matches a code against itself", () => {
    const code = generatePairingCode();
    expect(pairingCodesMatch(code, code)).toBe(true);
  });

  it("rejects a different code, a missing one and a different length", () => {
    expect(pairingCodesMatch("ABCDEFGH", "ABCDEFGJ")).toBe(false);
    expect(pairingCodesMatch(null, "ABCDEFGH")).toBe(false);
    expect(pairingCodesMatch("", "ABCDEFGH")).toBe(false);
    expect(pairingCodesMatch("ABCDEFG", "ABCDEFGH")).toBe(false);
  });
});
