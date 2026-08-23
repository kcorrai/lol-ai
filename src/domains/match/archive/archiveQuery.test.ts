import { describe, it, expect } from "vitest";
import {
  countActiveFacets,
  EMPTY_FILTERS,
  filtersToSearchParams,
  isEmptyFilters,
  searchParamsToFilters,
} from "./archiveQuery";
import { parseArchiveFilters } from "@/domains/match/services/matchArchiveFilters";
import type { ArchiveFilters } from "@/domains/match/services/matchArchiveFilters";

const FULL: ArchiveFilters = {
  champions: ["Ahri", "Zed"],
  positions: ["MIDDLE"],
  queueTypes: ["RANKED_SOLO_5x5"],
  result: "loss",
  from: "2026-01-01T00:00:00.000Z",
  to: "2026-08-19T23:59:59.999Z",
  patch: "15.14",
  playerPuuid: "puuid-of-a-duo",
  playerSide: "with",
  minKda: 2.5,
  minCsPerMinute: 6.4,
  minVisionScore: 20,
  minKills: 5,
  maxDeaths: 4,
  minDuration: 15,
  maxDuration: 25,
};

describe("filtersToSearchParams / searchParamsToFilters", () => {
  it("round-trips every facet", () => {
    expect(searchParamsToFilters(filtersToSearchParams(FULL))).toEqual(FULL);
  });

  it("writes nothing for an empty search", () => {
    expect(filtersToSearchParams(EMPTY_FILTERS).toString()).toBe("");
  });

  it("omits the default side, and the side of a player nobody named", () => {
    expect(filtersToSearchParams({ ...FULL, playerSide: "either" }).get("playerSide")).toBeNull();
    // A side without a player qualifies nobody, so neither key is written.
    const orphaned = filtersToSearchParams({ playerSide: "against" });
    expect(orphaned.get("playerSide")).toBeNull();
    expect(orphaned.get("playerPuuid")).toBeNull();
  });

  it("drops emptied lists rather than writing an empty value", () => {
    const params = filtersToSearchParams({ ...EMPTY_FILTERS, champions: [], positions: [] });
    expect(params.toString()).toBe("");
  });

  it("keeps a zero threshold, which is a real filter and not an absent one", () => {
    const params = filtersToSearchParams({ ...EMPTY_FILTERS, maxDeaths: 0 });
    expect(params.get("maxDeaths")).toBe("0");
    expect(searchParamsToFilters(params).maxDeaths).toBe(0);
  });
});

describe("searchParamsToFilters tolerance", () => {
  it("accepts repeated keys as well as comma-joined ones", () => {
    const repeated = new URLSearchParams("champions=Ahri&champions=Zed");
    const joined = new URLSearchParams("champions=Ahri,Zed");
    expect(searchParamsToFilters(repeated).champions).toEqual(["Ahri", "Zed"]);
    expect(searchParamsToFilters(joined).champions).toEqual(["Ahri", "Zed"]);
  });

  it("de-duplicates a list rather than sending the same value twice", () => {
    expect(searchParamsToFilters(new URLSearchParams("champions=Ahri,Ahri")).champions).toEqual([
      "Ahri",
    ]);
  });

  it("drops facets it cannot read instead of throwing", () => {
    const hostile = new URLSearchParams(
      "positions=MIDDLE,NOT_A_ROLE&result=maybe&minKda=abc&patch=&playerSide=with"
    );
    const filters = searchParamsToFilters(hostile);
    expect(filters.positions).toEqual(["MIDDLE"]);
    expect(filters.result).toBeUndefined();
    expect(filters.minKda).toBeUndefined();
    expect(filters.patch).toBeUndefined();
    // The side is dropped with the player it had none of.
    expect(filters.playerSide).toBe("either");
  });

  it("passes an unknown queue through, so a widened QueueType is not deleted from a shared link", () => {
    // LA-37 widens the enum. A client-side allowlist would silently drop tomorrow's queues.
    expect(
      searchParamsToFilters(new URLSearchParams("queueTypes=SOME_NEW_QUEUE")).queueTypes
    ).toEqual(["SOME_NEW_QUEUE"]);
  });
});

describe("countActiveFacets", () => {
  it("counts nothing for an empty search", () => {
    expect(countActiveFacets(EMPTY_FILTERS)).toBe(0);
    expect(isEmptyFilters(EMPTY_FILTERS)).toBe(true);
  });

  it("bills a named player and their side as one facet, not two", () => {
    expect(countActiveFacets({ playerPuuid: "p", playerSide: "against" })).toBe(1);
  });

  it("counts a list as one facet however many values it holds", () => {
    expect(countActiveFacets({ ...EMPTY_FILTERS, champions: ["Ahri", "Zed", "Sett"] })).toBe(1);
    expect(isEmptyFilters({ ...EMPTY_FILTERS, champions: ["Ahri"] })).toBe(false);
  });
});

// The whole reason this module exists is that the server's schema cannot be imported into the
// browser. That makes drift between the two the failure worth testing for: a URL this file writes
// has to be one the server's own parser reads back unchanged.
describe("agreement with the server's parser", () => {
  it("produces a query string parseArchiveFilters reads back identically", () => {
    expect(parseArchiveFilters(filtersToSearchParams(FULL))).toEqual(FULL);
  });

  it("agrees on a search with only some facets set", () => {
    const partial: ArchiveFilters = {
      champions: ["Ahri"],
      result: "win",
      maxDuration: 25,
      playerSide: "either",
    };
    expect(parseArchiveFilters(filtersToSearchParams(partial))).toEqual(partial);
  });

  it("agrees that an empty search is an empty search", () => {
    expect(parseArchiveFilters(filtersToSearchParams(EMPTY_FILTERS))).toEqual(EMPTY_FILTERS);
  });
});
