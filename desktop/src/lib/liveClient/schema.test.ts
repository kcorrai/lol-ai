import { describe, expect, it } from "vitest";
import sample from "./__fixtures__/allgamedata.sample.json";
import { allGameDataSchema, displayNameOf, playerSchema } from "./schema";

// The fixture is Riot's own published sample response, downloaded verbatim from
// static.developer.riotgames.com. It is the closest thing to a contract we have, and it
// is committed so a Riot-side change shows up as a failing test rather than a blank HUD.
describe("allGameDataSchema", () => {
  it("parses Riot's published sample payload", () => {
    const result = allGameDataSchema.safeParse(sample);
    expect(result.success).toBe(true);
  });

  it("reads the fields the HUD actually renders", () => {
    const data = allGameDataSchema.parse(sample);
    expect(data.gameData.gameMode).toBe("CLASSIC");
    expect(data.gameData.mapNumber).toBe(11);
    expect(data.allPlayers[0]?.team).toBe("ORDER");
    expect(data.allPlayers[0]?.scores.creepScore).toBe(0);
    expect(data.events.Events[0]?.EventName).toBe("GameStart");
  });

  it("rejects a payload missing a field the HUD depends on", () => {
    const broken = { ...sample, gameData: { ...sample.gameData, gameTime: "soon" } };
    expect(allGameDataSchema.safeParse(broken).success).toBe(false);
  });
});

describe("playerSchema", () => {
  const base = sample.allPlayers[0];

  it("keeps fields a future patch adds rather than failing", () => {
    const parsed = playerSchema.parse({ ...base, someFieldRiotAddedLater: 7 });
    expect(parsed["someFieldRiotAddedLater"]).toBe(7);
  });

  it("accepts the empty position the client sends when it has no lane", () => {
    expect(playerSchema.parse({ ...base, position: "" }).position).toBe("");
  });

  it("accepts a player with no position field at all", () => {
    const { position: _dropped, ...withoutPosition } = base;
    expect(playerSchema.safeParse(withoutPosition).success).toBe(true);
  });
});

describe("displayNameOf", () => {
  it("prefers the Riot ID", () => {
    expect(displayNameOf({ riotId: "Kaan#TR1", summonerName: "Kaan" })).toBe("Kaan#TR1");
  });

  it("falls back to the summoner name older clients send", () => {
    expect(displayNameOf({ summonerName: "Kaan" })).toBe("Kaan");
  });

  it("returns a blank rather than undefined when neither is present", () => {
    expect(displayNameOf({})).toBe("");
  });
});
