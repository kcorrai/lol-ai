import { describe, it, expect } from "vitest";
import { aggregateProBuilds, MIN_BUILD_ITEM_GOLD } from "./proBuild";
import type { BuildItemCatalogue } from "./proBuild";
import type { GameParticipant, GameTeamStats, SampledGame } from "./types";

// Two legendaries, a pair of boots, a trinket, a potion, and a component that
// costs plenty but builds into something else.
const GOLD: BuildItemCatalogue = new Map([
  [6631, { gold: 3300, finished: true, consumable: false }],
  [3047, { gold: 1200, finished: true, consumable: false }],
  [3153, { gold: 3200, finished: true, consumable: false }],
  [3364, { gold: 0, finished: true, consumable: false }],
  [2003, { gold: 50, finished: true, consumable: true }],
  [1038, { gold: 1300, finished: false, consumable: false }],
  // An elixir clears the gold bar and builds into nothing; only the consumable
  // flag keeps it out of a build list.
  [2140, { gold: 500, finished: true, consumable: true }],
]);

interface PlayerSpec {
  champion: string;
  handle: string;
  items?: number[];
  perks?: { primaryStyle: number; secondaryStyle: number; perks: number[] };
  abilities?: string[];
}

function participant(spec: PlayerSpec, participantId: number): GameParticipant {
  return {
    participantId,
    playerId: null,
    handle: spec.handle,
    fullHandle: `T1 ${spec.handle}`,
    championId: spec.champion,
    role: null,
    level: 18,
    kills: 3,
    deaths: 1,
    assists: 7,
    creepScore: 250,
    gold: 15000,
    killParticipation: null,
    damageShare: null,
    wardsPlaced: null,
    wardsDestroyed: null,
    finalStats: null,
    items: spec.items ?? [],
    runes: spec.perks ?? null,
    abilities: spec.abilities ?? [],
  };
}

function side(
  sideName: "blue" | "red",
  players: PlayerSpec[],
  won: boolean
): GameTeamStats {
  return {
    side: sideName,
    teamId: `team-${sideName}`,
    gold: 0,
    kills: 0,
    towers: won ? 9 : 2,
    inhibitors: won ? 2 : 0,
    barons: 0,
    dragons: [],
    participants: players.map((spec, index) =>
      participant(spec, sideName === "blue" ? index + 1 : index + 6)
    ),
  };
}

function game(options: {
  blue: PlayerSpec[];
  red?: PlayerSpec[];
  blueWins?: boolean;
  at?: string;
  matchId?: string;
  gameNumber?: number;
}): SampledGame {
  const blueWins = options.blueWins ?? true;
  return {
    matchId: options.matchId ?? "m-1",
    gameNumber: options.gameNumber ?? 1,
    leagueName: "LCK",
    blueTeamName: "T1",
    redTeamName: "Gen.G",
    stats: {
      gameId: `g-${options.matchId ?? "m-1"}-${options.gameNumber ?? 1}`,
      patch: "15.20",
      finished: true,
      firstFrameAt: "2026-08-16T09:30:00Z",
      lastFrameAt: options.at ?? "2026-08-16T10:00:00Z",
      durationSeconds: 1800,
      blue: side("blue", options.blue, blueWins),
      red: side("red", options.red ?? [{ champion: "Gnar", handle: "Doran" }], !blueWins),
    },
  };
}

const AZIR = { champion: "Azir", handle: "Faker" };

