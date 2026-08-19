import { z } from "zod";
import type { TimelineEventKind } from "@prisma/client";
import type { MatchStoryEvent, MatchStoryParticipant } from "@/domains/match/types/matchStory.types";

// One zod schema per exposed event kind, matching exactly the fields
// `src/domains/riot/timeline/parseEvents.ts` writes into `payload` for that kind. Payload is a Json
// column, so nothing but this schema stands between a stored row and a shape the client can rely
// on — the same read-time re-validation contract `savedSearchService.ts` uses for
// `saved_searches.filters`.
const championKillPayloadSchema = z.object({
  killerId: z.number().nullable(),
  killerPuuid: z.string().nullable(),
  assistingParticipantIds: z.array(z.number()),
  bounty: z.number().nullable(),
});

const championSpecialKillPayloadSchema = z.object({
  killType: z.string().nullable(),
  multiKillLength: z.number().nullable(),
});

const wardPayloadSchema = z.object({
  wardType: z.string().nullable(),
});

const eliteMonsterKillPayloadSchema = z.object({
  monsterType: z.string().nullable(),
  monsterSubType: z.string().nullable(),
  killerTeamId: z.number().nullable(),
});

const buildingKillPayloadSchema = z.object({
  teamId: z.number().nullable(),
  buildingType: z.string().nullable(),
  laneType: z.string().nullable(),
  towerType: z.string().nullable(),
});

const turretPlateDestroyedPayloadSchema = z.object({
  teamId: z.number().nullable(),
  laneType: z.string().nullable(),
});

export interface StoryEventRow {
  kind: TimelineEventKind;
  timestampMs: number;
  puuid: string | null;
  positionX: number | null;
  positionY: number | null;
  payload: unknown;
}

/**
 * One stored event row, turned into a story beat — or `null` if it is a kind this feed does not
 * narrate (item/skill/level events — see matchStory.types.ts), or if its payload no longer matches
 * the shape we expect. A malformed row is dropped rather than thrown on: one bad row must not fail
 * the whole match story, the same rule `savedSearchService.ts` follows for a bad saved filter.
 *
 * Switches on the full eleven-kind enum rather than the seven we keep, with an exhaustiveness
 * check in `default`, so a twelfth kind Riot adds later fails the build instead of silently falling
 * through as "unhandled."
 */
export function toStoryEvent(
  row: StoryEventRow,
  participantsByPuuid: Map<string, MatchStoryParticipant>
): MatchStoryEvent | null {
  const base = {
    timestampMs: row.timestampMs,
    minute: Math.floor(row.timestampMs / 60_000),
    actor: row.puuid ? (participantsByPuuid.get(row.puuid) ?? null) : null,
    position:
      row.positionX !== null && row.positionY !== null
        ? { x: row.positionX, y: row.positionY }
        : null,
  };

  switch (row.kind) {
    case "CHAMPION_KILL": {
      const parsed = championKillPayloadSchema.safeParse(row.payload);
      return parsed.success ? { ...base, kind: row.kind, payload: parsed.data } : null;
    }
    case "CHAMPION_SPECIAL_KILL": {
      const parsed = championSpecialKillPayloadSchema.safeParse(row.payload);
      return parsed.success ? { ...base, kind: row.kind, payload: parsed.data } : null;
    }
    case "WARD_PLACED":
    case "WARD_KILL": {
      const parsed = wardPayloadSchema.safeParse(row.payload);
      return parsed.success ? { ...base, kind: row.kind, payload: parsed.data } : null;
    }
    case "ELITE_MONSTER_KILL": {
      const parsed = eliteMonsterKillPayloadSchema.safeParse(row.payload);
      return parsed.success ? { ...base, kind: row.kind, payload: parsed.data } : null;
    }
    case "BUILDING_KILL": {
      const parsed = buildingKillPayloadSchema.safeParse(row.payload);
      return parsed.success ? { ...base, kind: row.kind, payload: parsed.data } : null;
    }
    case "TURRET_PLATE_DESTROYED": {
      const parsed = turretPlateDestroyedPayloadSchema.safeParse(row.payload);
      return parsed.success ? { ...base, kind: row.kind, payload: parsed.data } : null;
    }
    case "ITEM_PURCHASED":
    case "ITEM_SOLD":
    case "SKILL_LEVEL_UP":
    case "LEVEL_UP":
      return null;
    default: {
      const exhaustive: never = row.kind;
      return exhaustive;
    }
  }
}
