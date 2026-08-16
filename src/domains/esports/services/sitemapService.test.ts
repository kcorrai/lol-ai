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

vi.mock("@/domains/esports/services/leagueService", () => ({ getLeagues: () => getLeagues() }));
vi.mock("@/domains/esports/services/playerService", () => ({
  getPlayerIndex: () => getPlayerIndex(),
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

  it("publishes starters only, and only in leagues Riot features", async () => {
    // `not_selected` is still published as a league and a team page, but Riot
    // rarely publishes per-game stats for it, so its player pages stay out.
    getLeagues.mockResolvedValue([
      league(),
      league({ id: "l-2", slug: "minor", name: "Minor", displayStatus: "not_selected" }),
    ]);
    const minor = team({ id: "t-2", slug: "minor-team", league: { name: "Minor", region: "EU" } });
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
    expect(result).toContain("/esports/leagues/minor");
    expect(result).toContain("/esports/teams/minor-team");
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
