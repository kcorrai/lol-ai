import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./challengeProgressService", () => ({ getActiveChallenges: vi.fn() }));
vi.mock("./dailyQuestSignals", () => ({ loadQuestSignals: vi.fn() }));

import { getActiveChallenges } from "./challengeProgressService";
import { loadQuestSignals } from "./dailyQuestSignals";
import type { QuestSignals } from "./dailyQuestSignals";
import { pickOnSiteTask, shiftDateKey } from "./dailyQuestCatalog";
import { computeQuestStreak, getDailyQuest, isQuestDone } from "./dailyQuestService";

const USER = "8f1c1b2e-0000-4000-8000-000000000001";
const TODAY = "2026-08-18";
const NOW = new Date("2026-08-18T09:00:00Z");

function signals(overrides: Partial<QuestSignals> = {}): QuestSignals {
  return {
    onSite: { quiz: new Set(), academy: new Set(), report: new Set(), card: new Set() },
    challengeIssued: new Set(),
    challengeDone: new Set(),
    ...overrides,
  };
}

/** Marks the on-site task the rotation actually issued on `dateKey` as done. */
function onSiteDoneOn(base: QuestSignals, dateKeys: string[]): QuestSignals {
  for (const key of dateKeys) base.onSite[pickOnSiteTask(USER, key).id].add(key);
  return base;
}

function dailyChallenge(overrides: Record<string, unknown> = {}) {
  return {
    id: "challenge-1",
    type: "daily",
    metric: "cs_per_min",
    targetValue: 6.8,
    description: "Hit 6.8 CS/min",
    xpReward: 50,
    validFrom: new Date("2026-08-18T00:00:00Z"),
    validUntil: new Date("2026-08-19T00:00:00Z"),
    progress: 0.5,
    completed: false,
    completedAt: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.mocked(getActiveChallenges).mockResolvedValue([]);
  vi.mocked(loadQuestSignals).mockResolvedValue(signals());
});

describe("isQuestDone", () => {
  it("is false while the on-site leg is unfinished", () => {
    expect(isQuestDone(USER, TODAY, signals())).toBe(false);
  });

  it("counts the day on the on-site leg alone when no challenge was issued", () => {
    expect(isQuestDone(USER, TODAY, onSiteDoneOn(signals(), [TODAY]))).toBe(true);
  });

  it("still requires the in-game leg on a day a challenge was issued", () => {
    const s = onSiteDoneOn(signals({ challengeIssued: new Set([TODAY]) }), [TODAY]);
    expect(isQuestDone(USER, TODAY, s)).toBe(false);

    s.challengeDone.add(TODAY);
    expect(isQuestDone(USER, TODAY, s)).toBe(true);
  });

  it("does not count another day's on-site completion", () => {
    const s = onSiteDoneOn(signals(), [shiftDateKey(TODAY, -1)]);
    expect(isQuestDone(USER, TODAY, s)).toBe(false);
  });
});

describe("computeQuestStreak", () => {
  it("is zero with nothing done", () => {
    expect(computeQuestStreak(USER, TODAY, signals())).toBe(0);
  });

  it("counts consecutive finished days back from today", () => {
    const days = [0, -1, -2].map((d) => shiftDateKey(TODAY, d));
    expect(computeQuestStreak(USER, TODAY, onSiteDoneOn(signals(), days))).toBe(3);
  });

  it("does not break on an unfinished today", () => {
    const days = [-1, -2].map((d) => shiftDateKey(TODAY, d));
    expect(computeQuestStreak(USER, TODAY, onSiteDoneOn(signals(), days))).toBe(2);
  });

  it("breaks on a missed yesterday even when today is done", () => {
    const days = [TODAY, shiftDateKey(TODAY, -2)];
    expect(computeQuestStreak(USER, TODAY, onSiteDoneOn(signals(), days))).toBe(1);
  });

  it("stops at the window rather than running forever", () => {
    const days = Array.from({ length: 60 }, (_, i) => shiftDateKey(TODAY, -i));
    expect(computeQuestStreak(USER, TODAY, onSiteDoneOn(signals(), days))).toBe(30);
  });
});

describe("getDailyQuest", () => {
  it("issues the on-site leg alone when no daily challenge exists", async () => {
    const quest = await getDailyQuest(USER, NOW);

    expect(quest.objectives).toHaveLength(1);
    expect(quest.objectives[0].kind).toBe("on_site");
    expect(quest.dateKey).toBe(TODAY);
    expect(quest.expiresAt.toISOString()).toBe("2026-08-19T00:00:00.000Z");
  });

  it("carries the generated challenge through rather than re-deriving a goal", async () => {
    vi.mocked(getActiveChallenges).mockResolvedValue([dailyChallenge()]);

    const quest = await getDailyQuest(USER, NOW);
    const inGame = quest.objectives.find((o) => o.kind === "in_game");

    expect(inGame?.title).toBe("Hit 6.8 CS/min");
    expect(inGame?.progress).toBe(0.5);
    expect(inGame?.xpReward).toBe(50);
  });

  it("ignores the weekly challenge", async () => {
    vi.mocked(getActiveChallenges).mockResolvedValue([
      dailyChallenge({ type: "weekly", description: "Weekly goal" }),
    ]);

    const quest = await getDailyQuest(USER, NOW);
    expect(quest.objectives.every((o) => o.kind === "on_site")).toBe(true);
  });

  it("is complete only when every issued objective is", async () => {
    vi.mocked(getActiveChallenges).mockResolvedValue([
      dailyChallenge({ completed: true, progress: 1 }),
    ]);
    vi.mocked(loadQuestSignals).mockResolvedValue(onSiteDoneOn(signals(), [TODAY]));

    const quest = await getDailyQuest(USER, NOW);
    expect(quest.completed).toBe(true);
    expect(quest.xpReward).toBeGreaterThan(50);
  });

  it("is incomplete while the on-site leg is outstanding", async () => {
    vi.mocked(getActiveChallenges).mockResolvedValue([
      dailyChallenge({ completed: true, progress: 1 }),
    ]);

    const quest = await getDailyQuest(USER, NOW);
    expect(quest.completed).toBe(false);
  });

  it("reads the streak window back from today, not from now", async () => {
    await getDailyQuest(USER, NOW);

    const since = vi.mocked(loadQuestSignals).mock.calls[0][1];
    expect(since.toISOString()).toBe("2026-07-20T00:00:00.000Z");
  });
});
