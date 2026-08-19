// Riot Match-V5 timeline payload.
//
// Split out of `riot.types.ts` because this file is now the whole contract for what a timeline
// carries, and the parsers in `src/domains/riot/timeline/` are typed entirely against it.
//
// Every field below is one we actually read. Riot sends considerably more per frame —
// `championStats` (60-odd combat fields), `damageStats`, `goldPerSecond`,
// `timeEnemySpentControlled` — and more event kinds than the union names. Those are deliberately
// absent rather than typed-and-ignored: the union's catch-all arm keeps them representable, and
// what is not in this file is not stored (ADR-033).

/** One participant's state at one frame. Riot samples these on `frameInterval` (60_000ms). */
export interface ParticipantFrameDTO {
  participantId: number;
  /** Gold in hand. Falls to ~0 on a back, which is what makes it readable as a spending curve. */
  currentGold: number;
  /** Gold earned across the whole game. Monotonic — this is the one to diff between players. */
  totalGold: number;
  xp: number;
  level: number;
  minionsKilled: number;
  jungleMinionsKilled: number;
  position: { x: number; y: number };
}

export interface MatchTimelineFrameDTO {
  timestamp: number;
  /**
   * Keyed by the participant id **as a string** — `"1"` … `"10"` — not an array, and not a
   * numeric key. Indexing this with a number silently yields `undefined` for every participant,
   * which produces an empty capture rather than an error. See `parseFrames.test.ts`.
   */
  participantFrames: Record<string, ParticipantFrameDTO>;
  events: MatchTimelineEvent[];
}

export interface MatchTimelineDTO {
  info: {
    frameInterval: number;
    participants: Array<{ participantId: number; puuid: string }>;
    frames: MatchTimelineFrameDTO[];
  };
}

interface TimelineEventBase {
  timestamp: number;
}

export type MatchTimelineEvent =
  | (TimelineEventBase & {
      type: "CHAMPION_KILL";
      killerId: number;
      victimId: number;
      position: { x: number; y: number };
      assistingParticipantIds?: number[];
      bounty?: number;
    })
  | (TimelineEventBase & {
      type: "CHAMPION_SPECIAL_KILL";
      killerId: number;
      killType: string;
      multiKillLength?: number;
      position: { x: number; y: number };
    })
  | (TimelineEventBase & {
      // `creatorId`, not `participantId` — the one event kind that names its actor differently.
      type: "WARD_PLACED";
      creatorId: number;
      wardType: string;
    })
  | (TimelineEventBase & {
      type: "WARD_KILL";
      killerId: number;
      wardType: string;
    })
  | (TimelineEventBase & {
      type: "ITEM_PURCHASED" | "ITEM_SOLD";
      participantId: number;
      itemId: number;
    })
  | (TimelineEventBase & {
      type: "SKILL_LEVEL_UP";
      participantId: number;
      /** 1–4 for Q/W/E/R. */
      skillSlot: number;
      levelUpType: string;
    })
  | (TimelineEventBase & {
      type: "LEVEL_UP";
      participantId: number;
      level: number;
    })
  | (TimelineEventBase & {
      type: "ELITE_MONSTER_KILL";
      killerId: number;
      killerTeamId?: number;
      monsterType: string;
      /** Dragon element, absent for Baron and Herald. */
      monsterSubType?: string;
      position: { x: number; y: number };
    })
  | (TimelineEventBase & {
      type: "BUILDING_KILL";
      /** 0 when a minion took it — the kill is real, the killer is not a champion. */
      killerId: number;
      /** The team that **lost** the building, which is how Riot reports it. */
      teamId: number;
      buildingType: string;
      laneType: string;
      towerType?: string;
      position: { x: number; y: number };
    })
  | (TimelineEventBase & {
      type: "TURRET_PLATE_DESTROYED";
      killerId: number;
      teamId: number;
      laneType: string;
      position: { x: number; y: number };
    })
  // Keeps every other Riot event kind representable without `any`. Anything landing here is
  // dropped by the parser rather than stored.
  | { type: string; timestamp: number; [key: string]: unknown };

/** The event kinds we persist. Anything outside this set is not stored (ADR-033). */
export const STORED_EVENT_TYPES = [
  "CHAMPION_KILL",
  "CHAMPION_SPECIAL_KILL",
  "WARD_PLACED",
  "WARD_KILL",
  "ITEM_PURCHASED",
  "ITEM_SOLD",
  "SKILL_LEVEL_UP",
  "LEVEL_UP",
  "ELITE_MONSTER_KILL",
  "BUILDING_KILL",
  "TURRET_PLATE_DESTROYED",
] as const;

export type StoredEventType = (typeof STORED_EVENT_TYPES)[number];
