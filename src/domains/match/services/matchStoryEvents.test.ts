import { describe, expect, it } from "vitest";
import { toStoryEvent } from "@/domains/match/services/matchStoryEvents";
import type { MatchStoryParticipant } from "@/domains/match/types/matchStory.types";

const ME = "puuid-me";
const THEM = "puuid-them";

const ROSTER = new Map<string, MatchStoryParticipant>([
  [
    ME,
    {
      puuid: ME,
      championName: "Ahri",
      teamId: 100,
      position: "MIDDLE",
      gameName: "Me",
      tagLine: "NA1",
    },
  ],
]);

describe("toStoryEvent", () => {
  it("keeps a CHAMPION_KILL with its validated payload and floors the minute", () => {
    const event = toStoryEvent(
      {
        kind: "CHAMPION_KILL",
        timestampMs: 515_000,
        puuid: ME,
        positionX: 4200,
        positionY: 9100,
        payload: { killerId: 7, killerPuuid: THEM, assistingParticipantIds: [6], bounty: 300 },
      },
      ROSTER
    );

    expect(event).toEqual({
      kind: "CHAMPION_KILL",
      timestampMs: 515_000,
      minute: 8,
      actor: ROSTER.get(ME),
      position: { x: 4200, y: 9100 },
      payload: { killerId: 7, killerPuuid: THEM, assistingParticipantIds: [6], bounty: 300 },
    });
  });

  it("resolves the actor from the roster by puuid rather than leaving a raw puuid", () => {
    const event = toStoryEvent(
      {
        kind: "WARD_KILL",
        timestampMs: 0,
        puuid: ME,
        positionX: null,
        positionY: null,
        payload: { wardType: "YELLOW_TRINKET" },
      },
      ROSTER
    );
    expect(event?.actor).toEqual(ROSTER.get(ME));
  });

  it("leaves the actor null for a row with no puuid, such as a building minions took", () => {
    const event = toStoryEvent(
      {
        kind: "BUILDING_KILL",
        timestampMs: 210_000,
        puuid: null,
        positionX: 981,
        positionY: 10441,
        payload: { teamId: 200, buildingType: "TOWER_BUILDING", laneType: "TOP_LANE", towerType: "OUTER_TURRET" },
      },
      ROSTER
    );
    expect(event?.actor).toBeNull();
  });

  it("leaves position null when neither coordinate was captured", () => {
    const event = toStoryEvent(
      { kind: "WARD_PLACED", timestampMs: 0, puuid: ME, positionX: null, positionY: null, payload: { wardType: "YELLOW_TRINKET" } },
      ROSTER
    );
    expect(event?.position).toBeNull();
  });

  it("drops a row whose payload no longer matches its kind's schema, rather than throwing", () => {
    const event = toStoryEvent(
      { kind: "ELITE_MONSTER_KILL", timestampMs: 0, puuid: ME, positionX: null, positionY: null, payload: { monsterType: 42 } },
      ROSTER
    );
    expect(event).toBeNull();
  });

  it.each(["ITEM_PURCHASED", "ITEM_SOLD", "SKILL_LEVEL_UP", "LEVEL_UP"] as const)(
    "does not narrate %s — it is build/level data with a home elsewhere",
    (kind) => {
      const event = toStoryEvent(
        { kind, timestampMs: 0, puuid: ME, positionX: null, positionY: null, payload: {} },
        ROSTER
      );
      expect(event).toBeNull();
    }
  );
});
