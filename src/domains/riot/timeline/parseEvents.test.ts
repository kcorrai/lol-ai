import { describe, expect, it } from "vitest";
import { parseEvents } from "@/domains/riot/timeline/parseEvents";
import { participantPuuids } from "@/domains/riot/timeline/parseFrames";
import { PUUIDS, shortTimeline, timelineFixture } from "@/domains/riot/timeline/timeline.fixture";

const MATCH = "match-db-id";

function rows() {
  const timeline = timelineFixture();
  return parseEvents(MATCH, timeline, participantPuuids(timeline));
}

describe("parseEvents", () => {
  it("drops event kinds outside the stored enum", () => {
    // The fixture carries a PAUSE_END, which Riot sends and we have no use for.
    expect(rows().some((r) => String(r.kind) === "PAUSE_END")).toBe(false);
    expect(rows()).toHaveLength(7);
  });

  it("keys a CHAMPION_KILL to the victim and moves the killer into the payload", () => {
    const kill = rows().find((r) => r.kind === "CHAMPION_KILL");
    // Victim-keyed on purpose: it matches match_death_events, so "my deaths" stays an indexed
    // lookup rather than a jsonb search.
    expect(kill?.participantId).toBe(1);
    expect(kill?.puuid).toBe(PUUIDS[1]);
    expect(kill?.payload).toMatchObject({
      killerId: 7,
      killerPuuid: PUUIDS[7],
      assistingParticipantIds: [6],
      bounty: 300,
    });
    expect(kill?.positionX).toBe(4200);
    expect(kill?.positionY).toBe(9100);
  });

  it("reads WARD_PLACED off creatorId, the one kind that names its actor differently", () => {
    const ward = rows().find((r) => r.kind === "WARD_PLACED");
    expect(ward?.participantId).toBe(2);
    expect(ward?.puuid).toBe(PUUIDS[2]);
    expect(ward?.payload).toEqual({ wardType: "YELLOW_TRINKET" });
  });

  it("attributes a ward clear to its killer", () => {
    const clear = rows().find((r) => r.kind === "WARD_KILL");
    expect(clear?.participantId).toBe(7);
    expect(clear?.puuid).toBe(PUUIDS[7]);
  });

  it("keeps the item and skill tail needed to rebuild a build path", () => {
    expect(rows().find((r) => r.kind === "ITEM_PURCHASED")?.payload).toEqual({ itemId: 1055 });
    expect(rows().find((r) => r.kind === "SKILL_LEVEL_UP")?.payload).toEqual({
      skillSlot: 1,
      levelUpType: "NORMAL",
    });
  });

  it("keeps the dragon's element on an ELITE_MONSTER_KILL", () => {
    const dragon = rows().find((r) => r.kind === "ELITE_MONSTER_KILL");
    expect(dragon?.participantId).toBe(2);
    expect(dragon?.payload).toMatchObject({
      monsterType: "DRAGON",
      monsterSubType: "FIRE_DRAGON",
      killerTeamId: 100,
    });
  });

  it("stores a building taken by minions with no participant attached", () => {
    const tower = rows().find((r) => r.kind === "BUILDING_KILL");
    // Riot reports killerId 0, which is not a participant — a null subject is the honest row.
    expect(tower?.participantId).toBeNull();
    expect(tower?.puuid).toBeNull();
    expect(tower?.payload).toMatchObject({ teamId: 200, towerType: "OUTER_TURRET" });
  });

  it("stamps every row with the match and its own timestamp", () => {
    expect(rows().every((r) => r.matchId === MATCH)).toBe(true);
    expect(rows().every((r) => typeof r.timestampMs === "number")).toBe(true);
  });

  it("returns nothing for a game with no events", () => {
    const timeline = shortTimeline();
    expect(parseEvents(MATCH, timeline, participantPuuids(timeline))).toEqual([]);
  });
});
