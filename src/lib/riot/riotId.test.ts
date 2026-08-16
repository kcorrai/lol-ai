import { describe, it, expect } from "vitest";
import { splitRiotId } from "./riotId";

describe("splitRiotId", () => {
  it("splits a complete Riot ID and keeps the typed casing", () => {
    expect(splitRiotId("Hide on bush#KR1")).toEqual({
      gameName: "Hide on bush",
      tagLine: "KR1",
    });
  });

  it("splits on the first hash only", () => {
    // Tags cannot contain a hash, so a second one is part of the name.
    expect(splitRiotId("we#ird#TAG")).toEqual({ gameName: "we", tagLine: "ird#TAG" });
  });

  it("strips the directional marks some browsers inject", () => {
    expect(splitRiotId("⁦Faker⁩#KR1")).toEqual({ gameName: "Faker", tagLine: "KR1" });
  });

  it("refuses anything that is not a whole Riot ID", () => {
    expect(splitRiotId("Faker")).toBeNull();
    expect(splitRiotId("Faker#")).toBeNull();
    expect(splitRiotId("#KR1")).toBeNull();
    expect(splitRiotId("   ")).toBeNull();
  });
});
