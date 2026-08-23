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

// Everything below was already arriving on every poll and being discarded. These assert
// against Riot's own sample so the fields are read as the client actually spells them,
// not as this code wishes it did.
describe("the fields the client sends that the HUD had been dropping", () => {
  const data = allGameDataSchema.parse(sample);
  const player = data.allPlayers[0];

  it("reads both summoner spells for every player, not just the active one", () => {
    expect(player?.summonerSpells?.summonerSpellOne.displayName).toBe("Flash");
    expect(player?.summonerSpells?.summonerSpellTwo.displayName).toBe("Ignite");
  });

  it("reads the keystone and both trees for every player", () => {
    expect(player?.runes?.keystone.displayName).toBe("Electrocute");
    expect(player?.runes?.keystone.id).toBe(8112);
    expect(player?.runes?.primaryRuneTree.displayName).toBe("Domination");
    expect(player?.runes?.secondaryRuneTree.displayName).toBe("Sorcery");
  });

  it("accepts the empty inventory every player has at the gates", () => {
    expect(player?.items).toEqual([]);
  });

  it("reads an inventory once there is one", () => {
    const parsed = playerSchema.parse({
      ...sample.allPlayers[0],
      items: [{ itemID: 3153, slot: 0, count: 1, displayName: "Blade of the Ruined King" }],
    });
    expect(parsed.items?.[0]?.itemID).toBe(3153);
    expect(parsed.items?.[0]?.slot).toBe(0);
  });

  it("reads the active player's champion stats and ability ranks", () => {
    expect(data.activePlayer.championStats?.maxHealth).toBeTypeOf("number");
    expect(data.activePlayer.abilities?.Q).toBeDefined();
    expect(data.activePlayer.abilities?.R).toBeDefined();
  });

  it("reads the active player's full rune page", () => {
    expect(data.activePlayer.fullRunes?.keystone?.displayName).toBe("Electrocute");
    expect(data.activePlayer.fullRunes?.statRunes?.length).toBeGreaterThan(0);
  });

  it("still parses a player from a client that sends none of them", () => {
    const { items: _i, runes: _r, summonerSpells: _s, ...bare } = sample.allPlayers[0];
    expect(playerSchema.safeParse(bare).success).toBe(true);
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
