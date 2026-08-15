import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/ai/aiCache", () => ({
  getCached: vi.fn(async () => null),
  setCached: vi.fn(async () => undefined),
}));
vi.mock("@/lib/utils/logger", () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { getTeams, resolveTeamBySlug, indexableTeams, isThinTeam, recentForm } from "./teamService";
import type { EsportsEvent, EsportsTeam } from "@/domains/esports/types";

function rawTeam(over: Record<string, unknown> = {}): unknown {
  return {
    id: "id-1",
    slug: "t1",
    name: "T1",
    code: "T1",
    image: "http://static.lolesports.com/teams/t1.png",
    backgroundImage: null,
    status: "active",
    homeLeague: { name: "LCK", region: "KOREA" },
    players: [],
    ...over,
  };
}

function mockFeed(teams: unknown[]): void {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ data: { teams } }),
  }) as unknown as typeof fetch;
}

function team(over: Partial<EsportsTeam> = {}): EsportsTeam {
  return {
    id: "id-1",
    slug: "t1",
    name: "T1",
    code: "T1",
    image: null,
    backgroundImage: null,
    status: "active",
    league: { name: "LCK", region: "KOREA" },
    players: [],
    ...over,
  };
}

describe("getTeams", () => {
  beforeEach(() => vi.clearAllMocks());

  it("maps players, joins the real name and upgrades images", async () => {
    mockFeed([
      rawTeam({
        players: [
          {
            id: "p1",
            summonerName: "Faker",
            firstName: "Sanghyeok",
            lastName: "Lee",
            image: "http://static.lolesports.com/players/faker.png",
            role: "mid",
          },
        ],
      }),
    ]);

    const [mapped] = await getTeams();
    expect(mapped.players[0]).toEqual({
      id: "p1",
      handle: "Faker",
      fullName: "Sanghyeok Lee",
      image: "https://static.lolesports.com/players/faker.png",
      role: "mid",
    });
    expect(mapped.image).toBe("https://static.lolesports.com/teams/t1.png");
  });

  it("orders a roster by lane and leaves unknown roles null", async () => {
    mockFeed([
      rawTeam({
        players: [
          { id: "p1", summonerName: "Sup", role: "support" },
          { id: "p2", summonerName: "Coach", role: "none" },
          { id: "p3", summonerName: "Top", role: "top" },
          { id: "p4", summonerName: "Jng", role: "jungle" },
        ],
      }),
    ]);

    const [mapped] = await getTeams();
    expect(mapped.players.map((p) => p.handle)).toEqual(["Top", "Jng", "Sup", "Coach"]);
    // "none" is staff or an unassigned substitute — not a lane.
    expect(mapped.players[3].role).toBeNull();
  });

  it("returns an empty list when the feed is down", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("down")) as unknown as typeof fetch;
    expect(await getTeams()).toEqual([]);
  });
});

describe("resolveTeamBySlug", () => {
  it("prefers the active entry over an archived one carrying an old roster", () => {
    const teams = [
      team({
        id: "old",
        status: "archived",
        players: [{ id: "p", handle: "Legacy", fullName: null, image: null, role: "top" }],
      }),
      team({ id: "new", status: "active", players: [] }),
    ];
    // The archived record has the roster, but it is a 2019 lineup — showing it
    // as the current one would be worse than showing none.
    expect(resolveTeamBySlug(teams, "t1")?.id).toBe("new");
  });

  it("prefers the entry with a roster when both are active", () => {
    const teams = [
      team({ id: "empty", players: [] }),
      team({
        id: "full",
        players: [{ id: "p", handle: "A", fullName: null, image: null, role: "mid" }],
      }),
    ];
    expect(resolveTeamBySlug(teams, "t1")?.id).toBe("full");
  });

  it("resolves the same slug to the same team every time", () => {
    const teams = [team({ id: "b" }), team({ id: "a" })];
    expect(resolveTeamBySlug(teams, "t1")?.id).toBe("a");
    expect(resolveTeamBySlug([...teams].reverse(), "t1")?.id).toBe("a");
  });

  it("matches case-insensitively and returns null for an unknown slug", () => {
    const teams = [team()];
    expect(resolveTeamBySlug(teams, "T1")?.id).toBe("id-1");
    expect(resolveTeamBySlug(teams, "nope")).toBeNull();
  });
});

describe("indexableTeams", () => {
  const withRoster = [{ id: "p", handle: "A", fullName: null, image: null, role: "mid" as const }];

  it("keeps only active teams that have both a league and a roster", () => {
    const teams = [
      team({ id: "keep", slug: "keep", name: "Keep", players: withRoster }),
      team({ id: "no-roster", slug: "no-roster", name: "No roster" }),
      team({
        id: "no-league",
        slug: "no-league",
        name: "No league",
        league: null,
        players: withRoster,
      }),
      team({
        id: "archived",
        slug: "archived",
        name: "Archived",
        status: "archived",
        players: withRoster,
      }),
    ];
    expect(indexableTeams(teams).map((t) => t.id)).toEqual(["keep"]);
  });

  it("lists a slug once even when the feed repeats it", () => {
    const teams = [
      team({ id: "a", slug: "dupe", name: "A", players: withRoster }),
      team({ id: "b", slug: "dupe", name: "B", players: withRoster }),
    ];
    expect(indexableTeams(teams)).toHaveLength(1);
  });
});

describe("isThinTeam / recentForm", () => {
  function event(code: string, outcome: "win" | "loss", name = code): EsportsEvent {
    return {
      matchId: `m-${code}-${outcome}`,
      startTime: "2026-08-15T12:00:00Z",
      state: "completed",
      blockName: null,
      bestOf: 3,
      league: { id: null, slug: "lck", name: "LCK", image: null },
      tournamentId: null,
      teams: [
        { id: null, slug: null, name, code, image: null, gameWins: 2, outcome, record: null },
        {
          id: null,
          slug: null,
          name: "Other",
          code: "OTH",
          image: null,
          gameWins: 0,
          outcome: outcome === "win" ? "loss" : "win",
          record: null,
        },
      ],
      hasVod: false,
    };
  }

  it("calls a team thin only when it has neither roster nor matches", () => {
    expect(isThinTeam(team(), [])).toBe(true);
    expect(isThinTeam(team(), [event("T1", "win")])).toBe(false);
    expect(
      isThinTeam(
        team({ players: [{ id: "p", handle: "A", fullName: null, image: null, role: "mid" }] }),
        []
      )
    ).toBe(false);
  });

  it("reads form from the team's own side of each series", () => {
    expect(recentForm(team(), [event("T1", "win"), event("T1", "loss")])).toEqual(["W", "L"]);
    // Matched on name when the code differs — orgs change their tricode.
    expect(recentForm(team(), [event("TT1", "win", "T1")])).toEqual(["W"]);
  });

  it("ignores series the team did not play in", () => {
    const other = event("GEN", "win", "Gen.G");
    expect(recentForm(team(), [other])).toEqual([]);
  });
});
