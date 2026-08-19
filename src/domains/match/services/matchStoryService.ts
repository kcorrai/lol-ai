import { prisma } from "@/lib/db/prisma";
import { STORY_EVENT_KINDS } from "@/domains/match/types/matchStory.types";
import type {
  MatchStory,
  MatchStoryFrame,
  MatchStoryFramePlayer,
  MatchStoryParticipant,
  MatchStoryTeamTotal,
} from "@/domains/match/types/matchStory.types";
import { toStoryEvent } from "@/domains/match/services/matchStoryEvents";

interface FrameRow {
  puuid: string;
  minute: number;
  totalGold: number;
  level: number;
  minionsKilled: number;
  jungleMinionsKilled: number;
}

function buildFrames(
  rows: FrameRow[],
  rosterByPuuid: Map<string, MatchStoryParticipant>
): MatchStoryFrame[] {
  const byMinute = new Map<number, FrameRow[]>();
  for (const row of rows) {
    const bucket = byMinute.get(row.minute);
    if (bucket) bucket.push(row);
    else byMinute.set(row.minute, [row]);
  }

  return [...byMinute.entries()]
    .sort(([a], [b]) => a - b)
    .map(([minute, rowsAtMinute]) => {
      const players: MatchStoryFramePlayer[] = rowsAtMinute.map((r) => ({
        puuid: r.puuid,
        totalGold: r.totalGold,
        level: r.level,
        cs: r.minionsKilled + r.jungleMinionsKilled,
      }));

      const goldByTeam = new Map<number, number>();
      for (const r of rowsAtMinute) {
        // A frame for a puuid absent from the roster (should not happen — every frame's puuid
        // comes from a match participant) is skipped rather than guessed into a team.
        const teamId = rosterByPuuid.get(r.puuid)?.teamId;
        if (teamId === undefined) continue;
        goldByTeam.set(teamId, (goldByTeam.get(teamId) ?? 0) + r.totalGold);
      }

      const teamTotals: MatchStoryTeamTotal[] = [...goldByTeam.entries()]
        .sort(([a], [b]) => a - b)
        .map(([teamId, totalGold]) => ({ teamId, totalGold }));

      return {
        minute,
        players,
        teamTotals,
        // Team 100 (blue) minus team 200 (red) — see MatchStoryFrame.teamGoldDiff.
        teamGoldDiff: (goldByTeam.get(100) ?? 0) - (goldByTeam.get(200) ?? 0),
      };
    });
}

/**
 * The match, minute by minute — built from the captured timeline (LA-45, ADR-033). This is the one
 * read endpoint the whole captured timeline feeds; a screen consuming it is a separate card.
 *
 * Ownership resolves the same way `getLanePhaseForUser` does: match participation by puuid across
 * every account the caller has linked, not by `riotAccountId` (TASK-228). A caller who did not
 * play the match gets the same `null` a caller asking about a match that does not exist gets, and
 * the route turns both into 404 — separating them would leak which matches exist.
 *
 * Unlike lane phase, "no timeline captured" is deliberately **not** folded into that same `null`.
 * A match the caller owns that predates LA-45 is a real, ownable resource with an empty timeline,
 * not a missing one — the caller is entitled to see it, there is just nothing minute-by-minute on
 * it. So a match the caller owns always returns a story; `hasTimeline` says whether it has content.
 */
export async function getMatchStoryForUser(
  matchDbId: string,
  userId: string
): Promise<MatchStory | null> {
  const accounts = await prisma.riotAccount.findMany({
    where: { userId },
    select: { puuid: true },
  });
  if (accounts.length === 0) return null;
  const accountPuuids = new Set(accounts.map((a) => a.puuid));

  const participants = await prisma.matchParticipant.findMany({
    where: { matchId: matchDbId },
    select: {
      puuid: true,
      championName: true,
      teamId: true,
      position: true,
      gameName: true,
      tagLine: true,
    },
  });
  if (participants.length === 0) return null; // no such match
  if (!participants.some((p) => accountPuuids.has(p.puuid))) return null; // not this user's match

  const roster: MatchStoryParticipant[] = participants.map((p) => ({
    puuid: p.puuid,
    championName: p.championName,
    teamId: p.teamId,
    position: p.position,
    gameName: p.gameName,
    tagLine: p.tagLine,
  }));
  const rosterByPuuid = new Map(roster.map((p) => [p.puuid, p]));

  const frameRows = await prisma.matchTimelineFrame.findMany({
    where: { matchId: matchDbId },
    select: {
      puuid: true,
      minute: true,
      totalGold: true,
      level: true,
      minionsKilled: true,
      jungleMinionsKilled: true,
    },
    orderBy: { minute: "asc" },
  });
  if (frameRows.length === 0) return { hasTimeline: false };

  // Filtered at the query, not in memory: ITEM_PURCHASED and SKILL_LEVEL_UP alone can be several
  // hundred rows a match, and none of the four kinds outside STORY_EVENT_KINDS is read by
  // `toStoryEvent` (see matchStoryEvents.ts), so there is nothing to gain by fetching them.
  const eventRows = await prisma.matchTimelineEvent.findMany({
    where: { matchId: matchDbId, kind: { in: [...STORY_EVENT_KINDS] } },
    select: { kind: true, timestampMs: true, puuid: true, positionX: true, positionY: true, payload: true },
    orderBy: { timestampMs: "asc" },
  });

  return {
    hasTimeline: true,
    participants: roster,
    frames: buildFrames(frameRows, rosterByPuuid),
    events: eventRows
      .map((row) => toStoryEvent(row, rosterByPuuid))
      .filter((e): e is NonNullable<typeof e> => e !== null),
  };
}
