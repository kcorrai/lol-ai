import type { MatchTimelineDTO } from "@/domains/riot/types/timeline.types";

export interface TimelineFrameRow {
  matchId: string;
  participantId: number;
  puuid: string;
  minute: number;
  timestampMs: number;
  currentGold: number;
  totalGold: number;
  xp: number;
  level: number;
  minionsKilled: number;
  jungleMinionsKilled: number;
}

/**
 * Timeline-local participant id (1..10) to puuid.
 *
 * The timeline names players by an ordinal that means nothing outside the payload; every other
 * table in the app joins on puuid. Everything downstream needs this map, so it is built once per
 * match and passed around rather than rebuilt per event.
 */
export function participantPuuids(timeline: MatchTimelineDTO): Map<number, string> {
  const map = new Map<number, string>();
  for (const p of timeline.info.participants ?? []) {
    if (typeof p?.participantId === "number" && typeof p?.puuid === "string") {
      map.set(p.participantId, p.puuid);
    }
  }
  return map;
}

/**
 * Per-minute state for all ten participants.
 *
 * `minute` is the **frame ordinal**, not a value derived from the timestamp. Riot samples on
 * `frameInterval` (60_000ms), so with a well-formed payload the two agree — but the ordinal is
 * what the unique constraint is built on, and deriving it by dividing a timestamp would let two
 * frames round to the same minute and silently drop one through `skipDuplicates`.
 *
 * A participant missing from a frame is skipped rather than zero-filled: a zero row is
 * indistinguishable from a real zero, and a gap in the curve is the honest reading.
 */
export function parseFrames(matchDbId: string, timeline: MatchTimelineDTO): TimelineFrameRow[] {
  const puuids = participantPuuids(timeline);
  const rows: TimelineFrameRow[] = [];

  const frames = timeline.info.frames ?? [];
  for (let minute = 0; minute < frames.length; minute++) {
    const frame = frames[minute];
    // A frame with no participantFrames key at all is what a wrong access pattern looks like
    // (the object is keyed by the id *as a string*), so it is worth surviving rather than throwing.
    const participantFrames = frame?.participantFrames;
    if (!participantFrames) continue;

    for (const pf of Object.values(participantFrames)) {
      if (!pf || typeof pf.participantId !== "number") continue;
      const puuid = puuids.get(pf.participantId);
      if (!puuid) continue;

      rows.push({
        matchId: matchDbId,
        participantId: pf.participantId,
        puuid,
        minute,
        timestampMs: frame.timestamp ?? 0,
        currentGold: pf.currentGold ?? 0,
        totalGold: pf.totalGold ?? 0,
        xp: pf.xp ?? 0,
        level: pf.level ?? 0,
        minionsKilled: pf.minionsKilled ?? 0,
        jungleMinionsKilled: pf.jungleMinionsKilled ?? 0,
      });
    }
  }

  return rows;
}
