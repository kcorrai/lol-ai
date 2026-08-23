// Everything on the timeline that is already a fact in a table — rank movements,
// achievements, habits, finished lessons, past recaps — read out and turned into
// events. Nothing here computes anything a source row does not already say.

import { prisma } from "@/lib/db/prisma";
import { absoluteLp, formatRank, isRankChange } from "@/lib/riot/ladder";
import { getLessonById } from "@/domains/academy";
import type { CareerEvent, LpPoint } from "./careerTimeline.types";
import { EVENT_WEIGHT } from "./careerTimelineConstants";
import { HABIT_META } from "./habitDetectionService";

/** One month's rank facts, keyed "2026-08" — folded onto the bands by the service. */
export interface RankByMonth {
  lpDelta: number;
  rankAtClose: string;
}

export interface RankHistoryResult {
  events: CareerEvent[];
  lpSeries: LpPoint[];
  byMonth: Map<string, RankByMonth>;
}

/**
 * Rank movements, the peak, and the line the header draws.
 *
 * Only *rank* crossings become events. `ranked_history` records a row whenever tier,
 * division or LP moved, so treating every row as an event would put an entry on the
 * timeline for a single won game — which is a match, not a milestone.
 */
export async function buildRankHistory(
  riotAccountId: string,
  since: Date
): Promise<RankHistoryResult> {
  const rows = await prisma.rankedHistory.findMany({
    where: { riotAccountId, queueType: "RANKED_SOLO_5x5", recordedAt: { gte: since } },
    orderBy: { recordedAt: "asc" },
    select: { tier: true, division: true, lp: true, recordedAt: true },
  });

  const events: CareerEvent[] = [];
  const lpSeries: LpPoint[] = [];
  const byMonth = new Map<string, RankByMonth>();
  const monthFirst = new Map<string, number>();

  let peak: { value: number; at: Date; label: string } | null = null;

  rows.forEach((row, i) => {
    const value = absoluteLp(row);
    const label = formatRank(row.tier, row.division);
    const month = row.recordedAt.toISOString().slice(0, 7);

    lpSeries.push({ at: row.recordedAt.toISOString(), value, label });

    if (!monthFirst.has(month)) monthFirst.set(month, value);
    byMonth.set(month, { lpDelta: value - (monthFirst.get(month) ?? value), rankAtClose: label });

    if (!peak || value > peak.value) peak = { value, at: row.recordedAt, label };

    const previous = rows[i - 1];
    if (!previous || !isRankChange(previous, row)) return;

    const promoted = value > absoluteLp(previous);
    events.push({
      id: `rank:${row.recordedAt.toISOString()}`,
      kind: "rank_change",
      group: "rank",
      at: row.recordedAt.toISOString(),
      title: promoted ? `Promoted to ${label}` : `Fell to ${label}`,
      detail: `From ${formatRank(previous.tier, previous.division)}`,
      tone: promoted ? "good" : "bad",
      weight: EVENT_WEIGHT.rank_change,
      href: null,
    });
  });

  // A peak that is also where the player sits right now is not a memory, it is the
  // header — and it would sit on the spine directly under the promotion that made it.
  const peakPoint = peak as { value: number; at: Date; label: string } | null;
  if (peakPoint && rows.length > 1 && peakPoint.value > absoluteLp(rows[rows.length - 1])) {
    events.push({
      id: `peak:${peakPoint.at.toISOString()}`,
      kind: "peak",
      group: "rank",
      at: peakPoint.at.toISOString(),
      title: `Peak: ${peakPoint.label}`,
      detail: "The highest this account has been while we were watching",
      tone: "good",
      weight: EVENT_WEIGHT.peak,
      href: null,
    });
  }

  return { events, lpSeries, byMonth };
}

export async function buildAchievementEvents(userId: string, since: Date): Promise<CareerEvent[]> {
  const rows = await prisma.userAchievement.findMany({
    where: { userId, earnedAt: { gte: since } },
    select: {
      achievementId: true,
      earnedAt: true,
      achievement: { select: { name: true, description: true } },
    },
  });

  return rows.map((row) => ({
    id: `achievement:${row.achievementId}`,
    kind: "achievement" as const,
    group: "learning" as const,
    at: row.earnedAt.toISOString(),
    title: `Earned "${row.achievement.name}"`,
    detail: row.achievement.description,
    tone: "good" as const,
    weight: EVENT_WEIGHT.achievement,
    href: "/achievements",
  }));
}

/**
 * A leak appearing and a leak going away are both worth a line, and the second one is
 * the point: a habit that resolved is the only evidence a player has that the work
 * they did on it landed.
 */
export async function buildHabitEvents(riotAccountId: string, since: Date): Promise<CareerEvent[]> {
  const rows = await prisma.playerHabit.findMany({
    where: {
      riotAccountId,
      OR: [{ firstDetected: { gte: since } }, { resolvedAt: { gte: since } }],
    },
    select: { id: true, habitType: true, firstDetected: true, resolvedAt: true },
  });

  const events: CareerEvent[] = [];
  for (const row of rows) {
    const name = HABIT_META[row.habitType]?.displayName ?? row.habitType;

    if (row.firstDetected >= since) {
      events.push({
        id: `habit:found:${row.id}`,
        kind: "habit",
        group: "learning",
        at: row.firstDetected.toISOString(),
        title: `${name} showed up`,
        detail: "Detected across several weeks of games",
        tone: "bad",
        weight: EVENT_WEIGHT.habit,
        href: "/improvement",
      });
    }

    if (row.resolvedAt && row.resolvedAt >= since) {
      events.push({
        id: `habit:fixed:${row.id}`,
        kind: "habit",
        group: "learning",
        at: row.resolvedAt.toISOString(),
        title: `${name} stopped`,
        detail: "It no longer shows in your recent games",
        tone: "good",
        weight: EVENT_WEIGHT.habit + 10,
        href: "/improvement",
      });
    }
  }
  return events;
}

export async function buildAcademyEvents(userId: string, since: Date): Promise<CareerEvent[]> {
  const rows = await prisma.academyProgress.findMany({
    where: { userId, masteredAt: { gte: since } },
    select: { lessonId: true, masteredAt: true },
  });

  return rows.flatMap((row) => {
    if (!row.masteredAt) return [];
    // A renamed slug resolves to nothing rather than to a broken lesson — the
    // curriculum is code, and the timeline would rather say less than say wrong.
    const lesson = getLessonById(row.lessonId);
    if (!lesson) return [];

    return [
      {
        id: `academy:${row.lessonId}`,
        kind: "academy" as const,
        group: "learning" as const,
        at: row.masteredAt.toISOString(),
        title: `Mastered "${lesson.title}"`,
        detail: "Proved in your own games, not just the drill",
        tone: "good" as const,
        weight: EVENT_WEIGHT.academy,
        href: `/academy/${row.lessonId}`,
      },
    ];
  });
}

export async function buildSeasonEvents(userId: string, since: Date): Promise<CareerEvent[]> {
  const rows = await prisma.seasonRecap.findMany({
    where: { userId, generatedAt: { gte: since } },
    select: { seasonLabel: true, generatedAt: true, shareToken: true },
  });

  return rows.map((row) => ({
    id: `season:${row.seasonLabel}`,
    kind: "season" as const,
    group: "rank" as const,
    at: row.generatedAt.toISOString(),
    title: `${row.seasonLabel} recap`,
    detail: "Your season, told back to you",
    tone: "neutral" as const,
    weight: EVENT_WEIGHT.season,
    href: `/recap/share/${row.shareToken}`,
  }));
}
