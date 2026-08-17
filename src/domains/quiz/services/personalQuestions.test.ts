import { describe, it, expect } from "vitest";
import {
  MIN_MATCHES,
  generatePersonalQuestions,
  stripAnswer,
  type PlayedMatch,
} from "./personalQuestions";

const NOW = new Date("2026-08-17T12:00:00Z");

function match(overrides: Partial<PlayedMatch> = {}): PlayedMatch {
  return {
    championName: "Ahri",
    position: "MIDDLE",
    won: true,
    kills: 8,
    deaths: 3,
    assists: 11,
    cs: 210,
    durationMin: 28,
    playedAt: new Date("2026-08-15T12:00:00Z"),
    ...overrides,
  };
}

/** A history broad enough that every builder can produce a question. */
function history(): PlayedMatch[] {
  const out: PlayedMatch[] = [];
  const plan: [string, string, number, number][] = [
    // champion, position, games, wins
    ["Ahri", "MIDDLE", 12, 10],
    ["Lux", "MIDDLE", 6, 2],
    ["Zed", "MIDDLE", 5, 2],
    ["Yasuo", "TOP", 5, 2],
    ["Jinx", "BOTTOM", 4, 1],
  ];
  let day = 1;
  for (const [championName, position, games, wins] of plan) {
    for (let i = 0; i < games; i++) {
      out.push(
        match({
          championName,
          position,
          won: i < wins,
          playedAt: new Date(Date.UTC(2026, 7, 17) - day * 86_400_000),
        })
      );
      day++;
    }
  }
  return out;
}

describe("generatePersonalQuestions", () => {
  it("says nothing rather than guessing when there is barely any history", () => {
    expect(generatePersonalQuestions([match()], "user-1", "2026-08-17", NOW)).toEqual([]);
    expect(
      generatePersonalQuestions(Array(MIN_MATCHES - 1).fill(match()), "user-1", "2026-08-17", NOW)
    ).toEqual([]);
  });

  it("builds a set once there is enough history", () => {
    const questions = generatePersonalQuestions(history(), "user-1", "2026-08-17", NOW);
    expect(questions.length).toBeGreaterThan(0);
    for (const q of questions) {
      expect(q.prompt).toBeTruthy();
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      expect(q.options).toContain(q.answer);
    }
  });

  it("is stable through the day — refreshing cannot reroll the questions", () => {
    const first = generatePersonalQuestions(history(), "user-1", "2026-08-17", NOW);
    const again = generatePersonalQuestions(history(), "user-1", "2026-08-17", NOW);
    expect(again).toEqual(first);
  });

  it("gives two players different sets from the same history", () => {
    const a = generatePersonalQuestions(history(), "user-1", "2026-08-17", NOW);
    const b = generatePersonalQuestions(history(), "user-2", "2026-08-17", NOW);
    expect(a.map((q) => q.options)).not.toEqual(b.map((q) => q.options));
  });

  it("moves on to a new set the next day", () => {
    const today = generatePersonalQuestions(history(), "user-1", "2026-08-17", NOW);
    const tomorrow = generatePersonalQuestions(history(), "user-1", "2026-08-18", NOW);
    expect(tomorrow.map((q) => q.options)).not.toEqual(today.map((q) => q.options));
  });

  it("never repeats an option inside one question", () => {
    for (const q of generatePersonalQuestions(history(), "user-1", "2026-08-17", NOW)) {
      expect(new Set(q.options).size, q.id).toBe(q.options.length);
    }
  });

  describe("most played", () => {
    it("answers with the champion actually played most", () => {
      const q = generatePersonalQuestions(history(), "user-1", "2026-08-17", NOW).find(
        (x) => x.kind === "most-played"
      );
      expect(q?.answer).toBe("Ahri");
    });

    it("draws its wrong options from the player's own champions", () => {
      const played = new Set(history().map((m) => m.championName));
      const q = generatePersonalQuestions(history(), "user-1", "2026-08-17", NOW).find(
        (x) => x.kind === "most-played"
      );
      for (const option of q!.options) expect(played.has(option), option).toBe(true);
    });
  });

  describe("did you win", () => {
    it("shows a real scoreline and grades it against that game", () => {
      const games = history();
      const q = generatePersonalQuestions(games, "user-1", "2026-08-17", NOW).find(
        (x) => x.kind === "did-you-win"
      )!;
      const shown = q.scoreline!;
      const original = games.find(
        (m) =>
          m.championName === shown.championName &&
          m.kills === shown.kills &&
          m.deaths === shown.deaths &&
          m.cs === shown.cs
      );
      expect(original).toBeDefined();
      expect(q.answer).toBe(original!.won ? "Win" : "Loss");
    });
  });

  describe("best win rate", () => {
    it("answers with the champion the player really wins most on", () => {
      const q = generatePersonalQuestions(history(), "user-1", "2026-08-17", NOW).find(
        (x) => x.kind === "best-winrate"
      );
      // Ahri is 10/12; nothing else is above 40%.
      expect(q?.answer).toBe("Ahri");
    });

    it("skips the question when the top two are too close to be knowledge", () => {
      const even: PlayedMatch[] = [];
      for (const name of ["Ahri", "Lux", "Zed", "Yasuo"]) {
        for (let i = 0; i < 4; i++) even.push(match({ championName: name, won: i < 2 }));
      }
      const q = generatePersonalQuestions(even, "user-1", "2026-08-17", NOW).find(
        (x) => x.kind === "best-winrate"
      );
      expect(q).toBeUndefined();
    });
  });

  describe("games last week", () => {
    it("counts only the last seven days", () => {
      const games = [
        ...Array.from({ length: 6 }, (_, i) =>
          match({ playedAt: new Date(NOW.getTime() - (i + 1) * 3_600_000) })
        ),
        ...Array.from({ length: 8 }, (_, i) =>
          match({ playedAt: new Date(NOW.getTime() - (20 + i) * 86_400_000) })
        ),
      ];
      const q = generatePersonalQuestions(games, "user-1", "2026-08-17", NOW).find(
        (x) => x.kind === "games-last-week"
      );
      expect(q?.answer).toBe("6");
    });
  });

  describe("most played role", () => {
    it("answers with the role actually played most", () => {
      const q = generatePersonalQuestions(history(), "user-1", "2026-08-17", NOW).find(
        (x) => x.kind === "most-played-role"
      );
      expect(q?.answer).toBe("Mid");
    });
  });
});

describe("stripAnswer", () => {
  it("removes the answer, which is the only thing keeping the quiz honest", () => {
    const q = generatePersonalQuestions(history(), "user-1", "2026-08-17", NOW)[0];
    const stripped = stripAnswer(q) as Record<string, unknown>;
    expect(stripped.answer).toBeUndefined();
    expect(JSON.stringify(stripped)).not.toContain('"answer"');
    expect(stripped.prompt).toBe(q.prompt);
  });
});
