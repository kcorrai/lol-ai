import { describe, it, expect } from "vitest";
import {
  dayNumber,
  fnv1a,
  nextResetAt,
  pickBySeed,
  pickDaily,
  puzzleNumber,
  secondsUntilReset,
  seededShuffle,
  utcDateKey,
} from "./dailySeed";

const POOL = Array.from({ length: 173 }, (_, i) => `champ-${i}`);

function addDays(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

describe("utcDateKey", () => {
  it("uses the UTC day, not the local one", () => {
    // 23:30 UTC on the 17th is already the 18th in UTC+2, but the puzzle must not
    // roll over until 00:00 UTC.
    expect(utcDateKey(new Date("2026-08-17T23:30:00Z"))).toBe("2026-08-17");
    expect(utcDateKey(new Date("2026-08-18T00:00:00Z"))).toBe("2026-08-18");
  });
});

describe("dayNumber", () => {
  it("counts from the 2024-01-01 epoch", () => {
    expect(dayNumber("2024-01-01")).toBe(0);
    expect(dayNumber("2024-01-02")).toBe(1);
    expect(dayNumber("2026-08-17")).toBe(959);
  });

  it("crosses leap days correctly", () => {
    expect(dayNumber("2024-03-01") - dayNumber("2024-02-28")).toBe(2);
  });

  it("goes negative before the epoch without breaking", () => {
    expect(dayNumber("2023-12-31")).toBe(-1);
  });
});

describe("puzzleNumber", () => {
  it("makes the epoch puzzle #1", () => {
    expect(puzzleNumber("2024-01-01")).toBe(1);
  });
});

describe("nextResetAt", () => {
  it("returns the coming UTC midnight", () => {
    expect(nextResetAt(new Date("2026-08-17T13:05:00Z")).toISOString()).toBe(
      "2026-08-18T00:00:00.000Z"
    );
  });

  it("moves to the next day when called exactly at midnight", () => {
    expect(nextResetAt(new Date("2026-08-17T00:00:00Z")).toISOString()).toBe(
      "2026-08-18T00:00:00.000Z"
    );
  });

  it("counts down in whole seconds", () => {
    expect(secondsUntilReset(new Date("2026-08-17T23:59:30Z"))).toBe(30);
  });
});

describe("fnv1a", () => {
  it("is stable — a different hash would silently change every answer", () => {
    expect(fnv1a("classic:0")).toBe(fnv1a("classic:0"));
    expect(fnv1a("classic:0")).not.toBe(fnv1a("classic:1"));
  });
});

describe("seededShuffle", () => {
  it("is deterministic for a seed", () => {
    expect(seededShuffle(POOL, 42)).toEqual(seededShuffle(POOL, 42));
  });

  it("actually reorders, and differently per seed", () => {
    expect(seededShuffle(POOL, 42)).not.toEqual(POOL);
    expect(seededShuffle(POOL, 42)).not.toEqual(seededShuffle(POOL, 43));
  });

  it("keeps every element exactly once", () => {
    expect(seededShuffle(POOL, 7).slice().sort()).toEqual(POOL.slice().sort());
  });

  it("does not mutate the input", () => {
    const original = POOL.slice();
    seededShuffle(POOL, 99);
    expect(POOL).toEqual(original);
  });
});

describe("pickDaily", () => {
  it("gives the same answer for the same day and mode", () => {
    expect(pickDaily(POOL, "classic", "2026-08-17")).toBe(pickDaily(POOL, "classic", "2026-08-17"));
  });

  it("gives different modes different answers on the same day", () => {
    const perMode = ["classic", "ability", "splash", "lore", "quote", "emoji"].map((m) =>
      pickDaily(POOL, m, "2026-08-17")
    );
    // Six independent draws from 173 collide occasionally in principle; asserting
    // "not all identical" is the property that actually matters.
    expect(new Set(perMode).size).toBeGreaterThan(1);
  });

  it("never repeats a champion within a deck", () => {
    // 2024-01-01 is day 0, so a cycle starts here and the window is one full deck.
    const seen = new Set<string>();
    let day = "2024-01-01";
    for (let i = 0; i < POOL.length; i++) {
      seen.add(pickDaily(POOL, "classic", day));
      day = addDays(day, 1);
    }
    expect(seen.size).toBe(POOL.length);
  });

  it("reshuffles rather than replaying the deck in order", () => {
    const firstDeck: string[] = [];
    const secondDeck: string[] = [];
    for (let i = 0; i < POOL.length; i++) {
      firstDeck.push(pickDaily(POOL, "classic", addDays("2024-01-01", i)));
      secondDeck.push(pickDaily(POOL, "classic", addDays("2024-01-01", POOL.length + i)));
    }
    expect(secondDeck).not.toEqual(firstDeck);
    expect(new Set(secondDeck).size).toBe(POOL.length);
  });

  it("never serves the same champion two days running, including across decks", () => {
    // The deck boundary is the one place a naive reshuffle can repeat, so walk
    // several cycles' worth of days and check every adjacent pair.
    for (const mode of ["classic", "ability", "splash", "lore", "quote", "emoji"]) {
      let previous = pickDaily(POOL, mode, "2024-01-01");
      for (let i = 1; i < POOL.length * 4; i++) {
        const current = pickDaily(POOL, mode, addDays("2024-01-01", i));
        expect(current, `${mode} day ${i}`).not.toBe(previous);
        previous = current;
      }
    }
  });

  it("holds up two years out", () => {
    let day = "2026-01-01";
    for (let i = 0; i < 730; i++) {
      expect(POOL).toContain(pickDaily(POOL, "splash", day));
      day = addDays(day, 1);
    }
  });

  it("works for dates before the epoch", () => {
    expect(POOL).toContain(pickDaily(POOL, "classic", "2023-06-15"));
  });

  it("refuses an empty pool rather than returning undefined", () => {
    expect(() => pickDaily([], "classic", "2026-08-17")).toThrow(/empty pool/);
  });
});

describe("pickBySeed", () => {
  it("is stable for a seed", () => {
    expect(pickBySeed(POOL, "classic", "abc")).toBe(pickBySeed(POOL, "classic", "abc"));
  });

  it("gives different seeds different puzzles", () => {
    const drawn = new Set(
      Array.from({ length: 40 }, (_, i) => pickBySeed(POOL, "classic", `seed-${i}`))
    );
    expect(drawn.size).toBeGreaterThan(20);
  });

  it("cannot be used to fish for the day's answer", () => {
    // Practice never consults the date, so no seed can be crafted to reproduce
    // the daily deck's pick — the two draws share no input at all.
    const daily = pickDaily(POOL, "classic", "2026-08-17");
    const seeds = Array.from({ length: 200 }, (_, i) => `2026-08-17-${i}`);
    const matches = seeds.filter((s) => pickBySeed(POOL, "classic", s) === daily).length;
    // Chance hits are expected at roughly 200/173; a leak would be all of them.
    expect(matches).toBeLessThan(10);
  });

  it("refuses an empty pool", () => {
    expect(() => pickBySeed([], "classic", "abc")).toThrow(/empty pool/);
  });
});
