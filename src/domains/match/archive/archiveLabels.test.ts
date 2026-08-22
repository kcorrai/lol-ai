import { describe, it, expect } from "vitest";
import { Position } from "@prisma/client";
import { describeFilters, POSITIONS, positionLabel, queueLabel } from "./archiveLabels";
import { EMPTY_FILTERS } from "./archiveQuery";

describe("POSITIONS", () => {
  // The label map is `satisfies Record<Position, string>`, so this can only fail if the enum grows
  // — in which case the build fails first. It is here to say that out loud.
  it("covers every role the schema has", () => {
    expect(new Set(POSITIONS)).toEqual(new Set(Object.values(Position)));
  });
});

describe("queueLabel", () => {
  it("names the queues it knows", () => {
    expect(queueLabel("RANKED_SOLO_5x5")).toBe("Ranked Solo/Duo");
  });

  // LA-37 is widening QueueType. A queue this file has never heard of has to stay searchable and
  // readable rather than render as a screaming constant or vanish.
  it("humanises a queue it has never heard of", () => {
    expect(queueLabel("SWIFTPLAY_DRAFT")).toBe("Swiftplay Draft");
  });
});

describe("positionLabel", () => {
  it("uses the game's own words, not the schema's", () => {
    expect(positionLabel("UTILITY")).toBe("Support");
    expect(positionLabel("BOTTOM")).toBe("Bot");
  });

  it("falls back to the raw value rather than rendering nothing", () => {
    expect(positionLabel("INVENTED")).toBe("INVENTED");
  });
});

describe("describeFilters", () => {
  it("says nothing about an empty search", () => {
    expect(describeFilters(EMPTY_FILTERS)).toEqual([]);
  });

  it("describes each active facet once", () => {
    const parts = describeFilters({
      champions: ["Ahri"],
      positions: ["MIDDLE"],
      result: "loss",
      maxDuration: 25,
      playerSide: "either",
    });
    expect(parts).toContain("Ahri");
    expect(parts).toContain("Mid");
    expect(parts).toContain("Losses");
    expect(parts).toContain("Length ≤ 25 min");
  });

  it("names the other player when one is known, and hedges when not", () => {
    const withName = describeFilters({ playerPuuid: "p", playerSide: "with" }, "Kaan");
    expect(withName).toContain("With Kaan");
    expect(describeFilters({ playerPuuid: "p", playerSide: "against" })).toContain(
      "Against a player"
    );
  });
});
