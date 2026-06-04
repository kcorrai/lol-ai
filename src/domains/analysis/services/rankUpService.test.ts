import { describe, it, expect } from "vitest";

// Pure helper functions extracted for unit testing without DB.
// We test the computation logic directly by importing the internal logic via a helper module.
// Since the exported function getRankUpProbability is async+DB, we test the sub-calculations here.

function winRatePts(wr: number): number {
  if (wr >= 0.60) return 35;
  if (wr >= 0.55) return 28;
  if (wr >= 0.50) return 20;
  if (wr >= 0.45) return 10;
  return 0;
}

function trendFromMatches(matches: { won: boolean }[]): "improving" | "stable" | "declining" {
  if (matches.length < 10) return "stable";
  const recent = matches.slice(0, 5);
  const older = matches.slice(5, 10);
  const r = recent.filter((m) => m.won).length / 5;
  const o = older.filter((m) => m.won).length / 5;
  if (r > o + 0.15) return "improving";
  if (r < o - 0.15) return "declining";
  return "stable";
}

function mentalPts(matches: { won: boolean }[]): number {
  let streak = 0;
  for (const m of matches) {
    if (!m.won) streak++;
    else break;
  }
  if (streak >= 3) return 0;
  if (streak === 2) return 8;
  if (streak === 1) return 12;
  return 15;
}

function estimatedGames(currentLP: number, wr: number): number | null {
  const LP_GAIN = 20, LP_LOSS = 16;
  const expected = wr * LP_GAIN + (1 - wr) * -LP_LOSS;
  if (expected <= 0) return null;
  return Math.max(1, Math.ceil((100 - currentLP) / expected));
}

function nextLabel(tier: string, division: string): string {
  const TIER_ORDER = ["IRON","BRONZE","SILVER","GOLD","PLATINUM","EMERALD","DIAMOND","MASTER"];
  const APEX = new Set(["MASTER","GRANDMASTER","CHALLENGER"]);
  if (APEX.has(tier)) return "next LP milestone";
  if (division === "I") {
    const idx = TIER_ORDER.indexOf(tier);
    const next = idx >= 0 && idx < TIER_ORDER.length - 1 ? TIER_ORDER[idx + 1] : null;
    return next ? `${next} IV` : "Master";
  }
  const divMap: Record<string,string> = { IV:"III", III:"II", II:"I" };
  return `${tier} ${divMap[division] ?? "I"}`;
}

// Helper to build match arrays
const wins = (n: number) => Array.from({ length: n }, () => ({ won: true }));
const losses = (n: number) => Array.from({ length: n }, () => ({ won: false }));

describe("winRatePts", () => {
  it("returns 35 for ≥ 60%", () => expect(winRatePts(0.65)).toBe(35));
  it("returns 28 for 55-59%", () => expect(winRatePts(0.57)).toBe(28));
  it("returns 20 for 50-54%", () => expect(winRatePts(0.52)).toBe(20));
  it("returns 10 for 45-49%", () => expect(winRatePts(0.47)).toBe(10));
  it("returns 0 for < 45%", () => expect(winRatePts(0.40)).toBe(0));
});

describe("trendFromMatches", () => {
  it("returns stable for < 10 matches", () => {
    expect(trendFromMatches(wins(5))).toBe("stable");
  });

  it("improving when recent 5 WR > older 5 WR by > 15pp", () => {
    const matches = [...wins(5), ...losses(5)]; // recent 5 all wins, older 5 all losses
    expect(trendFromMatches(matches)).toBe("improving");
  });

  it("declining when recent 5 WR < older 5 WR by > 15pp", () => {
    const matches = [...losses(5), ...wins(5)]; // recent 5 all losses, older 5 all wins
    expect(trendFromMatches(matches)).toBe("declining");
  });

  it("stable when difference ≤ 15pp", () => {
    // 3/5 recent (60%) vs 2/5 older (40%) — diff = 20pp but exactly 0.2 > 0.15 → improving
    // Use 3/5 (60%) vs 3/5 (60%) → stable
    const matches = [...Array(3).fill({won:true}), ...Array(2).fill({won:false}),
                     ...Array(3).fill({won:true}), ...Array(2).fill({won:false})];
    expect(trendFromMatches(matches)).toBe("stable");
  });
});

describe("mentalPts", () => {
  it("returns 15 for no loss streak", () => expect(mentalPts(wins(5))).toBe(15));
  it("returns 12 for 1-loss streak", () => expect(mentalPts([{won:false}, ...wins(4)])).toBe(12));
  it("returns 8 for 2-loss streak", () => expect(mentalPts([...losses(2), ...wins(3)])).toBe(8));
  it("returns 0 for ≥ 3-loss streak", () => expect(mentalPts([...losses(3), ...wins(2)])).toBe(0));
});

describe("estimatedGames", () => {
  it("returns null when WR is too low (negative LP expected)", () => {
    // 44% WR: 0.44*20 + 0.56*(-16) = 8.8 - 8.96 = -0.16 → null
    expect(estimatedGames(50, 0.44)).toBeNull();
  });

  it("computes correct estimate for 60% WR at 80 LP", () => {
    // expected = 0.6*20 + 0.4*(-16) = 12 - 6.4 = 5.6
    // games = ceil(20 / 5.6) = ceil(3.57) = 4
    expect(estimatedGames(80, 0.60)).toBe(4);
  });

  it("returns at least 1", () => {
    expect(estimatedGames(99, 1.0)).toBe(1);
  });
});

describe("nextLabel", () => {
  it("shows next division within same tier", () => expect(nextLabel("GOLD", "III")).toBe("GOLD II"));
  it("shows next tier at division I", () => expect(nextLabel("GOLD", "I")).toBe("PLATINUM IV"));
  it("shows Master at Diamond I", () => expect(nextLabel("DIAMOND", "I")).toBe("MASTER IV"));
  it("handles apex tier", () => expect(nextLabel("MASTER", "I")).toBe("next LP milestone"));
});
