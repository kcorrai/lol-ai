import { describe, expect, it } from "vitest";
import { DEFAULT_PLACEMENT, placeFromProfile } from "./placement";
import type { PlayerPerformanceProfile } from "@/domains/analysis";

interface Metrics {
  csPerMinute: number;
  visionScorePerMinute: number;
  avgDeathsPerGame: number;
  killParticipation: number;
}

function profile(metrics: Partial<Metrics> = {}): PlayerPerformanceProfile {
  return {
    riotAccountId: "acc-1",
    gamesAnalyzed: 20,
    avgMetrics: {
      kda: 3,
      csPerMinute: 6,
      damageShare: 22,
      killParticipation: 52,
      visionScorePerMinute: 0.8,
      avgGoldPerMinute: 380,
      avgDeathsPerGame: 5,
      ...metrics,
    },
    playstyle: "balanced",
    strongestArea: "cs_farming",
    weakestArea: "vision_control",
    recentMatches: [],
    winRate: 50,
    deathCluster: "spread",
    csConsistency: "moderate",
    visionConsistency: "moderate",
    mostPlayedChampions: [],
  } as unknown as PlayerPerformanceProfile;
}

describe("placeFromProfile", () => {
  it("puts a player with three weak readings in Foundations", () => {
    const placement = placeFromProfile(
      profile({ csPerMinute: 3.8, visionScorePerMinute: 0.4, avgDeathsPerGame: 7.5 })
    );

    expect(placement.level).toBe("foundation");
    expect(placement.recommendedTrackId).toBe("foundations");
    expect(placement.leaks).toEqual(
      expect.arrayContaining(["low_cs", "low_vision", "high_deaths"])
    );
  });

  it("puts a mixed player in Laning", () => {
    const placement = placeFromProfile(profile({ csPerMinute: 4.5 }));

    expect(placement.level).toBe("core");
    expect(placement.recommendedTrackId).toBe("laning");
    expect(placement.leaks).toEqual(["low_cs"]);
  });

  it("calls a player advanced only when every reading is strong", () => {
    const strong = placeFromProfile(
      profile({
        csPerMinute: 7.4,
        visionScorePerMinute: 1.3,
        avgDeathsPerGame: 3.2,
        killParticipation: 66,
      })
    );
    expect(strong.level).toBe("advanced");
    expect(strong.leaks).toEqual([]);

    // One merely-ok reading is enough to keep them in the core track.
    const nearlyStrong = placeFromProfile(
      profile({
        csPerMinute: 7.4,
        visionScorePerMinute: 1.3,
        avgDeathsPerGame: 5,
        killParticipation: 66,
      })
    );
    expect(nearlyStrong.level).toBe("core");
  });

  // Deaths are the one metric where lower is better; a naive comparison inverts it.
  it("reads deaths the right way round", () => {
    const few = placeFromProfile(profile({ avgDeathsPerGame: 2 }));
    const many = placeFromProfile(profile({ avgDeathsPerGame: 9 }));

    expect(few.signals.find((s) => s.leak === "high_deaths")?.verdict).toBe("strong");
    expect(many.signals.find((s) => s.leak === "high_deaths")?.verdict).toBe("weak");
  });

  it("reports one signal per metric with a formatted value", () => {
    const placement = placeFromProfile(profile());

    expect(placement.signals).toHaveLength(4);
    expect(placement.signals.map((s) => s.label)).toEqual([
      "CS / min",
      "Vision / min",
      "Deaths / game",
      "Kill participation",
    ]);
    expect(placement.signals[3].value).toBe("52.0%");
    // The vision threshold is sub-2, so it gets the finer format.
    expect(placement.signals[1].value).toBe("0.80");
  });

  it("carries the game count through so the reason can cite it", () => {
    expect(placeFromProfile(profile()).gamesAnalyzed).toBe(20);
  });
});

describe("DEFAULT_PLACEMENT", () => {
  it("starts a visitor with no linked account at the beginning", () => {
    expect(DEFAULT_PLACEMENT).toMatchObject({
      level: "foundation",
      recommendedTrackId: "foundations",
      gamesAnalyzed: 0,
      leaks: [],
    });
  });
});
