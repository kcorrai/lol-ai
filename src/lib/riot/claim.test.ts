import { describe, expect, it } from "vitest";
import { claimQuery, isAlreadyConnected, parseClaim } from "@/lib/riot/claim";

const TARGET = { region: "tr1", gameName: "kaanproak0", tagLine: "TR1" };

describe("claimQuery / parseClaim", () => {
  it("survives a round trip", () => {
    expect(parseClaim(new URLSearchParams(claimQuery(TARGET)))).toEqual(TARGET);
  });

  it("survives a Riot ID containing characters a packed separator would break", () => {
    const awkward = { region: "euw1", gameName: "the: real #1 guy", tagLine: "EUW" };

    expect(parseClaim(new URLSearchParams(claimQuery(awkward)))).toEqual(awkward);
  });

  it("lowercases the platform but leaves the name's casing alone", () => {
    const parsed = parseClaim(new URLSearchParams(claimQuery({ ...TARGET, region: "TR1" })));

    expect(parsed).toEqual({ region: "tr1", gameName: "kaanproak0", tagLine: "TR1" });
  });

  it("is null unless all three parts are present", () => {
    expect(parseClaim(new URLSearchParams("claimRegion=tr1&claimName=x"))).toBeNull();
    expect(parseClaim(new URLSearchParams("claimName=x&claimTag=y"))).toBeNull();
    expect(parseClaim(new URLSearchParams("claimRegion=tr1&claimName=+&claimTag=y"))).toBeNull();
    expect(parseClaim(new URLSearchParams(""))).toBeNull();
    expect(parseClaim(null)).toBeNull();
  });

  it("ignores an unrelated query string", () => {
    expect(parseClaim(new URLSearchParams("ref=summoner&registered=1"))).toBeNull();
  });
});

describe("isAlreadyConnected", () => {
  const connected = [{ gameName: "kaanproak0", tagLine: "TR1", region: "tr1" }];

  it("matches regardless of casing, because Riot IDs are case-insensitive", () => {
    expect(isAlreadyConnected({ ...TARGET, gameName: "KaanProAk0" }, connected)).toBe(true);
  });

  it("does not match the same name on another platform", () => {
    expect(isAlreadyConnected({ ...TARGET, region: "euw1" }, connected)).toBe(false);
  });

  it("does not match a different tag", () => {
    expect(isAlreadyConnected({ ...TARGET, tagLine: "EUW" }, connected)).toBe(false);
  });

  it("is false when nothing is connected", () => {
    expect(isAlreadyConnected(TARGET, [])).toBe(false);
  });
});
