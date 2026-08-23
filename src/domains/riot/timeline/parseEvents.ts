import type { TimelineEventKind } from "@prisma/client";
import type { MatchTimelineDTO, MatchTimelineEvent } from "@/domains/riot/types/timeline.types";

export interface TimelineEventRow {
  matchId: string;
  kind: TimelineEventKind;
  timestampMs: number;
  participantId: number | null;
  puuid: string | null;
  positionX: number | null;
  positionY: number | null;
  payload: Record<string, unknown>;
}

// Read through runtime accessors rather than trusting the union in timeline.types.ts. That union
// documents the payload and is correct, but its catch-all arm carries an index signature, so
// after narrowing on `type` every field still widens to `unknown` — and a field Riot renames
// would type-check while producing nulls. Checking here is the only thing that actually holds.
function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function str(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function numArray(value: unknown): number[] {
  return Array.isArray(value) ? value.filter((v): v is number => typeof v === "number") : [];
}

function position(event: Record<string, unknown>): { x: number | null; y: number | null } {
  const pos = event.position;
  if (!pos || typeof pos !== "object") return { x: null, y: null };
  const record = pos as Record<string, unknown>;
  return { x: num(record.x), y: num(record.y) };
}

/**
 * The participant the row is *about*, and the kind-specific tail that goes in `payload`.
 *
 * The subject is the acting participant for every kind but one. `CHAMPION_KILL` is keyed to the
 * **victim**, not the killer: it matches how `match_death_events` already reads, and "my deaths"
 * — the query the whole death heat map exists for — stays a plain indexed lookup instead of a
 * jsonb search. The killer is not lost, it moves into `payload`.
 */
function subjectAndPayload(
  event: Record<string, unknown>,
  kind: TimelineEventKind,
  puuids: Map<number, string>
): { participantId: number | null; payload: Record<string, unknown> } | null {
  switch (kind) {
    case "CHAMPION_KILL": {
      const killerId = num(event.killerId);
      return {
        participantId: num(event.victimId),
        payload: {
          killerId,
          killerPuuid: killerId === null ? null : (puuids.get(killerId) ?? null),
          assistingParticipantIds: numArray(event.assistingParticipantIds),
          bounty: num(event.bounty),
        },
      };
    }
    case "CHAMPION_SPECIAL_KILL":
      return {
        participantId: num(event.killerId),
        payload: { killType: str(event.killType), multiKillLength: num(event.multiKillLength) },
      };
    // The one kind that names its actor `creatorId` instead of `killerId` or `participantId`.
    case "WARD_PLACED":
      return { participantId: num(event.creatorId), payload: { wardType: str(event.wardType) } };
    case "WARD_KILL":
      return { participantId: num(event.killerId), payload: { wardType: str(event.wardType) } };
    case "ITEM_PURCHASED":
    case "ITEM_SOLD":
      return { participantId: num(event.participantId), payload: { itemId: num(event.itemId) } };
    case "SKILL_LEVEL_UP":
      return {
        participantId: num(event.participantId),
        payload: { skillSlot: num(event.skillSlot), levelUpType: str(event.levelUpType) },
      };
    case "LEVEL_UP":
      return { participantId: num(event.participantId), payload: { level: num(event.level) } };
    case "ELITE_MONSTER_KILL":
      return {
        participantId: num(event.killerId),
        payload: {
          monsterType: str(event.monsterType),
          monsterSubType: str(event.monsterSubType),
          killerTeamId: num(event.killerTeamId),
        },
      };
    case "BUILDING_KILL":
      return {
        // Riot reports a building taken by minions as killerId 0, which is not a participant.
        participantId: num(event.killerId) || null,
        payload: {
          teamId: num(event.teamId),
          buildingType: str(event.buildingType),
          laneType: str(event.laneType),
          towerType: str(event.towerType),
        },
      };
    case "TURRET_PLATE_DESTROYED":
      return {
        participantId: num(event.killerId) || null,
        payload: { teamId: num(event.teamId), laneType: str(event.laneType) },
      };
    default:
      return null;
  }
}

const STORED: ReadonlySet<string> = new Set<TimelineEventKind>([
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
]);

/**
 * Discrete timeline events, flattened out of their frames.
 *
 * Kinds outside the enum are dropped rather than stored — Riot sends a good deal we have no use
 * for (`PAUSE_END`, `GAME_END`, `OBJECTIVE_BOUNTY_PRESTART`, …), and storing them would be paying
 * to keep rows nothing reads.
 */
export function parseEvents(
  matchDbId: string,
  timeline: MatchTimelineDTO,
  puuids: Map<number, string>
): TimelineEventRow[] {
  const rows: TimelineEventRow[] = [];

  for (const frame of timeline.info.frames ?? []) {
    for (const raw of frame?.events ?? []) {
      const event = raw as MatchTimelineEvent & Record<string, unknown>;
      if (typeof event?.type !== "string" || !STORED.has(event.type)) continue;

      const kind = event.type as TimelineEventKind;
      const subject = subjectAndPayload(event, kind, puuids);
      if (!subject) continue;

      const timestampMs = num(event.timestamp);
      if (timestampMs === null) continue;

      const { x, y } = position(event);
      rows.push({
        matchId: matchDbId,
        kind,
        timestampMs,
        participantId: subject.participantId,
        puuid: subject.participantId === null ? null : (puuids.get(subject.participantId) ?? null),
        positionX: x,
        positionY: y,
        payload: subject.payload,
      });
    }
  }

  return rows;
}
