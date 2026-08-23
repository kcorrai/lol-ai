import type {
  MatchTimelineDTO,
  MatchTimelineFrameDTO,
  ParticipantFrameDTO,
} from "@/domains/riot/types/timeline.types";

// A trimmed but structurally real Match-V5 timeline. Shapes and field names are copied from a
// live payload — in particular `participantFrames` being an object keyed by the participant id
// **as a string**, which is the one detail that turns a wrong access into an empty capture rather
// than an error.

export const PUUIDS: Record<number, string> = {
  1: "puuid-blue-top",
  2: "puuid-blue-jgl",
  3: "puuid-blue-mid",
  6: "puuid-red-top",
  7: "puuid-red-jgl",
};

function participantFrame(participantId: number, minute: number): ParticipantFrameDTO {
  return {
    participantId,
    currentGold: 100 * minute,
    // Blue side pulls ahead so a gold difference has a sign the tests can assert on.
    totalGold: 500 + minute * (participantId <= 3 ? 400 : 300),
    xp: minute * 250,
    level: Math.min(1 + Math.floor(minute / 2), 18),
    minionsKilled: minute * 7,
    jungleMinionsKilled: participantId === 2 || participantId === 7 ? minute * 4 : 0,
  };
}

function frame(
  minute: number,
  events: MatchTimelineFrameDTO["events"] = []
): MatchTimelineFrameDTO {
  const participantFrames: Record<string, ParticipantFrameDTO> = {};
  for (const id of Object.keys(PUUIDS)) {
    participantFrames[id] = participantFrame(Number(id), minute);
  }
  return { timestamp: minute * 60_000, participantFrames, events };
}

export function timelineFixture(): MatchTimelineDTO {
  return {
    info: {
      frameInterval: 60_000,
      participants: Object.entries(PUUIDS).map(([participantId, puuid]) => ({
        participantId: Number(participantId),
        puuid,
      })),
      frames: [
        frame(0),
        frame(1, [
          { type: "ITEM_PURCHASED", timestamp: 65_000, participantId: 1, itemId: 1055 },
          {
            type: "SKILL_LEVEL_UP",
            timestamp: 70_000,
            participantId: 1,
            skillSlot: 1,
            levelUpType: "NORMAL",
          },
        ]),
        frame(2, [
          { type: "WARD_PLACED", timestamp: 130_000, creatorId: 2, wardType: "YELLOW_TRINKET" },
          { type: "WARD_KILL", timestamp: 140_000, killerId: 7, wardType: "YELLOW_TRINKET" },
          // Riot sends plenty we have no use for; the parser must drop it, not store it.
          { type: "PAUSE_END", timestamp: 145_000, realTimestamp: 1_700_000_000_000 },
        ]),
        frame(3, [
          {
            type: "CHAMPION_KILL",
            timestamp: 190_000,
            killerId: 7,
            victimId: 1,
            position: { x: 4200, y: 9100 },
            assistingParticipantIds: [6],
            bounty: 300,
          },
          {
            type: "ELITE_MONSTER_KILL",
            timestamp: 200_000,
            killerId: 2,
            killerTeamId: 100,
            monsterType: "DRAGON",
            monsterSubType: "FIRE_DRAGON",
            position: { x: 9800, y: 4400 },
          },
          {
            // killerId 0 — minions took it, so there is no participant to attribute it to.
            type: "BUILDING_KILL",
            timestamp: 210_000,
            killerId: 0,
            teamId: 200,
            buildingType: "TOWER_BUILDING",
            laneType: "TOP_LANE",
            towerType: "OUTER_TURRET",
            position: { x: 981, y: 10441 },
          },
        ]),
      ],
    },
  };
}

/** A payload whose frames carry no `participantFrames` key at all. */
export function timelineWithoutParticipantFrames(): MatchTimelineDTO {
  const timeline = timelineFixture();
  return {
    info: {
      ...timeline.info,
      frames: timeline.info.frames.map((f) => ({
        timestamp: f.timestamp,
        events: f.events,
      })) as MatchTimelineFrameDTO[],
    },
  };
}

/** A surrender at 3 minutes: one frame, no events. */
export function shortTimeline(): MatchTimelineDTO {
  const timeline = timelineFixture();
  return { info: { ...timeline.info, frames: [timeline.info.frames[0]] } };
}
