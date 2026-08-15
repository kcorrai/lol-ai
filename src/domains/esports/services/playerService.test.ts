import { describe, it, expect } from "vitest";
import { buildPlayerIndex, playerSlug, championPool } from "./playerService";
import type { EsportsLeague, EsportsTeam, PlayerGame } from "@/domains/esports/types";

function league(name: string): EsportsLeague {
  return {
    id: `id-${name}`,
    slug: name.toLowerCase().replace(/\s+/g, "-"),
    name,
    region: "KOREA",
    image: null,
    displayStatus: "selected",
    displayPosition: 0,
  };
}

function team(code: string, leagueName: string, handles: string[]): EsportsTeam {
  return {
    id: `team-${code}`,
    slug: code.toLowerCase(),
    name: `${code} Esports`,
    code,
    image: null,
    backgroundImage: null,
    status: "active",
    league: { name: leagueName, region: "KOREA" },
    players: handles.map((handle, index) => ({
      id: `${code}-${handle}`,
      handle,
      fullName: null,
      image: null,
      role: index === 0 ? ("mid" as const) : null,
    })),
  };
}

// Ordered the way getLeagues returns them: most prominent first.
const LEAGUES = [league("LCK"), league("LCK Challengers"), league("LJL")];

describe("playerSlug", () => {
  it("lowercases, strips diacritics and collapses punctuation", () => {
    expect(playerSlug("Faker")).toBe("faker");
    expect(playerSlug("Céros")).toBe("ceros");
    expect(playerSlug("Mr. Bean_99")).toBe("mr-bean-99");
    expect(playerSlug("  Edge  ")).toBe("edge");
  });
});

describe("buildPlayerIndex", () => {
  it("gives a unique handle the plain slug", () => {
    const index = buildPlayerIndex([team("T1", "LCK", ["Faker"])], LEAGUES);
    expect(index.map((e) => e.slug)).toEqual(["faker"]);
  });

  it("gives the plain slug to the player in the more prominent league", () => {
    // The same person is listed by both the main roster and the academy team;
    // /esports/players/chovy must be the Gen.G page, not the Challengers one.
    const index = buildPlayerIndex(
      [team("GGA", "LCK Challengers", ["Chovy"]), team("GEN", "LCK", ["Chovy"])],
      LEAGUES
    );

    const plain = index.find((e) => e.slug === "chovy");
    expect(plain?.team.code).toBe("GEN");
    expect(index.map((e) => e.slug).sort()).toEqual(["chovy", "chovy-gga"]);
  });

  it("falls back to team code order when the leagues rank equally", () => {
    const index = buildPlayerIndex(
      [team("RPG", "LJL", ["Ramune"]), team("PGM", "LJL", ["Ramune"])],
      LEAGUES
    );
    expect(index.find((e) => e.slug === "ramune")?.team.code).toBe("PGM");
    expect(index.find((e) => e.slug === "ramune-rpg")).toBeDefined();
  });

  it("is stable regardless of the order teams arrive in", () => {
    const a = buildPlayerIndex(
      [team("GGA", "LCK Challengers", ["Chovy"]), team("GEN", "LCK", ["Chovy"])],
      LEAGUES
    );
    const b = buildPlayerIndex(
      [team("GEN", "LCK", ["Chovy"]), team("GGA", "LCK Challengers", ["Chovy"])],
      LEAGUES
    );
    expect(a.map((e) => `${e.slug}:${e.team.code}`)).toEqual(
      b.map((e) => `${e.slug}:${e.team.code}`)
    );
  });

  it("puts a player from an unknown league behind the ranked ones", () => {
    const index = buildPlayerIndex(
      [team("XXX", "Some Amateur Cup", ["Ramune"]), team("PGM", "LJL", ["Ramune"])],
      LEAGUES
    );
    expect(index.find((e) => e.slug === "ramune")?.team.code).toBe("PGM");
  });

  it("skips a handle that slugifies to nothing", () => {
    expect(buildPlayerIndex([team("T1", "LCK", ["???"])], LEAGUES)).toEqual([]);
  });
});

describe("championPool", () => {
  function game(championId: string, kills: number, deaths: number, assists: number): PlayerGame {
    return {
      matchId: "m1",
      gameId: `g-${championId}-${kills}`,
      gameNumber: 1,
      playerId: "p1",
      handle: "Faker",
      championId,
      kills,
      deaths,
      assists,
      creepScore: 250,
    };
  }

  it("aggregates games per champion, most played first", () => {
    const pool = championPool([
      game("Azir", 3, 1, 5),
      game("Ahri", 2, 2, 4),
      game("Azir", 1, 3, 7),
    ]);

    expect(pool.map((c) => [c.championId, c.games])).toEqual([
      ["Azir", 2],
      ["Ahri", 1],
    ]);
    expect(pool[0]).toMatchObject({ kills: 4, deaths: 4, assists: 12 });
  });

  it("breaks ties by champion name so the order never wobbles", () => {
    const pool = championPool([game("Zed", 1, 1, 1), game("Ahri", 1, 1, 1)]);
    expect(pool.map((c) => c.championId)).toEqual(["Ahri", "Zed"]);
  });

  it("returns nothing for a player with no recorded games", () => {
    expect(championPool([])).toEqual([]);
  });
});
