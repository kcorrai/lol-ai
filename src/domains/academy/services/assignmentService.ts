import type { Position } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getAccountPuuid } from "@/domains/riot";
import { awardXp } from "@/domains/analysis";
import { resolveLesson } from "@/domains/academy/services/lessonResolver";
import { buildAssignmentTarget, type AssignmentTarget } from "@/domains/academy/assignments";
import { buildEvidence, judgeAssignment } from "@/domains/academy/verification";
import { loadReadings, rankedBaseline } from "@/domains/academy/services/assignmentReadings";
import { xpToAward } from "@/domains/academy/xp";
import type { AssignmentMetric } from "@/domains/academy/types";
import { fromJsonValue, toJsonInput } from "@/types/json";
import { logger } from "@/lib/utils/logger";

// The lifecycle of a field assignment: opened when a lesson is completed, judged after every
// match sync, and the only thing in the product that can mark a lesson `mastered`. The match
// reading and the two filters that make the numbers comparable live in assignmentReadings.ts.

/** `pending` is the judge's word for it; the stored row calls the same state `active`. */
export type AssignmentStatus = "active" | "passed" | "failed" | "expired";

export interface AssignmentView {
  lessonId: string;
  metric: AssignmentMetric;
  direction: "increase" | "decrease";
  baseline: number;
  target: number;
  gamesRequired: number;
  gamesObserved: number;
  status: AssignmentStatus;
  /** Mean over the counted games once there are enough of them. */
  average: number | null;
  /** The role the target was set in and the verdict is read from. */
  position: Position | null;
  startedAt: string;
}

// ── Reading ───────────────────────────────────────────────────────────────────

function toView(row: {
  lessonId: string;
  metric: string;
  direction: string;
  baseline: unknown;
  target: unknown;
  gamesRequired: number;
  gamesObserved: number;
  status: string;
  evidence: unknown;
  position: Position | null;
  startedAt: Date;
}): AssignmentView {
  const evidence = fromJsonValue<{ average?: number } | null>(row.evidence);
  return {
    lessonId: row.lessonId,
    metric: row.metric as AssignmentMetric,
    direction: row.direction === "decrease" ? "decrease" : "increase",
    baseline: Number(row.baseline),
    target: Number(row.target),
    gamesRequired: row.gamesRequired,
    gamesObserved: row.gamesObserved,
    status: row.status as AssignmentStatus,
    average: evidence?.average ?? null,
    position: row.position,
    startedAt: row.startedAt.toISOString(),
  };
}

/** The assignment currently attached to a lesson — active or the last resolved one. */
export async function getAssignmentForLesson(
  userId: string,
  lessonId: string
): Promise<AssignmentView | null> {
  const row = await prisma.academyAssignment.findFirst({
    where: { userId, lessonId },
    orderBy: { startedAt: "desc" },
  });
  return row ? toView(row) : null;
}

export async function getActiveAssignments(userId: string): Promise<AssignmentView[]> {
  const rows = await prisma.academyAssignment.findMany({
    where: { userId, status: "active" },
    orderBy: { startedAt: "asc" },
  });
  return rows.map(toView);
}

// ── Opening ───────────────────────────────────────────────────────────────────

/** The target a lesson would set for this player, without writing anything. */
export async function previewAssignmentTarget(
  userId: string,
  lessonId: string
): Promise<AssignmentTarget | null> {
  const resolved = await resolveLesson(userId, lessonId);
  if (!resolved) return null;

  const { lesson, championId } = resolved;
  const baseline = await rankedBaseline(userId, lesson.assignment.metric, championId ?? undefined);
  return baseline === null ? null : buildAssignmentTarget(lesson, baseline.value);
}

/**
 * Starts the Proof of Practice clock for a lesson the player just completed. Silent no-op when
 * there is nothing to measure against — no linked account, or too few ranked games — because a
 * lesson must still complete for a player we cannot follow into their next match.
 */