describe("aggregateProBuilds — items", () => {
  it("keeps only what cost enough to be part of a build", () => {
    const builds = aggregateProBuilds(
      [game({ blue: [{ ...AZIR, items: [6631, 3047, 3364, 2003] }] })],
      GOLD
    );

    expect(builds.Azir.items.map((item) => item.itemId)).toEqual([3047, 6631]);
    expect(GOLD.get(3364)?.gold).toBeLessThan(MIN_BUILD_ITEM_GOLD);
  });

  it("drops a component someone happened to be holding when the game ended", () => {
    // A B. F. Sword costs 1300 — well over the gold bar — and is still not part
    // of how anyone builds the champion.
    const builds = aggregateProBuilds(
      [game({ blue: [{ ...AZIR, items: [6631, 1038] }] })],
      GOLD
    );

    expect(builds.Azir.items.map((item) => item.itemId)).toEqual([6631]);
  });

  it("drops an elixir, which costs enough and builds into nothing", () => {
    const builds = aggregateProBuilds(
      [game({ blue: [{ ...AZIR, items: [6631, 2140] }] })],
      GOLD
    );

    expect(builds.Azir.items.map((item) => item.itemId)).toEqual([6631]);
  });

  it("drops an item the catalogue has never heard of", () => {
    const builds = aggregateProBuilds([game({ blue: [{ ...AZIR, items: [999999] }] })], GOLD);
    expect(builds.Azir.items).toEqual([]);
  });

  it("leaves out a one-off that only one game in a large sample finished on", () => {
    const many = Array.from({ length: 10 }, (_, index) =>
      game({ blue: [{ ...AZIR, items: [6631] }], matchId: `m-${index}` })
    );
    const oddity = game({ blue: [{ ...AZIR, items: [6631, 3153] }], matchId: "m-odd" });

    const builds = aggregateProBuilds([...many, oddity], GOLD);
    // 1 of 11 games is below the share a build item has to clear.
    expect(builds.Azir.items.map((item) => item.itemId)).toEqual([6631]);
  });

  it("counts an item once per game, not once per copy held", () => {
    const builds = aggregateProBuilds(
      [game({ blue: [{ ...AZIR, items: [6631, 6631, 6631] }] })],
      GOLD
    );

    expect(builds.Azir.items).toEqual([{ itemId: 6631, games: 1 }]);
  });

  it("orders items by how often they were finished", () => {
    const builds = aggregateProBuilds(
      [
        game({ blue: [{ ...AZIR, items: [6631, 3153] }] }),
        game({ blue: [{ ...AZIR, items: [6631] }], matchId: "m-2" }),
      ],
      GOLD
    );

    expect(builds.Azir.items).toEqual([
      { itemId: 6631, games: 2 },
      { itemId: 3153, games: 1 },
    ]);
  });
});

describe("aggregateProBuilds — runes", () => {
  const page = { primaryStyle: 8200, secondaryStyle: 8300, perks: [8230, 8275] };
  const other = { primaryStyle: 8100, secondaryStyle: 8300, perks: [8112, 8143] };

  it("groups identical pages and counts their record", () => {
    const builds = aggregateProBuilds(
      [
        game({ blue: [{ ...AZIR, perks: page }] }),
        game({ blue: [{ ...AZIR, perks: page }], matchId: "m-2", blueWins: false }),
        game({ blue: [{ ...AZIR, perks: other }], matchId: "m-3" }),
      ],
      GOLD
    );

    expect(builds.Azir.runes[0]).toMatchObject({ primaryStyle: 8200, games: 2, wins: 1 });
    expect(builds.Azir.runes[1]).toMatchObject({ primaryStyle: 8100, games: 1, wins: 1 });
  });

  it("keeps one row per keystone rather than one per minor-rune variation", () => {
    // Same keystone and trees, different last shard — one setup, not two, and
    // rendering it twice would show a reader two identical-looking rows.
    const builds = aggregateProBuilds(
      [
        game({ blue: [{ ...AZIR, perks: { ...page, perks: [8230, 8275, 5008] } }] }),
        game({
          blue: [{ ...AZIR, perks: { ...page, perks: [8230, 8275, 5008] } }],
          matchId: "m-2",
        }),
        game({
          blue: [{ ...AZIR, perks: { ...page, perks: [8230, 8275, 5011] } }],
          matchId: "m-3",
        }),
      ],
      GOLD
    );

    expect(builds.Azir.runes).toHaveLength(1);
    expect(builds.Azir.runes[0].games).toBe(3);
    // The perks shown are the most common variant inside the group.
    expect(builds.Azir.runes[0].perks).toEqual([8230, 8275, 5008]);
  });

  it("separates two keystones from the same tree", () => {
    const builds = aggregateProBuilds(
      [
        game({ blue: [{ ...AZIR, perks: { ...page, perks: [8230, 8275] } }] }),
        game({ blue: [{ ...AZIR, perks: { ...page, perks: [8214, 8275] } }], matchId: "m-2" }),
      ],
      GOLD
    );

    expect(builds.Azir.runes).toHaveLength(2);
  });

  it("ignores a game the details feed published no page for", () => {
    const builds = aggregateProBuilds([game({ blue: [AZIR] })], GOLD);
    expect(builds.Azir.runes).toEqual([]);
  });
});

