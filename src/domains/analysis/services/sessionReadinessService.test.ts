import { describe, it, expect } from "vitest";
import { computeReadinessScore } from "./sessionReadinessService";
import type { TiltStatus } from "./tiltService";
import type { WarmupData } from "./warmupService";

function makeTilt(overrides: Partial<TiltStatus> = {}): TiltStatus {
  return {
    level: "focused",
    score: 0,
    lossStreak: 0,
    recentWinRate: 0.6,
    kdaTrend: "stable",
    message: "You're in a good mental state.",
    gamesAnalyzed: 10,
    ...overrides,
  };
}

function makeWarmup(overrides: Partial<WarmupData> = {}): WarmupData {
  return {
    status: "warmed_up",
    warmupGames: 2,
    firstRankedResult: null,
    withWarmupWinRate: null,
    withoutWarmupWinRate: null,
    message: "2 warm-up games before ranked.",
    ...overrides,
  };
}

describe("computeReadinessScore", () => {
  it("returns 'ready' with max-ish score for focused + warmed_up + high WR", () => {
    const result = computeReadinessScore(
      makeTilt({ level: "focused", recentWinRate: 0.7 }),
      makeWarmup({ status: "warmed_up" })
    );

    expect(result.level).toBe("ready");
    expect(result.score).toBe(100); // 40 + 25 + 35
  });

  it("returns 'not_ready' for tilted + no_warmup + very low WR", () => {
    const result = computeReadinessScore(
      makeTilt({ level: "tilting", recentWinRate: 0.3 }),
      makeWarmup({ status: "no_warmup" })
    );

    expect(result.level).toBe("not_ready");
    expect(result.score).toBeLessThan(40);
  });

  it("returns 'caution' for caution tilt + no_warmup + average WR", () => {
    const result = computeReadinessScore(
      makeTilt({ level: "caution", recentWinRate: 0.5 }),
      makeWarmup({ status: "no_warmup" })
    );

    // 20 (tilt) + 0 (no warmup) + ~25 (50% / 70% * 35 ≈ 25)
    expect(result.level).toBe("caution");
  });

  it("gives 15 warmup pts for no_ranked_today (neutral — no penalty)", () => {
    const result = computeReadinessScore(
      makeTilt({ level: "focused", recentWinRate: 0.5 }),
      makeWarmup({ status: "no_ranked_today" })
    );

    // 40 + 15 + ~25 = 80 → ready
    expect(result.level).toBe("ready");
    expect(result.score).toBeGreaterThanOrEqual(65);
  });

  it("caps score at 100", () => {
    const result = computeReadinessScore(
      makeTilt({ level: "focused", recentWinRate: 1.0 }),
      makeWarmup({ status: "warmed_up" })
    );

    expect(result.score).toBe(100);
  });

  it("returns correct factor labels for best-case inputs", () => {
    const result = computeReadinessScore(
      makeTilt({ level: "focused", recentWinRate: 0.65 }),
      makeWarmup({ status: "warmed_up" })
    );

    const labels = result.factors.map((f) => f.label);
    expect(labels[0]).toBe("Mentally focused");
    expect(labels[1]).toBe("Warmed up");
    expect(labels[2]).toContain("Good form");
  });

  it("returns correct factor labels for worst-case inputs", () => {
    const result = computeReadinessScore(
      makeTilt({ level: "tilting", recentWinRate: 0.3 }),
      makeWarmup({ status: "no_warmup" })
    );

    const labels = result.factors.map((f) => f.label);
    expect(labels[0]).toBe("Tilted");
    expect(labels[1]).toBe("No warm-up");
    expect(labels[2]).toContain("Poor form");
  });

  it("marks positive/neutral/negative flags correctly", () => {
    const result = computeReadinessScore(
      makeTilt({ level: "caution", recentWinRate: 0.5 }),
      makeWarmup({ status: "no_ranked_today" })
    );

    const [mental, warmup, form] = result.factors;
    expect(mental.positive).toBe(false);
    expect(mental.neutral).toBe(true);
    expect(warmup.positive).toBe(false);
    expect(warmup.neutral).toBe(true);
    expect(form.positive).toBe(false);
    expect(form.neutral).toBe(true);
  });

  it("includes non-empty advice for every level", () => {
    const levels = ["focused", "caution", "tilting"] as const;
    for (const level of levels) {
      const result = computeReadinessScore(
        makeTilt({ level, recentWinRate: 0.5 }),
        makeWarmup({ status: "no_warmup" })
      );
      expect(result.advice.length).toBeGreaterThan(0);
    }
  });
});
