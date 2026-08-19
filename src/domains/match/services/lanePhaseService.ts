import type { TimelineEventKind } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type {
  LanePhase,
  LanePhaseMarker,
  LanePhasePoint,
} from "@/domains/match/types/lanePhase.types";

/** Kinds worth drawing on a lane curve. The rest are captured but say nothing about a lane. */
const MARKED_KINDS: TimelineEventKind[] = [
  "CHAMPION_KILL",
  "ELITE_MONSTER_KILL",
  "BUILDING_KILL",
  "TURRET_PLATE_DESTROYED",
];

interface FrameRow {
  puuid: string;
  minute: number;
  totalGold: number;
  xp: number;
  minionsKilled: number;
  jungleMinionsKilled: number;
}

function farm(frame: FrameRow): number {
  return frame.minionsKilled + frame.jungleMinionsKilled;
}

function buildPoints(mine: FrameRow[], theirs: FrameRow[]): LanePhasePoint[] {
  const opponentByMinute = new Map(theirs.map((f) => [f.minute, f]));

  return mine
    .map((f) => {
      const other = opponentByMinute.get(f.minute);
      // A minute the opponent has no frame for is dropped rather than differenced against zero:
      // a fabricated +10k gold lead is worse than a gap in the line.
      if (!other) return null;
      return {
        minute: f.minute,
        goldDiff: f.totalGold - other.totalGold,
        xpDiff: f.xp - other.xp,
        csDiff: farm(f) - farm(other),
      };
    })
    .filter((p): p is LanePhasePoint => p !== null);
}

function markerLabel(kind: TimelineEventKind, side: "player" | "opponent"): string {
  const who = side === "player" ? "You" : "Opponent";
  switch (kind) {
    // The row is keyed to the victim (ADR-033), so this reads as a death, not a kill.
    case "CHAMPION_KILL":
      return side === "player" ? "You died" : "You killed your opponent";
    case "ELITE_MONSTER_KILL":
      return `${who} took an objective`;
    case "BUILDING_KILL":
      return `${who} took a building`;
    case "TURRET_PLATE_DESTROYED":
      return `${who} took a plate`;
    default:
      return `${who}: ${kind}`;
  }
}

/**
 * The lane, minute by minute, as a difference against the opponent.
 *
 * Returns `null` when the match has no captured frames — every game synced before ADR-033, which
 * is not an error and must not render as one. The caller shows an empty state.
 *
 * The lane opponent is resolved through Prisma rather than the raw SQL join
 * `personalCounterService` uses for the same shape. CLAUDE.md forbids raw SQL, and LA-38 is
 * exactly what it costs: that file addresses columns in snake_case that Prisma created in
 * camelCase, so it throws on every request.
 */
export async function getLanePhase(matchDbId: string, puuid: string): Promise<LanePhase | null> {
  const me = await prisma.matchParticipant.findFirst({
    where: { matchId: matchDbId, puuid },
    select: { position: true, teamId: true, championName: true },
  });
  if (!me) return null;

  const opponent = await prisma.matchParticipant.findFirst({
    where: {
      matchId: matchDbId,
      position: me.position,
      teamId: { not: me.teamId },
    },
    select: { puuid: true, championName: true, gameName: true, tagLine: true },
  });

  const frames = await prisma.matchTimelineFrame.findMany({
    where: {
      matchId: matchDbId,
      puuid: { in: opponent ? [puuid, opponent.puuid] : [puuid] },
    },
    select: {
      puuid: true,
      minute: true,
      totalGold: true,
      xp: true,
      minionsKilled: true,
      jungleMinionsKilled: true,
    },
    orderBy: { minute: "asc" },
  });

  // No frames at all means this match predates the capture. Distinguish it from a match that has
  // frames but no resolvable opponent, which still has a curve worth nothing and a shape worth
  // showing as empty.
  if (frames.length === 0) return null;

  const mine = frames.filter((f) => f.puuid === puuid);
  const theirs = opponent ? frames.filter((f) => f.puuid === opponent.puuid) : [];

  return {
    position: me.position,
    championName: me.championName,
    opponent: opponent
      ? {
          puuid: opponent.puuid,
          championName: opponent.championName,
          gameName: opponent.gameName,
          tagLine: opponent.tagLine,
        }
      : null,
    points: opponent ? buildPoints(mine, theirs) : [],
    markers: await loadMarkers(matchDbId, puuid, opponent?.puuid ?? null),
  };
}

/**
 * `getLanePhase` for a signed-in user, resolving which of their linked accounts played.
 *
 * Ownership lives here rather than in the route: a null return means either "not this user's
 * match" or "no timeline recorded", and the route answers 404 to the first without having to
 * know which. Participation is matched by puuid, not `riotAccountId`, so a user who linked an
 * account someone else also linked still sees their own match (TASK-228) — the same rule
 * `getMatchDetail` follows.
 */
export async function getLanePhaseForUser(
  matchDbId: string,
  userId: string
): Promise<LanePhase | null> {
  const accounts = await prisma.riotAccount.findMany({
    where: { userId },
    select: { puuid: true },
  });
  if (accounts.length === 0) return null;

  const participant = await prisma.matchParticipant.findFirst({
    where: { matchId: matchDbId, puuid: { in: accounts.map((a) => a.puuid) } },
    select: { puuid: true },
  });
  if (!participant) return null;

  return getLanePhase(matchDbId, participant.puuid);
}

async function loadMarkers(
  matchDbId: string,
  puuid: string,
  opponentPuuid: string | null
): Promise<LanePhaseMarker[]> {
  const puuids = opponentPuuid ? [puuid, opponentPuuid] : [puuid];
  const events = await prisma.matchTimelineEvent.findMany({
    where: { matchId: matchDbId, kind: { in: MARKED_KINDS }, puuid: { in: puuids } },
    select: { kind: true, timestampMs: true, puuid: true },
    orderBy: { timestampMs: "asc" },
  });

  return events.map((e) => {
    const side = e.puuid === puuid ? "player" : "opponent";
    return {
      // Floored, not rounded, so a marker sits in the minute it happened during rather than
      // jumping to the next one at :30.
      minute: Math.floor(e.timestampMs / 60_000),
      kind: e.kind,
      side,
      label: markerLabel(e.kind, side),
    };
  });
}
