import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { estimateCostUsd, __resetPricing } from "./pricing";

const ORIGINAL = { ...process.env };

beforeEach(() => __resetPricing());
afterEach(() => {
  process.env = { ...ORIGINAL };
  __resetPricing();
  vi.restoreAllMocks();
});

describe("estimateCostUsd", () => {
  /**
   * There is no built-in price table on purpose: prices change, differ per provider and plan, and
   * a stale constant would put confident wrong numbers on the one dashboard whose job is to be
   * trusted. Unpriced means unpriced — never zero, which would read as free.
   */
  it("returns null when no price table is configured", () => {
    delete process.env.AI_MODEL_PRICES;

    expect(estimateCostUsd("gpt-4o", 1000, 1000)).toBeNull();
  });

  it("returns null for a model the table does not price", () => {
    process.env.AI_MODEL_PRICES = JSON.stringify({ "gpt-4o": { in: 2.5, out: 10 } });

    expect(estimateCostUsd("some-other-model", 1000, 1000)).toBeNull();
  });

  it("prices input and output separately", () => {
    process.env.AI_MODEL_PRICES = JSON.stringify({ "gpt-4o": { in: 2, out: 10 } });

    // 1M in at $2 plus 0.5M out at $10 = $2 + $5.
    expect(estimateCostUsd("gpt-4o", 1_000_000, 500_000)).toBeCloseTo(7, 10);
  });

  /**
   * Providers return dated snapshot ids. Listing every snapshot in the env var would guarantee the
   * table goes stale silently, so a prefix covers them.
   */
  it("matches a dated snapshot id by prefix", () => {
    process.env.AI_MODEL_PRICES = JSON.stringify({ "gpt-4o": { in: 2, out: 10 } });

    expect(estimateCostUsd("gpt-4o-2024-08-06", 1_000_000, 0)).toBeCloseTo(2, 10);
  });

  /** The trap the prefix rule has to survive: "gpt-4o" is a prefix of "gpt-4o-mini". */
  it("prefers the longest matching prefix", () => {
    process.env.AI_MODEL_PRICES = JSON.stringify({
      "gpt-4o": { in: 2.5, out: 10 },
      "gpt-4o-mini": { in: 0.15, out: 0.6 },
    });

    expect(estimateCostUsd("gpt-4o-mini", 1_000_000, 0)).toBeCloseTo(0.15, 10);
  });

  it("survives a malformed table rather than failing the call it is pricing", () => {
    process.env.AI_MODEL_PRICES = "{not json";
    vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(estimateCostUsd("gpt-4o", 1000, 1000)).toBeNull();
  });

  it("rejects an entry that is missing a number", () => {
    process.env.AI_MODEL_PRICES = JSON.stringify({ "gpt-4o": { in: 2.5 } });
    vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(estimateCostUsd("gpt-4o", 1000, 1000)).toBeNull();
  });
});
