import { describe, expect, it } from "vitest";
import type { Prisma } from "@prisma/client";
import {
  archiveFilterSchema,
  buildArchiveWhere,
  isEmptyFilter,
  parseArchiveFilters,
  POSITIONS,
  QUEUE_TYPES,
  type ArchiveFilters,
} from "@/domains/match/services/matchArchiveFilters";

const PUUID = "puuid-me";

function filters(overrides: Record<string, unknown> = {}): ArchiveFilters {
  return archiveFilterSchema.parse(overrides);
}

/** The nested `match` clause, narrowed so the assertions read as the filter they came from. */
function matchClause(where: Prisma.MatchParticipantWhereInput): Prisma.MatchWhereInput {
  return (where.match ?? {}) as Prisma.MatchWhereInput;
}

describe("facet vocabularies", () => {
  it("come from Prisma's enums, so a queue added to the schema is searchable without edits here", () => {
    // LA-37 widens QueueType so no game is dropped on ingest; this list must follow it by itself.
    expect(QUEUE_TYPES).toContain("RANKED_SOLO_5x5");
    expect(QUEUE_TYPES).toContain("ARAM");
    expect(POSITIONS).toEqual(["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"]);
  });
});

describe("parseArchiveFilters", () => {
  it("reads repeated and comma-joined keys as one list", () => {
    const params = new URLSearchParams("champions=Ahri&champions=Zed,Yasuo&positions=MIDDLE");
    const parsed = parseArchiveFilters(params);
    expect(parsed.champions).toEqual(["Ahri", "Zed", "Yasuo"]);
    expect(parsed.positions).toEqual(["MIDDLE"]);
  });

  it("coerces numeric thresholds off the query string", () => {
    const parsed = parseArchiveFilters(
      new URLSearchParams("minKda=3.5&maxDeaths=4&minDuration=25")
    );
    expect(parsed.minKda).toBe(3.5);
    expect(parsed.maxDeaths).toBe(4);
    expect(parsed.minDuration).toBe(25);
  });

  it("defaults the co-player side to either", () => {
    expect(parseArchiveFilters(new URLSearchParams("playerPuuid=abc")).playerSide).toBe("either");
  });

  it("leaves absent facets undefined rather than inventing empty lists", () => {
    const parsed = parseArchiveFilters(new URLSearchParams(""));
    expect(parsed.champions).toBeUndefined();
    expect(parsed.result).toBeUndefined();
    expect(isEmptyFilter(parsed)).toBe(true);
  });

  it("rejects a threshold outside its range instead of silently clamping", () => {
    expect(() => parseArchiveFilters(new URLSearchParams("minCsPerMinute=99"))).toThrow();
    expect(() => parseArchiveFilters(new URLSearchParams("result=draw"))).toThrow();
  });
});

describe("buildArchiveWhere — core facets", () => {
  it("always scopes to the searching player", () => {
    expect(buildArchiveWhere(PUUID, filters()).puuid).toBe(PUUID);
  });

  it("maps champions, positions and result onto participant columns", () => {
    const where = buildArchiveWhere(
      PUUID,
      filters({ champions: ["Ahri"], positions: ["MIDDLE"], result: "loss" })
    );
    expect(where.championName).toEqual({ in: ["Ahri"] });
    expect(where.position).toEqual({ in: ["MIDDLE"] });
    expect(where.won).toBe(false);
  });

  it("matches a patch as a prefix, so one filter catches every hotfix", () => {
    expect(matchClause(buildArchiveWhere(PUUID, filters({ patch: "15.14" }))).gameVersion).toEqual({
      startsWith: "15.14",
    });
  });

  it("converts the duration filter from minutes to the stored seconds", () => {
    const clause = matchClause(
      buildArchiveWhere(PUUID, filters({ minDuration: 25, maxDuration: 40 }))
    );
    expect(clause.gameDuration).toEqual({ gte: 1500, lte: 2400 });
  });

  it("omits the match clause entirely when no match-level facet is set", () => {
    expect(buildArchiveWhere(PUUID, filters({ champions: ["Ahri"] })).match).toBeUndefined();
  });

  it("keeps a one-sided date range one-sided", () => {
    const clause = matchClause(buildArchiveWhere(PUUID, filters({ from: "2026-01-01T00:00:00Z" })));
    expect(clause.gameStart).toEqual({ gte: new Date("2026-01-01T00:00:00Z") });
  });
});

describe("buildArchiveWhere — played with / against", () => {
  // Two games: in one the other player was on our side, in the other they were not.
  const coPlayer = [
    { matchId: "m-together", teamId: 100 },
    { matchId: "m-enemy", teamId: 200 },
  ];

  it("keeps only our own side of the game for `with`", () => {
    const where = buildArchiveWhere(PUUID, filters({ playerPuuid: "them", playerSide: "with" }), {
      coPlayer,
    });
    expect(where.AND).toEqual([
      {
        OR: [
          { matchId: { in: ["m-together"] }, teamId: 100 },
          { matchId: { in: ["m-enemy"] }, teamId: 200 },
        ],
      },
    ]);
  });

  it("inverts the team for `against`", () => {
    const where = buildArchiveWhere(
      PUUID,
      filters({ playerPuuid: "them", playerSide: "against" }),
      {
        coPlayer,
      }
    );
    expect(where.AND).toEqual([
      {
        OR: [
          { matchId: { in: ["m-together"] }, teamId: { not: 100 } },
          { matchId: { in: ["m-enemy"] }, teamId: { not: 200 } },
        ],
      },
    ]);
  });

  it("ignores the team entirely for `either`", () => {
    const where = buildArchiveWhere(PUUID, filters({ playerPuuid: "them" }), { coPlayer });
    expect(where.AND).toEqual([{ matchId: { in: ["m-together", "m-enemy"] } }]);
  });

  it("matches nothing when the two players share no game — not everything", () => {
    // The trap: an empty resolution dropped as "no filter" would return the player's whole
    // archive for a search that should be empty.
    const where = buildArchiveWhere(PUUID, filters({ playerPuuid: "stranger" }), { coPlayer: [] });
    expect(where.AND).toEqual([{ id: { in: [] } }]);
  });
});

describe("buildArchiveWhere — KDA threshold", () => {
  it("narrows to the ids Postgres computed, since KDA is not a column", () => {
    const where = buildArchiveWhere(PUUID, filters({ minKda: 3 }), {
      kdaParticipantIds: ["p1", "p2"],
    });
    expect(where.AND).toEqual([{ id: { in: ["p1", "p2"] } }]);
  });

  it("matches nothing when no game cleared the threshold", () => {
    const where = buildArchiveWhere(PUUID, filters({ minKda: 99 }), { kdaParticipantIds: [] });
    expect(where.AND).toEqual([{ id: { in: [] } }]);
  });

  it("combines with the co-player facet rather than replacing it", () => {
    const where = buildArchiveWhere(PUUID, filters({ playerPuuid: "them", minKda: 3 }), {
      coPlayer: [{ matchId: "m1", teamId: 100 }],
      kdaParticipantIds: ["p1"],
    });
    expect(where.AND).toHaveLength(2);
  });
});

describe("isEmptyFilter", () => {
  it("treats the default co-player side as no filter at all", () => {
    expect(isEmptyFilter(filters({ playerSide: "either" }))).toBe(true);
  });

  it("sees a single facet", () => {
    expect(isEmptyFilter(filters({ result: "win" }))).toBe(false);
    expect(isEmptyFilter(filters({ minKda: 1 }))).toBe(false);
  });
});