describe("aggregateProBuilds — skill order", () => {
  it("reports the order while the sample agrees and stops where it splits", () => {
    const builds = aggregateProBuilds(
      [
        game({ blue: [{ ...AZIR, abilities: ["Q", "W", "E", "Q"] }] }),
        game({ blue: [{ ...AZIR, abilities: ["Q", "W", "E", "W"] }], matchId: "m-2" }),
      ],
      GOLD
    );

    // Levels 1-3 are unanimous; level 4 is one apiece, which is below consensus.
    expect(builds.Azir.skillOrder).toEqual(["Q", "W", "E"]);
    expect(builds.Azir.skillOrderGames).toBe(2);
  });

  it("claims nothing when the feed published no abilities", () => {
    const builds = aggregateProBuilds([game({ blue: [AZIR] })], GOLD);
    expect(builds.Azir.skillOrder).toEqual([]);
    expect(builds.Azir.skillOrderGames).toBe(0);
  });
});

describe("aggregateProBuilds — players and games", () => {
  it("ranks the players who played it and keeps their record", () => {
    const builds = aggregateProBuilds(
      [
        game({ blue: [AZIR] }),
        game({ blue: [AZIR], matchId: "m-2", blueWins: false }),
        game({ blue: [{ champion: "Azir", handle: "Chovy" }], matchId: "m-3" }),
      ],
      GOLD
    );

    expect(builds.Azir.games).toBe(3);
    expect(builds.Azir.wins).toBe(2);
    expect(builds.Azir.topPlayers).toEqual([
      { handle: "Faker", teamName: "T1", games: 2, wins: 1 },
      { handle: "Chovy", teamName: "T1", games: 1, wins: 1 },
    ]);
  });

  it("lists recent games newest first, with the opponent and the result", () => {
    const builds = aggregateProBuilds(
      [
        game({ blue: [AZIR], at: "2026-08-10T10:00:00Z", matchId: "m-old" }),
        game({ blue: [AZIR], at: "2026-08-16T10:00:00Z", matchId: "m-new", blueWins: false }),
      ],
      GOLD
    );

    expect(builds.Azir.recentGames[0]).toMatchObject({
      matchId: "m-new",
      handle: "Faker",
      teamName: "T1",
      opponentName: "Gen.G",
      won: false,
    });
    expect(builds.Azir.recentGames[1].matchId).toBe("m-old");
  });

  it("names the right side for a champion played on red", () => {
    const builds = aggregateProBuilds(
      [game({ blue: [{ champion: "Gnar", handle: "Zeus" }], red: [AZIR], blueWins: false })],
      GOLD
    );

    expect(builds.Azir.recentGames[0]).toMatchObject({
      teamName: "Gen.G",
      opponentName: "T1",
      won: true,
    });
  });

  it("skips a game that never finished", () => {
    const unfinished = game({ blue: [AZIR], matchId: "m-2" });
    unfinished.stats.finished = false;

    expect(aggregateProBuilds([game({ blue: [AZIR] }), unfinished], GOLD).Azir.games).toBe(1);
  });
});
