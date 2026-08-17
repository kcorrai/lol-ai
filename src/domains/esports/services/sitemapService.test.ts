import { describe, it, expect, vi, beforeEach } from "vitest";
import type {
  EsportsEvent,
  EsportsLeague,
  EsportsTeam,
  PlayerEntry,
  PlayerRole,
} from "@/domains/esports/types";

vi.mock("@/lib/utils/logger", () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

const getLeagues = vi.fn<() => Promise<EsportsLeague[]>>();
const getTeams = vi.fn<() => Promise<EsportsTeam[]>>();
const getPlayerIndex = vi.fn<() => Promise<PlayerEntry[]>>();
const getUpcoming = vi.fn<(query?: unknown) => Promise<EsportsEvent[]>>();
const getCompleted = vi.fn<(query?: unknown) => Promise<EsportsEvent[]>>();
const getCachedProChampionIds = vi.fn<() => Promise<string[]>>();
const getTournamentIndex = vi.fn<() => Promise<{ tournament: { slug: string } }[]>>();

// `prominentLeagues` is the rule under test here, so the real one runs.
vi.mock("@/domains/esports/services/leagueService", async () => {
  const actual =
    await vi.importActual<typeof import("@/domains/esports/services/leagueService")>(
      "@/domains/esports/services/leagueService"
    );
  return {
    prominentLeagues: actual.prominentLeagues,
    getLeagues: () => getLeagues(),
    getTournamentIndex: () => getTournamentIndex(),
  };
});
vi.mock("@/domains/esports/services/playerService", () => ({
  getPlayerIndex: () => getPlayerIndex(),
}));
vi.mock("@/domains/esports/services/proMetaService", () => ({
  getCachedProChampionIds: () => getCachedProChampionIds(),
}));
vi.mock("@/domains/esports/services/scheduleService", () => ({
  getUpcoming: (query?: unknown) => getUpcoming(query),
  getCompleted: (query?: unknown) => getCompleted(query),
}));
// The has-content rule itself is `indexableTeams`, and it has its own tests —
// this suite asserts that the sitemap actually applies it, so the real one runs.
vi.mock("@/domains/esports/services/teamService", async () => {
  const actual =
    await vi.importActual<typeof import("@/domains/esports/services/teamService")>(
      "@/domains/esports/services/teamService"
    );
  return { indexableTeams: actual.indexableTeams, getTeams: () => getTeams() };
});

import { esportsSitemapEntries } from "./sitemapService";

function league(over: Partial<EsportsLeague> = {}): EsportsLeague {
  return {
    id: "l-1",
    slug: "lck",
    name: "LCK",
    region: "KOREA",
    image: null,
    displayStatus: "selected",
    displayPosition: 0,
    ...over,
  };
}

function player(handle: string, role: PlayerRole | null): EsportsTeam["players"][number] {
  return { id: `p-${handle}`, handle, fullName: null, image: null, role };
}

function team(over: Partial<EsportsTeam> = {}): EsportsTeam {
  return {
    id: "t-1",
    slug: "t1",
    name: "T1",
    code: "T1",
    image: null,
    backgroundImage: null,
    status: "active",
    league: { name: "LCK", region: "KOREA" },
    players: [player("Faker", "mid")],
    ...over,
  };
}

function entry(slug: string, role: PlayerRole | null, host: EsportsTeam): PlayerEntry {
  return { slug, player: player(slug, role), team: host };
}

function event(matchId: string, startTime = "2026-08-16T09:00:00Z"): EsportsEvent {
  return {
    matchId,
    startTime,
    state: "completed",
    blockName: null,
    bestOf: 3,
    league: { id: "l-1", slug: "lck", name: "LCK", image: null },
    tournamentId: null,
    teams: [],
    hasVod: false,
    streams: [],
  };
}

function paths(entries: { path: string }[]): string[] {
  return entries.map((item) => item.path);
}

beforeEach(() => {
  getLeagues.mockResolvedValue([league()]);
  getTeams.mockResolvedValue([team()]);
  getPlayerIndex.mockResolvedValue([entry("faker", "mid", team())]);
  getUpcoming.mockResolvedValue([]);
  getCompleted.mockResolvedValue([]);
  getCachedProChampionIds.mockResolvedValue([]);
  getTournamentIndex.mockResolvedValue([]);
});

describe("esportsSitemapEntries", () => {
  it("always publishes the section roots", async () => {
    expect(paths(await esportsSitemapEntries())).toEqual(
      expect.arrayContaining([
        "/esports",
        "/esports/schedule",
        "/esports/leagues",
        "/esports/teams",
      ])
    );
  });

  it("leaves hidden leagues out", async () => {
    getLeagues.mockResolvedValue([league(), league({ slug: "dormant", displayStatus: "hidden" })]);

    const result = paths(await esportsSitemapEntries());
    expect(result).toContain("/esports/leagues/lck");
    expect(result).not.toContain("/esports/leagues/dormant");
  });

  it("leaves out teams with no roster, no league, or an unpublished one", async () => {
    getTeams.mockResolvedValue([
      team(),
      team({ id: "t-2", slug: "empty", players: [] }),
      team({ id: "t-3", slug: "leagueless", league: null }),
      team({ id: "t-4", slug: "elsewhere", league: { name: "Dormant Cup", region: "EU" } }),
    ]);

    const result = paths(await esportsSitemapEntries());
    expect(result).toContain("/esports/teams/t1");
    expect(result).not.toContain("/esports/teams/empty");
    expect(result).not.toContain("/esports/teams/leagueless");
    expect(result).not.toContain("/esports/teams/elsewhere");
  });

  it("publishes starters only, and only in the most prominent leagues", async () => {
    // A league far enough down the order is still published as a league and a
    // team page; its player pages are where the empty ones are.
    const tail = Array.from({ length: 14 }, (_, index) =>
      league({
        id: `l-${index + 2}`,
        slug: `minor-${index}`,
        name: `Minor ${index}`,
        displayStatus: "not_selected",
        displayPosition: index,
      })
    );
    getLeagues.mockResolvedValue([league(), ...tail]);

    const last = tail[tail.length - 1];
    const minor = team({
      id: "t-2",
      slug: "minor-team",
      league: { name: last.name, region: "EU" },
    });
    getTeams.mockResolvedValue([team(), minor]);
    getPlayerIndex.mockResolvedValue([
      entry("faker", "mid", team()),
      entry("coach", null, team()),
      entry("unknown", "top", minor),
    ]);

    const result = paths(await esportsSitemapEntries());
    expect(result).toContain("/esports/players/faker");
    // Staff never appear in a scoreboard, so their pages have nothing on them.
    expect(result).not.toContain("/esports/players/coach");
    expect(result).not.toContain("/esports/players/unknown");
    // …but the minor league and its team page are still worth publishing.
    expect(result).toContain(`/esports/leagues/${last.slug}`);
    expect(result).toContain("/esports/teams/minor-team");
  });

  it("keeps players from a league Riot has not flagged as featured", async () => {
    // The regression this guards: LCK and LPL sit in `not_selected`, so a bar
    // built on the display band alone drops the best player pages in the file.
    getLeagues.mockResolvedValue([
      league({ slug: "lcs", name: "LCS", displayStatus: "selected" }),
      league({ id: "l-2", slug: "lck", name: "LCK", displayStatus: "not_selected" }),
    ]);
    const t1 = team({ league: { name: "LCK", region: "KOREA" } });
    getTeams.mockResolvedValue([t1]);
    getPlayerIndex.mockResolvedValue([entry("faker", "mid", t1)]);

    expect(paths(await esportsSitemapEntries())).toContain("/esports/players/faker");
  });

  it("publishes only champions with pro games", async () => {
    getCachedProChampionIds.mockResolvedValue(["Azir", "Jinx"]);

    const result = paths(await esportsSitemapEntries());
    expect(result).toContain("/esports/champions/Azir");
    expect(result).toContain("/esports/champions/Jinx");
    // The rest render an honest empty page and mark themselves noindex, so they
    // have no business in the file.
    expect(result).not.toContain("/esports/champions/Teemo");
  });

  it("still publishes the rest of the file when the pro sample is cold", async () => {
    // The sitemap reads the pro sample cache-only, so a cold cache is a normal
    // answer rather than a reason to walk the feed (LA-17). Losing one section
    // for a round is the trade; losing the file is not.
    getCachedProChampionIds.mockResolvedValue([]);

    const result = paths(await esportsSitemapEntries());
    expect(result.some((path) => path.startsWith("/esports/champions/"))).toBe(false);
    expect(result).toContain("/esports");
    expect(result).toContain("/esports/leagues/lck");
  });

  it("publishes a page per tournament", async () => {
    getTournamentIndex.mockResolvedValue([
      { tournament: { slug: "lck_split_3_2026" } },
      { tournament: { slug: "worlds_2026" } },
    ]);

    const result = paths(await esportsSitemapEntries());
    expect(result).toContain("/esports/tournaments/lck_split_3_2026");
    expect(result).toContain("/esports/tournaments/worlds_2026");
  });

  it("dates completed matches by kickoff and lists a live series once", async () => {
    getUpcoming.mockResolvedValue([event("m-live", "2026-08-16T10:00:00Z")]);
    getCompleted.mockResolvedValue([event("m-live", "2026-08-16T10:00:00Z"), event("m-old")]);

    const entries = await esportsSitemapEntries();
    const matches = entries.filter((item) => item.path.startsWith("/esports/matches/"));

    expect(paths(matches)).toEqual(["/esports/matches/m-live", "/esports/matches/m-old"]);
    expect(matches[1].lastModified).toEqual(new Date("2026-08-16T09:00:00Z"));
  });
});
