import { describe, it, expect } from "vitest";
import { classifyPlaystyle } from "./playstyleClassifier";
import type { PerformanceMetrics } from "@/domains/analysis/types/analysis.types";

const baseMetrics: PerformanceMetrics = {
  kda: 3.0,
  csPerMinute: 6.0,
  damageShare: 0.25,
  killParticipation: 0.55,
  visionScorePerMinute: 0.4,
  avgGoldPerMinute: 350,
  avgDeathsPerGame: 4,
};

describe("classifyPlaystyle", () => {
  it("always returns supportive for UTILITY regardless of other metrics", () => {
    const aggressive: PerformanceMetrics = {
      ...baseMetrics,
      damageShare: 0.5,
      killParticipation: 0.9,
    };
    expect(classifyPlaystyle(aggressive, "UTILITY")).toBe("supportive");
  });

  it("classifies aggressive when damage share and kill participation are both high", () => {
    const metrics: PerformanceMetrics = {
      ...baseMetrics,
      damageShare: 0.38,
      killParticipation: 0.7,
    };
    expect(classifyPlaystyle(metrics, "MIDDLE")).toBe("aggressive");
  });

  it("classifies farming when CS is high and fight presence is low", () => {
    const metrics: PerformanceMetrics = {
      ...baseMetrics,
      csPerMinute: 8.0,
      damageShare: 0.2,
      killParticipation: 0.45,
    };
    expect(classifyPlaystyle(metrics, "TOP")).toBe("farming");
  });

  it("classifies passive when KDA, CS, and damage share are all low", () => {
    const metrics: PerformanceMetrics = {
      ...baseMetrics,
      kda: 1.5,
      csPerMinute: 4.0,
      damageShare: 0.15,
    };
    expect(classifyPlaystyle(metrics, "MIDDLE")).toBe("passive");
  });

  it("classifies balanced when no extreme pattern matches", () => {
    expect(classifyPlaystyle(baseMetrics, "MIDDLE")).toBe("balanced");
  });

  it("classifies supportive for low-CS high-vision non-UTILITY roamers", () => {
    const metrics: PerformanceMetrics = {
      ...baseMetrics,
      csPerMinute: 3.0,
      visionScorePerMinute: 0.6,
      killParticipation: 0.6,
    };
    expect(classifyPlaystyle(metrics, "JUNGLE")).toBe("supportive");
  });
});
