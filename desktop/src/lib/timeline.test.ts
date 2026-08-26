import { describe, expect, it } from "vitest";
import { allGameDataSchema, type GameEvent, type LivePlayer } from "./liveClient/schema";
import sample from "./liveClient/__fixtures__/allgamedata.sample.json";
import { championFor, eventClock, isStolen, readEvent, readTimeline } from "./timeline";

/**
 * The events below are shaped after Riot's own published sample —
 * `https://static.developer.riotgames.com/docs/lol/liveclientdata_events.json`, which is what
 * the Live Client Data API docs point at for the list. Field names are taken from it rather
 * than remembered, because a field this app spells differently is a row that never fills.
 */

const ORDER = { riotId: "Riot Tuxedo", summonerName: "Riot Tuxedo", championName: "Annie", team: "ORDER" } as unknown as LivePlayer;
const CHAOS = { riotId: "Riot Sanchez", summonerName: "Riot Sanchez", championName: "Zed", team: "CHAOS" } as unknown as LivePlayer;
const PLAYERS = [ORDER, CHAOS];

const event = (over: Partial<GameEvent> & Pick<GameEvent, "EventName">): GameEvent =>
  ({ EventID: 1, EventTime: 600, ...over }) as GameEvent;

describe("isStolen", () => {
  /**
   * The defect this exists to stop. Some payloads send `Stolen` as the string `"False"`, and
   * `"False"` is truthy — read directly it would mark every objective in the game stolen.
   */
  it("reads the string form the way it is meant", () => {
    expect(isStolen("False")).toBe(false);
    expect(isStolen("True")).toBe(true);
  });

  it("reads the boolean form", () => {
    expect(isStolen(true)).toBe(true);
    expect(isStolen(false)).toBe(false);
  });

  it("treats an absent field as not stolen", () => {
    expect(isStolen(undefined)).toBe(false);
  });
});

describe("championFor", () => {
  it("turns the name the event used into the champion the scoreboard shows", () => {
    expect(championFor(PLAYERS, "Riot Sanchez")?.championName).toBe("Zed");
  });

  /** Routine, not a fault: a turret has no killer when minions took it. */
  it("is nobody when the name matches nobody", () => {
    expect(championFor(PLAYERS, "Turret_T1_C_05_A")).toBeNull();
    expect(championFor(PLAYERS, undefined)).toBeNull();
  });
});

