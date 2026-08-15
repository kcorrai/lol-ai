import { describe, expect, it } from "vitest";
import {
  DUO_QUEST_CATALOG,
  QUESTS_PER_WEEK,
  questsForWeek,
  weekWindow,
  type QuestMatch,
} from "@/domains/analysis/services/duoQuestCatalog";

function match(overrides: Partial<QuestMatch> = {}): QuestMatch {
  return {
    won: true,
    kills: 5,
    deaths: 3,
    assists: 8,
    visionScore: 20,
    gameStart: new Date(2026, 7, 12),
    ...overrides,
  };
}

function quest(key: string) {
  const found = DUO_QUEST_CATALOG.find((q) => q.key === key);
  if (!found) throw new Error(`no such quest: ${key}`);
  return found;
}

describe("weekWindow", () => {
  it("starts on the Monday that owns the day, at midnight UTC", () => {
    // 2026-08-13 is a Thursday.
    const { start, end } = weekWindow(new Date("2026-08-13T18:42:00Z"));

    expect(start.toISOString()).toBe("2026-08-10T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-08-17T00:00:00.000Z");
  });

  it("treats Sunday as the end of its week, not the start of the next", () => {
    // The classic off-by-one: getUTCDay() is 0 on Sunday, six days after its Monday.
    const { start } = weekWindow(new Date("2026-08-16T23:59:00Z"));

    expect(start.toISOString()).toBe("2026-08-10T00:00:00.000Z");
  });

  it("keeps Monday itself as its own start", () => {
    const { start } = weekWindow(new Date("2026-08-10T00:00:00Z"));

    expect(start.toISOString()).toBe("2026-08-10T00:00:00.000Z");
  });
});

describe("questsForWeek", () => {
  it("is stable within a week and identical for every pair", () => {
    const monday = weekWindow(new Date("2026-08-13T18:42:00Z")).start;
    const sunday = weekWindow(new Date("2026-08-16T09:00:00Z")).start;

    expect(questsForWeek(monday)).toEqual(questsForWeek(sunday));
  });

  it("changes on Monday", () => {
    const thisWeek = weekWindow(new Date("2026-08-13T00:00:00Z")).start;
    const nextWeek = weekWindow(new Date("2026-08-20T00:00:00Z")).start;

    expect(questsForWeek(thisWeek).map((q) => q.key)).not.toEqual(
      questsForWeek(nextWeek).map((q) => q.key),
    );
  });

  it("offers three distinct quests", () => {
    const keys = questsForWeek(new Date("2026-08-10T00:00:00Z")).map((q) => q.key);

    expect(keys).toHaveLength(QUESTS_PER_WEEK);
    expect(new Set(keys).size).toBe(QUESTS_PER_WEEK);
  });
});

describe("quest measures", () => {
  it("counts games and wins", () => {
    const played = [match(), match({ won: false }), match()];

    expect(quest("games_together").measure(played)).toBe(3);
    expect(quest("wins_together").measure(played)).toBe(2);
  });

  it("takes the longest win streak, not the current one", () => {
    const played = [
      match({ won: true, gameStart: new Date(2026, 7, 10) }),
      match({ won: true, gameStart: new Date(2026, 7, 11) }),
      match({ won: true, gameStart: new Date(2026, 7, 12) }),
      match({ won: false, gameStart: new Date(2026, 7, 13) }),
    ];

    // A streak the pair already achieved this week still counts after they lose one.
    expect(quest("win_streak").measure(played)).toBe(3);
  });

  it("reads the streak in chronological order regardless of input order", () => {
    const played = [
      match({ won: true, gameStart: new Date(2026, 7, 13) }),
      match({ won: false, gameStart: new Date(2026, 7, 11) }),
      match({ won: true, gameStart: new Date(2026, 7, 12) }),
    ];

    expect(quest("win_streak").measure(played)).toBe(2);
  });

  it("counts only games at or under the death threshold", () => {
    const played = [match({ deaths: 4 }), match({ deaths: 5 }), match({ deaths: 0 })];

    expect(quest("clean_games").measure(played)).toBe(2);
  });

  it("counts only games at or over the vision threshold", () => {
    const played = [match({ visionScore: 25 }), match({ visionScore: 24 })];

    expect(quest("vision_games").measure(played)).toBe(1);
  });

  it("sums kills and assists across the week", () => {
    expect(quest("shared_kills").measure([match({ kills: 5, assists: 8 }), match()])).toBe(26);
  });

  it("measures an empty week as zero rather than throwing", () => {
    for (const q of DUO_QUEST_CATALOG) {
      expect(q.measure([])).toBe(0);
    }
  });
});
