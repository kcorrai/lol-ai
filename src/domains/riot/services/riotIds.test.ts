import { describe, expect, it } from "vitest";
import { extractRiotIds, parseIdsParam, toIdsParam, MAX_LOBBY_SIZE } from "./riotIds";

const names = (input: string) => extractRiotIds(input).map((id) => id.full);

describe("extractRiotIds", () => {
  it("reads a plain comma-separated paste", () => {
    expect(names("Faker#KR1, kaanproak0#TR1")).toEqual(["Faker#KR1", "kaanproak0#TR1"]);
  });

  it("reads one per line", () => {
    expect(names("Faker#KR1\nkaanproak0#TR1\n")).toEqual(["Faker#KR1", "kaanproak0#TR1"]);
  });

  /** The champion-select chat wraps IDs in prose, and the shape differs per client. */
  it("pulls IDs out of surrounding chatter", () => {
    const chat = `Faker#KR1 joined the lobby
      kaanproak0#TR1 joined the lobby
      Hide on bush#KR2 has selected a champion`;

    expect(names(chat)).toEqual(["Faker#KR1", "kaanproak0#TR1", "Hide on bush#KR2"]);
  });

  it("tolerates spaces around the hash, which some clients paste", () => {
    expect(names("Faker # KR1")).toEqual(["Faker#KR1"]);
  });

  /**
   * The reason the pattern is written against Unicode properties rather than an ASCII range:
   * dropping these silently loses exactly the players a Turkish or Korean lobby is full of.
   */
  it("keeps non-Latin and accented names", () => {
    expect(names("Öykü Şen#TR1, 페이커#KR1, Пантеон#RU1")).toEqual([
      "Öykü Şen#TR1",
      "페이커#KR1",
      "Пантеон#RU1",
    ]);
  });

  it("keeps names with spaces, dots and underscores", () => {
    expect(names("Hide on bush#KR1, a.b_c#EUW")).toEqual(["Hide on bush#KR1", "a.b_c#EUW"]);
  });

  it("upper-cases the tag but leaves the name's case alone", () => {
    const [id] = extractRiotIds("kaanProAk0#tr1");

    expect(id).toMatchObject({ gameName: "kaanProAk0", tagLine: "TR1", full: "kaanProAk0#TR1" });
  });

  it("de-duplicates case-insensitively, so pasting a lobby twice scouts it once", () => {
    expect(names("Faker#KR1, faker#kr1, FAKER#KR1")).toEqual(["Faker#KR1"]);
  });

  it("keeps the order they were pasted in", () => {
    expect(names("ccc#AAA\naaa#BBB\nbbb#CCC")).toEqual(["ccc#AAA", "aaa#BBB", "bbb#CCC"]);
  });

  /** A paste is user input and its cost is ours; ten is a full lobby and the cap. */
  it("stops at a full lobby however much is pasted", () => {
    const many = Array.from({ length: 40 }, (_, i) => `player${i}#EUW`).join("\n");

    expect(extractRiotIds(many)).toHaveLength(MAX_LOBBY_SIZE);
  });

  it("honours a smaller explicit limit", () => {
    expect(extractRiotIds("aaa#AAA, bbb#BBB, ccc#CCC", 2)).toHaveLength(2);
  });

  it("finds nothing in text that has no Riot ID in it", () => {
    expect(names("gl hf everyone, good luck")).toEqual([]);
    expect(names("")).toEqual([]);
  });

  /** Truncating to the first five would invent an ID we then spend a Riot call failing to find. */
  it("rejects a tag that runs on past five characters rather than truncating it", () => {
    expect(names("Someone#TOOLONGTAG")).toEqual([]);
  });

  it("rejects a name shorter than Riot allows", () => {
    expect(names("ab#EUW")).toEqual([]);
  });
});

describe("parseIdsParam", () => {
  it("reads the comma-separated query parameter", () => {
    expect(parseIdsParam("Faker#KR1,kaanproak0#TR1").map((i) => i.full)).toEqual([
      "Faker#KR1",
      "kaanproak0#TR1",
    ]);
  });

  it("is empty for a missing parameter", () => {
    expect(parseIdsParam(undefined)).toEqual([]);
    expect(parseIdsParam("")).toEqual([]);
  });

  /** A URL must not be able to accept an ID the paste box would have thrown away. */
  it("applies the same cap a paste does", () => {
    const many = Array.from({ length: 40 }, (_, i) => `player${i}#EUW`).join(",");

    expect(parseIdsParam(many)).toHaveLength(MAX_LOBBY_SIZE);
  });

  it("round-trips through toIdsParam", () => {
    const ids = parseIdsParam("Faker#KR1,Hide on bush#KR2");

    expect(parseIdsParam(toIdsParam(ids))).toEqual(ids);
  });
});