describe("readEvent", () => {
  it("says which dragon in Riot's own word", () => {
    const entry = readEvent(
      event({ EventName: "DragonKill", DragonType: "Infernal", KillerName: "Riot Sanchez", Stolen: "False" }),
      PLAYERS,
      ORDER
    );

    expect(entry?.headline).toBe("Infernal dragon — Zed");
    expect(entry?.stolen).toBe(false);
    expect(entry?.team).toBe("CHAOS");
  });

  /** A dragon type this build has never heard of arrives correct rather than as "Dragon". */
  it("passes through a dragon type it does not know", () => {
    const entry = readEvent(event({ EventName: "DragonKill", DragonType: "Chemtech" }), PLAYERS, ORDER);
    expect(entry?.headline).toBe("Chemtech dragon");
  });

  it("marks a stolen objective", () => {
    const entry = readEvent(
      event({ EventName: "BaronKill", KillerName: "Riot Tuxedo", Stolen: "True" }),
      PLAYERS,
      ORDER
    );

    expect(entry?.headline).toBe("Baron — Annie, stolen");
    expect(entry?.stolen).toBe(true);
  });

  /**
   * Riot names a turret `Turret_T1_C_05_A`. Turning that into "top outer" means knowing a
   * scheme Riot does not publish and this repository has not verified, so it stays a turret.
   */
  it("does not pretend to know which turret", () => {
    const entry = readEvent(
      event({ EventName: "TurretKilled", TurretKilled: "Turret_T1_C_05_A", KillerName: "Riot Sanchez" }),
      PLAYERS,
      ORDER
    );

    expect(entry?.headline).toBe("Turret — Zed");
  });

  it("tells the first turret apart from the rest", () => {
    const entry = readEvent(event({ EventName: "FirstBrick", KillerName: "Riot Tuxedo" }), PLAYERS, ORDER);
    expect(entry?.headline).toBe("First turret — Annie");
  });

  it("reads a kill from both ends", () => {
    const entry = readEvent(
      event({ EventName: "ChampionKill", KillerName: "Riot Sanchez", VictimName: "Riot Tuxedo" }),
      PLAYERS,
      ORDER
    );

    expect(entry?.headline).toBe("Zed killed Annie");
  });

  it("marks the rows about the player at this keyboard", () => {
    const mine = readEvent(
      event({ EventName: "ChampionKill", KillerName: "Riot Sanchez", VictimName: "Riot Tuxedo" }),
      PLAYERS,
      ORDER
    );
    const theirs = readEvent(
      event({ EventName: "DragonKill", KillerName: "Riot Sanchez" }),
      PLAYERS,
      ORDER
    );

    expect(mine?.mine).toBe(true);
    expect(theirs?.mine).toBe(false);
  });

  /**
   * The number Riot sent, not a word for it. "Triple kill" would be this app deciding what
   * three means, which is knowledge it does not need to have.
   */
  it("counts a multikill rather than naming it", () => {
    const entry = readEvent(
      event({ EventName: "Multikill", KillerName: "Riot Sanchez", KillStreak: 3 }),
      PLAYERS,
      ORDER
    );

    expect(entry?.headline).toBe("Zed — multikill ×3");
  });

  it("takes the acing side from the event, which is the one place it is named", () => {
    const entry = readEvent(
      event({ EventName: "Ace", Acer: "Riot Sanchez", AcingTeam: "CHAOS" }),
      PLAYERS,
      ORDER
    );

    expect(entry?.headline).toBe("Ace — Zed");
    expect(entry?.team).toBe("CHAOS");
  });

  /**
   * Riot adds objectives between patches. One this build has not heard of is skipped rather
   * than drawn with its raw name — `Atakhan_Kill` on a player's screen is the app leaking its
   * own ignorance.
   */
  it("skips an event it has no words for", () => {
    expect(readEvent(event({ EventName: "SomethingRiotAddedLater" }), PLAYERS, ORDER)).toBeNull();
  });

  /** Both are on the clock the player is already looking at. */
  it("skips the two that would only pad the list", () => {
    expect(readEvent(event({ EventName: "GameStart", EventTime: 0 }), PLAYERS, ORDER)).toBeNull();
    expect(readEvent(event({ EventName: "MinionsSpawning" }), PLAYERS, ORDER)).toBeNull();
  });
});

describe("readTimeline", () => {
  const data = allGameDataSchema.parse(sample);

  /** The fixture is a game one event old, and that event is one the panel does not draw. */
  it("reads Riot's own sample without inventing a row", () => {
    expect(readTimeline(data, null)).toEqual([]);
  });

  it("puts the newest first, because that is the row a glance wants", () => {
    const withEvents = {
      ...data,
      allPlayers: PLAYERS,
      events: {
        Events: [
          event({ EventID: 1, EventTime: 300, EventName: "DragonKill", DragonType: "Ocean" }),
          event({ EventID: 2, EventTime: 900, EventName: "BaronKill" }),
          event({ EventID: 3, EventTime: 600, EventName: "InhibKilled" }),
        ],
      },
    };

    expect(readTimeline(withEvents, null).map((entry) => entry.id)).toEqual([2, 3, 1]);
  });

  /** Two things in the same second keep the order the client published them in. */
  it("breaks a tie on the id rather than arbitrarily", () => {
    const sameSecond = {
      ...data,
      allPlayers: PLAYERS,
      events: {
        Events: [
          event({ EventID: 7, EventTime: 600, EventName: "ChampionKill" }),
          event({ EventID: 8, EventTime: 600, EventName: "Ace" }),
        ],
      },
    };

    expect(readTimeline(sameSecond, null).map((entry) => entry.id)).toEqual([8, 7]);
  });
});

describe("eventClock", () => {
  it("reads the way the scoreboard does", () => {
    expect(eventClock(0)).toBe("0:00");
    expect(eventClock(65.4)).toBe("1:05");
    expect(eventClock(1800)).toBe("30:00");
  });

  it("never draws a negative clock", () => {
    expect(eventClock(-5)).toBe("0:00");
  });
});