export async function openAssignment(userId: string, lessonId: string): Promise<AssignmentView | null> {
  const resolved = await resolveLesson(userId, lessonId);
  if (!resolved) return null;

  const { lesson, championId } = resolved;
  const existing = await prisma.academyAssignment.findFirst({
    where: { userId, lessonId, status: "active" },
  });
  if (existing) return toView(existing);

  const baseline = await rankedBaseline(userId, lesson.assignment.metric, championId ?? undefined);
  if (baseline === null) return null;

  const target = buildAssignmentTarget(lesson, baseline.value);
  const row = await prisma.academyAssignment.create({
    data: {
      userId,
      lessonId,
      metric: target.metric,
      direction: target.direction,
      baseline: target.baseline,
      target: target.target,
      gamesRequired: target.games,
      position: baseline.position,
      championId,
    },
  });

  return toView(row);
}

/** Replaces a resolved assignment with a fresh one, re-measuring the baseline from today. */
export async function restartAssignment(
  userId: string,
  lessonId: string
): Promise<AssignmentView | null> {
  await prisma.academyAssignment.deleteMany({
    where: { userId, lessonId, status: { in: ["failed", "expired"] } },
  });
  return openAssignment(userId, lessonId);
}

// ── Checking ──────────────────────────────────────────────────────────────────

export interface CheckResult {
  checked: number;
  passed: string[];
  failed: string[];
  expired: string[];
}

/**
 * Marks a lesson mastered and pays the XP for it in one transaction. The amount comes from what
 * the row has already been paid, so a lesson that decayed to `review` and was mastered a second
 * time does not pay twice — XP is never taken back, so it must not be re-earnable either.
 */
async function grantMastery(userId: string, lessonId: string, now: Date): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const row = await tx.academyProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
      select: { xpAwarded: true },
    });
    if (!row) return;

    const owed = xpToAward(row.xpAwarded, "mastered");
    await tx.academyProgress.update({
      where: { userId_lessonId: { userId, lessonId } },
      data: {
        status: "mastered",
        masteredAt: now,
        // A mastery earned again starts its own decay window, so the old check is cleared.
        decayCheckedAt: null,
        ...(owed > 0 ? { xpAwarded: { increment: owed } } : {}),
      },
    });

    if (owed > 0) await awardXp(tx, userId, owed);
  });
}

/**
 * Measures every open assignment against the player's real matches. Runs after a match sync,
 * so it sees the games the moment they land. Passing is the only thing in the product that can
 * mark a lesson `mastered` — drills prove you read it, matches prove you did it.
 */
export async function checkAssignments(userId: string, riotAccountId: string): Promise<CheckResult> {
  const result: CheckResult = { checked: 0, passed: [], failed: [], expired: [] };

  const [open, puuid] = await Promise.all([
    prisma.academyAssignment.findMany({ where: { userId, status: "active" } }),
    getAccountPuuid(riotAccountId),
  ]);
  if (open.length === 0 || !puuid) return result;

  const now = new Date();

  for (const row of open) {
    const readings = await loadReadings({
      puuid,
      metric: row.metric as AssignmentMetric,
      since: row.startedAt,
      // Rows written before the role fix carry no position and stay role-blind.
      position: row.position ?? undefined,
      // Set only by a champion lesson; every other assignment is champion-blind.
      championId: row.championId ?? undefined,
      limit: row.gamesRequired,
      order: "asc",
    });

    const judgement = judgeAssignment({
      direction: row.direction === "decrease" ? "decrease" : "increase",
      target: Number(row.target),
      gamesRequired: row.gamesRequired,
      readings,
      startedAt: row.startedAt,
      now,
    });

    result.checked += 1;

    if (judgement.outcome === "pending") {
      // Still collecting. Record the count so the player can watch it fill up.
      if (judgement.gamesObserved !== row.gamesObserved) {
        await prisma.academyAssignment.update({
          where: { id: row.id },
          data: { gamesObserved: judgement.gamesObserved },
        });
      }
      continue;
    }

    await prisma.academyAssignment.update({
      where: { id: row.id },
      data: {
        gamesObserved: judgement.gamesObserved,
        status: judgement.outcome,
        evidence: toJsonInput(buildEvidence(judgement)),
        resolvedAt: now,
      },
    });

    if (judgement.outcome === "passed") {
      await grantMastery(userId, row.lessonId, now);
      result.passed.push(row.lessonId);
      logger.info(`[academy] ${row.lessonId} mastered by user ${userId}`);
    } else {
      result[judgement.outcome].push(row.lessonId);
    }
  }

  return result;
}
