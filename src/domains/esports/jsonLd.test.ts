import { describe, it, expect } from "vitest";
import { buildJsonLd } from "./jsonLd";
import type { EsportsTeam, MatchDetail, PlayerEntry } from "@/domains/esports/types";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://lolaicoach.gg";

function team(over: Partial<EsportsTeam> = {}): EsportsTeam {
  return {
    id: "team-1",
    slug: "t1",
    name: "T1",
    code: "T1",
    image: "https://static.lolesports.com/teams/t1.png",
    backgroundImage: null,
    status: "active",
    league: { name: "LCK", region: "KOREA" },
    players: [],
    ...over,
  };
}

function match(over: Partial<MatchDetail> = {}): MatchDetail {
  return {
    matchId: "110853167128207000",
    bestOf: 5,
    league: { id: "98767991310872058", slug: "lck", name: "LCK", image: null },
    tournamentId: null,
    teams: [
      { id: "team-1", name: "T1", code: "T1", image: null, gameWins: 3 },
      { id: "team-2", name: "Gen.G", code: "GEN", image: null, gameWins: 2 },
    ],
    games: [],
    ...over,
  };
}

function entry(over: Partial<PlayerEntry> = {}): PlayerEntry {
  return {
    slug: "faker",
    player: {
      id: "player-1",
      handle: "Faker",
      fullName: "Lee Sang-hyeok",
      image: "https://static.lolesports.com/players/faker.png",
      role: "mid",
    },
    team: team(),
    ...over,
  };
}

describe("buildJsonLd — match", () => {
  it("describes a series as a SportsEvent with both competitors", () => {
    const data = buildJsonLd({ kind: "match", match: match(), startTime: null });

    expect(data).toMatchObject({
      "@context": "https://schema.org",
      "@type": "SportsEvent",
      name: "T1 vs Gen.G — LCK",
      url: `${BASE}/esports/matches/110853167128207000`,
      sport: "League of Legends",
    });
    expect(data?.competitor).toHaveLength(2);
  });

  it("carries the kickoff only when the schedule resolved one", () => {
    const withTime = buildJsonLd({
      kind: "match",
      match: match(),
      startTime: "2026-08-16T09:00:00Z",
    });
    const without = buildJsonLd({ kind: "match", match: match(), startTime: null });

    expect(withTime?.startDate).toBe("2026-08-16T09:00:00Z");
    // An invented date is worse than a missing one — the key is absent, not empty.
    expect(without).not.toHaveProperty("startDate");
  });

  it("points at the league page as the superEvent when the league has a slug", () => {
    expect(buildJsonLd({ kind: "match", match: match(), startTime: null })).toMatchObject({
      superEvent: { "@type": "SportsEvent", url: `${BASE}/esports/leagues/lck` },
    });

    const noSlug = buildJsonLd({
      kind: "match",
      match: match({ league: { id: null, slug: null, name: "LCK", image: null } }),
      startTime: null,
    });
    expect(noSlug).not.toHaveProperty("superEvent");
  });

  it("names an undecided side TBD rather than dropping it", () => {
    const data = buildJsonLd({
      kind: "match",
      match: match({ teams: [{ id: "a", name: "T1", code: "T1", image: null, gameWins: 0 }] }),
      startTime: null,
    });
    expect(data?.name).toBe("T1 vs TBD — LCK");
  });
});

describe("buildJsonLd — team", () => {
  it("lists the roster as members linking to player pages", () => {
    const data = buildJsonLd({ kind: "team", team: team(), roster: [entry()] });

    expect(data).toMatchObject({
      "@type": "SportsTeam",
      name: "T1",
      alternateName: "T1",
      url: `${BASE}/esports/teams/t1`,
      memberOf: { "@type": "SportsOrganization", name: "LCK" },
    });
    expect(data?.member).toEqual([
      { "@type": "Person", name: "Faker", url: `${BASE}/esports/players/faker` },
    ]);
  });

  it("omits member and memberOf rather than emitting empty ones", () => {
    const data = buildJsonLd({ kind: "team", team: team({ league: null }), roster: [] });

    expect(data).not.toHaveProperty("member");
    expect(data).not.toHaveProperty("memberOf");
  });
});

describe("buildJsonLd — player", () => {
  it("describes a player as a Person on their team", () => {
    expect(buildJsonLd({ kind: "player", entry: entry() })).toMatchObject({
      "@type": "Person",
      name: "Faker",
      alternateName: "Lee Sang-hyeok",
      jobTitle: "Mid laner",
      url: `${BASE}/esports/players/faker`,
      memberOf: { "@type": "SportsTeam", name: "T1", url: `${BASE}/esports/teams/t1` },
    });
  });

  it("drops jobTitle for staff and unassigned substitutes", () => {
    const data = buildJsonLd({
      kind: "player",
      entry: entry({
        player: { id: "p", handle: "Coach", fullName: null, image: null, role: null },
      }),
    });

    expect(data).not.toHaveProperty("jobTitle");
    expect(data).not.toHaveProperty("alternateName");
  });
});

describe("buildJsonLd — list", () => {
  it("numbers entries from one and resolves relative hrefs", () => {
    const data = buildJsonLd({
      kind: "list",
      name: "Standings",
      items: [{ name: "T1", href: "/esports/teams/t1" }, { name: "TBD" }],
    });

    expect(data).toMatchObject({ "@type": "ItemList", name: "Standings" });
    expect(data?.itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "T1", url: `${BASE}/esports/teams/t1` },
      { "@type": "ListItem", position: 2, name: "TBD" },
    ]);
  });

  it("returns null for an empty list so the page emits no markup", () => {
    expect(buildJsonLd({ kind: "list", name: "Standings", items: [] })).toBeNull();
  });
});
