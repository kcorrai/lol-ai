import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/ai/aiCache", () => ({
  getCached: vi.fn(async () => null),
  setCached: vi.fn(async () => undefined),
}));
vi.mock("@/lib/utils/logger", () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { getStandings, primaryTable } from "./standingsService";

function team(id: string, code: string) {
  return {
    id,
    slug: code.toLowerCase(),
    name: `${code} Esports`,
    code,
    image: `http://static.lolesports.com/teams/${code}.png`,
  };
}

function ranked(ordinal: number, entries: [string, number, number][]) {
  return {
    ordinal,
    teams: entries.map(([code, wins, losses]) => ({
      ...team(`id-${code}`, code),
      record: { wins, losses },
    })),
  };
}

function response(stages: unknown[]): unknown {
  return { data: { standings: [{ stages }] } };
}

function mockFeed(body: unknown): void {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => body,
  }) as unknown as typeof fetch;
}

describe("getStandings — ranked stages", () => {
  beforeEach(() => vi.clearAllMocks());

  it("flattens ordinal groups into rows and computes win rate", async () => {
    mockFeed(
      response([
        {
          name: "Regular Season",
          slug: "regular_season",
          sections: [
            {
              name: "Regular Season",
              rankings: [ranked(1, [["KC", 6, 0]]), ranked(2, [["G2", 6, 1]])],
              matches: [],
            },
          ],
        },
      ])
    );

    const [stage] = await getStandings("t1");
    expect(stage.kind).toBe("table");
    if (stage.kind !== "table") throw new Error("expected a table");

    expect(stage.rows).toHaveLength(2);
    expect(stage.rows[0]).toMatchObject({ rank: 1, wins: 6, losses: 0, winRate: 100, tied: false });
    expect(stage.rows[1]).toMatchObject({ rank: 2, winRate: 85.7 });
    expect(stage.rows[0].team.image).toBe("https://static.lolesports.com/teams/KC.png");
  });

  it("marks every team sharing an ordinal as tied, keeping the shared rank", async () => {
    mockFeed(
      response([
        {
          name: "Regular Season",
          sections: [
            {
              name: "Regular Season",
              rankings: [
                ranked(1, [["KC", 5, 1]]),
                ranked(2, [
                  ["G2", 4, 2],
                  ["FNC", 4, 2],
                ]),
              ],
            },
          ],
        },
      ])
    );

    const [stage] = await getStandings("t1");
    if (stage.kind !== "table") throw new Error("expected a table");

    expect(stage.rows.map((r) => [r.team.code, r.rank, r.tied])).toEqual([
      ["KC", 1, false],
      ["G2", 2, true],
      ["FNC", 2, true],
    ]);
  });

  it("leaves win rate null for a team that has not played", async () => {
    mockFeed(
      response([
        {
          name: "Regular Season",
          sections: [{ name: "S", rankings: [ranked(1, [["KC", 0, 0]])] }],
        },
      ])
    );

    const [stage] = await getStandings("t1");
    if (stage.kind !== "table") throw new Error("expected a table");
    // Not 0 — "no games yet" and "loses everything" must not read the same.
    expect(stage.rows[0].winRate).toBeNull();
  });
});

describe("getStandings — bracket stages", () => {
  beforeEach(() => vi.clearAllMocks());

  it("treats a section with matches but no rankings as a bracket", async () => {
    mockFeed(
      response([
        {
          name: "Knockouts",
          sections: [
            {
              name: "Knockouts",
              rankings: [],
              matches: [
                {
                  id: "m1",
                  state: "completed",
                  previousMatchIds: ["m0"],
                  teams: [
                    { ...team("id-T1", "T1"), result: { outcome: "win", gameWins: 3 } },
                    { ...team("id-GEN", "GEN"), result: { outcome: "loss", gameWins: 1 } },
                  ],
                },
              ],
            },
          ],
        },
      ])
    );

    const [stage] = await getStandings("t1");
    expect(stage.kind).toBe("bracket");
    if (stage.kind !== "bracket") throw new Error("expected a bracket");

    expect(stage.matches[0]).toMatchObject({ matchId: "m1", previousMatchIds: ["m0"] });
    expect(stage.matches[0].teams[0]).toMatchObject({ gameWins: 3, outcome: "win", decided: true });
  });

  it("flags an undecided bracket slot", async () => {
    mockFeed(
      response([
        {
          name: "Playoffs",
          sections: [
            {
              name: "Playoffs",
              matches: [
                {
                  id: "m2",
                  state: "unstarted",
                  teams: [
                    { id: "0", slug: "tbd", name: "TBD", code: "TBD", image: null, result: null },
                    { ...team("id-KC", "KC"), result: null },
                  ],
                },
              ],
            },
          ],
        },
      ])
    );

    const [stage] = await getStandings("t1");
    if (stage.kind !== "bracket") throw new Error("expected a bracket");
    expect(stage.matches[0].teams.map((t) => t.decided)).toEqual([false, true]);
  });
});

describe("getStandings — resilience", () => {
  beforeEach(() => vi.clearAllMocks());

  it("keeps the stages it understood and skips empty sections", async () => {
    mockFeed(
      response([
        { name: "Empty", sections: [{ name: "Nothing yet", rankings: [], matches: [] }] },
        {
          name: "Regular Season",
          sections: [{ name: "S", rankings: [ranked(1, [["KC", 1, 0]])] }],
        },
      ])
    );

    const stages = await getStandings("t1");
    expect(stages).toHaveLength(1);
    expect(stages[0].stageName).toBe("Regular Season");
  });

  it("returns an empty list when the feed is down", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("down")) as unknown as typeof fetch;
    expect(await getStandings("t1")).toEqual([]);
  });
});

describe("primaryTable", () => {
  it("picks the first ranked stage, ignoring brackets before it", () => {
    const stages = [
      { kind: "bracket" as const, stageName: "Play-Ins", sectionName: "P", matches: [] },
      { kind: "table" as const, stageName: "Groups", sectionName: "A", rows: [] },
      { kind: "table" as const, stageName: "Groups", sectionName: "B", rows: [] },
    ];
    expect(primaryTable(stages)?.sectionName).toBe("A");
  });

  it("returns null when nothing is ranked", () => {
    expect(
      primaryTable([{ kind: "bracket", stageName: "Knockouts", sectionName: "K", matches: [] }])
    ).toBeNull();
  });
});
