/**
 * The seven event kinds worth narrating as a match "story" beat, out of the eleven the timeline
 * capture stores (ADR-033). `ITEM_PURCHASED`, `ITEM_SOLD`, `SKILL_LEVEL_UP`, and `LEVEL_UP` are
 * left out on purpose: they fire dozens of times per player per match, they are itemization/level
 * data with a home of their own (`build-explanation`, and `level` is already on every frame below),
 * and none of it is a moment worth putting on a timeline scrubber. See matchStoryService.ts.
 */
export const STORY_EVENT_KINDS = [
  "CHAMPION_KILL",
  "CHAMPION_SPECIAL_KILL",
  "WARD_PLACED",
  "WARD_KILL",
  "ELITE_MONSTER_KILL",
  "BUILDING_KILL",
  "TURRET_PLATE_DESTROYED",
] as const;

export type StoryEventKind = (typeof STORY_EVENT_KINDS)[number];

export interface MatchStoryParticipant {
  puuid: string;
  championName: string;
  teamId: number;
  position: string;
  gameName: string | null;
  tagLine: string | null;
}

export interface MatchStoryFramePlayer {
  puuid: string;
  totalGold: number;
  level: number;
  cs: number;
}

export interface MatchStoryTeamTotal {
  teamId: number;
  totalGold: number;
}

export interface MatchStoryFrame {
  minute: number;
  players: MatchStoryFramePlayer[];
  teamTotals: MatchStoryTeamTotal[];
  /**
   * Team 100's total gold minus team 200's. League fixes 100 to the blue side and 200 to red for
   * every match, so the sign is stable across matches — a client can colour it without first
   * working out which side the viewer was on.
   */
  teamGoldDiff: number;
}

export interface ChampionKillPayload {
  killerId: number | null;
  killerPuuid: string | null;
  assistingParticipantIds: number[];
  bounty: number | null;
}

export interface ChampionSpecialKillPayload {
  killType: string | null;
  multiKillLength: number | null;
}

export interface WardEventPayload {
  wardType: string | null;
}

export interface EliteMonsterKillPayload {
  monsterType: string | null;
  monsterSubType: string | null;
  killerTeamId: number | null;
}

export interface BuildingKillPayload {
  teamId: number | null;
  buildingType: string | null;
  laneType: string | null;
  towerType: string | null;
}

export interface TurretPlateDestroyedPayload {
  teamId: number | null;
  laneType: string | null;
}

interface MatchStoryEventBase {
  timestampMs: number;
  /** Floored, not rounded — the same rule lanePhaseService's markers use, so a beat sits in the
   * minute it happened during rather than jumping to the next one at :30. */
  minute: number;
  /** The participant the row is about, already joined by puuid so the client never has to. Null
   * when the row has no puuid at all (e.g. a building a minion took). */
  actor: MatchStoryParticipant | null;
  position: { x: number; y: number } | null;
}

export type MatchStoryEvent =
  | (MatchStoryEventBase & { kind: "CHAMPION_KILL"; payload: ChampionKillPayload })
  | (MatchStoryEventBase & { kind: "CHAMPION_SPECIAL_KILL"; payload: ChampionSpecialKillPayload })
  | (MatchStoryEventBase & { kind: "WARD_PLACED" | "WARD_KILL"; payload: WardEventPayload })
  | (MatchStoryEventBase & { kind: "ELITE_MONSTER_KILL"; payload: EliteMonsterKillPayload })
  | (MatchStoryEventBase & { kind: "BUILDING_KILL"; payload: BuildingKillPayload })
  | (MatchStoryEventBase & { kind: "TURRET_PLATE_DESTROYED"; payload: TurretPlateDestroyedPayload });

/**
 * No timeline was captured for this match — every game synced before LA-45. This is not an error:
 * the match itself is real and owned by the caller, it simply has no minute-by-minute data. The
 * client renders its own empty state on it rather than an error page.
 */
export interface MatchStoryUnavailable {
  hasTimeline: false;
}

export interface MatchStoryAvailable {
  hasTimeline: true;
  participants: MatchStoryParticipant[];
  frames: MatchStoryFrame[];
  events: MatchStoryEvent[];
}

export type MatchStory = MatchStoryUnavailable | MatchStoryAvailable;
