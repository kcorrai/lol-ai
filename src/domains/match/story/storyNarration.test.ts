import { describe, expect, it } from "vitest";
import { describeStoryEvent, formatGoldDiff } from "@/domains/match/story/storyNarration";
import type {
  MatchStoryEvent,
  MatchStoryParticipant,
} from "@/domains/match/types/matchStory.types";

const AHRI: MatchStoryParticipant = {
  puuid: "puuid-me",
  championName: "Ahri",
  teamId: 100,
  position: "MIDDLE",
  gameName: "Me",
  tagLine: "NA1",
};

// The ward member of the union carries both ward kinds, so an `Extract` keyed on one of them
// resolves to never. The payload is typed as the union instead and the assembled event asserted.
function event(
  kind: MatchStoryEvent["kind"],
  payload: MatchStoryEvent["payload"],
  actor: MatchStoryParticipant | null = AHRI
): MatchStoryEvent {
  return {
    kind,
    payload,
    actor,
    timestampMs: 515_000,
    minute: 8,
    position: null,
  } as MatchStoryEvent;
}

describe("describeStoryEvent", () => {
  it("names the champion a kill is about", () => {
    expect(
      describeStoryEvent(
        event("CHAMPION_KILL", {
          killerId: 7,
          killerPuuid: "puuid-them",
          assistingParticipantIds: [],
          bounty: 300,
        })
      )
    ).toBe("Ahri was taken down");
  });

  it("falls back to someone when the row has no actor", () => {
    expect(
      describeStoryEvent(
        event(
          "CHAMPION_KILL",
          { killerId: null, killerPuuid: null, assistingParticipantIds: [], bounty: null },
          null
        )
      )
    ).toBe("Someone was taken down");
  });

  it("reads first blood and ace out of killType rather than as multi-kills", () => {
    expect(
      describeStoryEvent(
        event("CHAMPION_SPECIAL_KILL", {
          killType: "KILL_FIRST_BLOOD",
          multiKillLength: null,
        })
      )
    ).toBe("First blood — Ahri");
    expect(
      describeStoryEvent(
        event("CHAMPION_SPECIAL_KILL", { killType: "KILL_ACE", multiKillLength: null })
      )
    ).toBe("Ahri closed out an ace");
  });

  it("uses the multi-kill length, and copes without one", () => {
    expect(
      describeStoryEvent(
        event("CHAMPION_SPECIAL_KILL", { killType: "KILL_MULTI", multiKillLength: 3 })
      )
    ).toBe("Ahri — 3-kill");
    expect(
      describeStoryEvent(
        event("CHAMPION_SPECIAL_KILL", { killType: "KILL_MULTI", multiKillLength: null })
      )
    ).toBe("Ahri — multi-kill");
  });

  it("prefers a monster's subtype, which is where the dragon lives", () => {
    expect(
      describeStoryEvent(
        event("ELITE_MONSTER_KILL", {
          monsterType: "DRAGON",
          monsterSubType: "FIRE_DRAGON",
          killerTeamId: 100,
        })
      )
    ).toBe("Fire dragon taken");
    expect(
      describeStoryEvent(
        event("ELITE_MONSTER_KILL", {
          monsterType: "BARON_NASHOR",
          monsterSubType: null,
          killerTeamId: 200,
        })
      )
    ).toBe("Baron nashor taken");
    expect(
      describeStoryEvent(
        event("ELITE_MONSTER_KILL", { monsterType: null, monsterSubType: null, killerTeamId: null })
      )
    ).toBe("Objective taken");
  });

  it("strips _LANE off a building's lane and separates an inhibitor from a turret", () => {
    expect(
      describeStoryEvent(
        event("BUILDING_KILL", {
          teamId: 200,
          buildingType: "TOWER_BUILDING",
          laneType: "TOP_LANE",
          towerType: "OUTER_TURRET",
        })
      )
    ).toBe("Top outer turret fell");
    expect(
      describeStoryEvent(
        event("BUILDING_KILL", {
          teamId: 200,
          buildingType: "INHIBITOR_BUILDING",
          laneType: "MID_LANE",
          towerType: null,
        })
      )
    ).toBe("Mid inhibitor fell");
  });

  it("describes a plate and both ward kinds", () => {
    expect(
      describeStoryEvent(event("TURRET_PLATE_DESTROYED", { teamId: 200, laneType: "BOT_LANE" }))
    ).toBe("Bot plate destroyed");
    expect(describeStoryEvent(event("WARD_PLACED", { wardType: "CONTROL_WARD" }))).toBe(
      "Ahri placed a control ward"
    );
    expect(describeStoryEvent(event("WARD_PLACED", { wardType: "YELLOW_TRINKET" }))).toBe(
      "Ahri placed a ward"
    );
    expect(describeStoryEvent(event("WARD_KILL", { wardType: null }))).toBe("Ahri cleared a ward");
  });
});

describe("formatGoldDiff", () => {
  // Not toLocaleString: it renders this as "12.860" under a Turkish locale, which would make the
  // same match read differently depending on who opened it.
  it("groups thousands with commas whatever the host locale is", () => {
    expect(formatGoldDiff(12_860)).toEqual({ text: "12,860g BLUE", teamId: 100 });
    expect(formatGoldDiff(1_234_567)).toEqual({ text: "1,234,567g BLUE", teamId: 100 });
    expect(formatGoldDiff(940)).toEqual({ text: "940g BLUE", teamId: 100 });
  });

  it("reads a negative difference as red's lead, without the sign", () => {
    expect(formatGoldDiff(-4_200)).toEqual({ text: "4,200g RED", teamId: 200 });
  });

  it("calls a dead-level match blue rather than picking a side at random", () => {
    expect(formatGoldDiff(0)).toEqual({ text: "0g BLUE", teamId: 100 });
  });
});
