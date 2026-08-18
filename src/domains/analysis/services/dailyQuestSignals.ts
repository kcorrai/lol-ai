// Whether a quest was finished is read back out of the tables the app already
// writes — solving the quiz, finishing a lesson, completing a report. Nothing
// here records that a quest was done, because a second record of the same fact
// is a second thing that can disagree with the first.

import { prisma } from "@/lib/db/prisma";
import type { OnSiteTaskId } from "./dailyQuestCatalog";

/** UTC day keys ("YYYY-MM-DD") on which each signal fired, for one user. */
export interface QuestSignals {
  onSite: Record<OnSiteTaskId, Set<string>>;
  /** Days a daily challenge was actually issued — a day without one has no in-game leg. */
  challengeIssued: Set<string>;
  challengeDone: Set<string>;
}

function dayKey(date: Date | null): string | null {
  return date ? date.toISOString().slice(0, 10) : null;
}

function keySet(dates: (Date | null)[]): Set<string> {
  const out = new Set<string>();
  for (const d of dates) {
    const key = dayKey(d);
    if (key) out.add(key);
  }
  return out;
}

/**
 * One pass over the whole streak window rather than a query per day — the
 * streak walks up to 30 days back, and 30 days × 6 signals is 180 round trips
 * for a widget that renders above the fold.
 */
export async function loadQuestSignals(userId: string, since: Date): Promise<QuestSignals> {
  const [quiz, academy, reports, cards, issued, done] = await Promise.all([
    prisma.quizAttempt.findMany({
      where: { userId, solved: true, puzzleDate: { gte: since } },
      select: { puzzleDate: true },
    }),
    prisma.academyProgress.findMany({
      where: { userId, completedAt: { gte: since } },
      select: { completedAt: true },
    }),
    // Reports hang off the Riot account, not the user, so this filters through
    // the relation — it counts a report on any account the player owns.
    prisma.coachingReport.findMany({
      where: { riotAccount: { userId }, status: "complete", completedAt: { gte: since } },
      select: { completedAt: true },
    }),
    prisma.shareableCard.findMany({
      where: { userId, createdAt: { gte: since } },
      select: { createdAt: true },
    }),
    prisma.challenge.findMany({
      where: { userId, type: "daily", validFrom: { gte: since } },
      select: { validFrom: true },
    }),
    // Attributed to the day the challenge was *for*, not the moment it was
    // marked done: the progress checker runs on a schedule and can close
    // yesterday's challenge this morning.
    prisma.userChallenge.findMany({
      where: {
        userId,
        completed: true,
        completedAt: { gte: since },
        challenge: { type: "daily" },
      },
      select: { challenge: { select: { validFrom: true } } },
    }),
  ]);

  return {
    onSite: {
      quiz: keySet(quiz.map((r) => r.puzzleDate)),
      academy: keySet(academy.map((r) => r.completedAt)),
      report: keySet(reports.map((r) => r.completedAt)),
      card: keySet(cards.map((r) => r.createdAt)),
    },
    challengeIssued: keySet(issued.map((r) => r.validFrom)),
    challengeDone: keySet(done.map((r) => r.challenge.validFrom)),
  };
}
