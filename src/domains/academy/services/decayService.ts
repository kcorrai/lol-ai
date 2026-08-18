import { prisma } from "@/lib/db/prisma";
import { getAccountPuuid } from "@/domains/riot";
import { DECAY_CHECK_DAYS, isDecayDue, judgeDecay } from "@/domains/academy/decay";
import { loadReadings, primaryRiotAccountId } from "@/domains/academy/services/assignmentReadings";
import type { AssignmentMetric } from "@/domains/academy/types";
import { logger } from "@/lib/utils/logger";

// The nightly half of the mastery lifecycle (ADR-027): a lesson mastered three weeks ago is
// re-measured against the same target, and drops to `review` if the player is no longer holding
// it. The judging lives in decay.ts; this file only reads and writes.

/** One night's work is bounded — the job runs again tomorrow. */
const BATCH_SIZE = 200;

export interface DecayResult {
  checked: number;
  holding: number;
  /** `userId/lessonId` for each mastery that came undone. */
  decayed: string[];
  /** Due, but the player has not played that role since the last check. Left alone. */
  unmeasured: number;
}

interface DueRow {
  id: string;
  userId: string;
  lessonId: string;
  masteredAt: Date | null;
  decayCheckedAt: Date | null;
}

function groupByUser(rows: DueRow[]): Map<string, DueRow[]> {
  const byUser = new Map<string, DueRow[]>();
  for (const row of rows) {
    const list = byUser.get(row.userId);
    if (list) list.push(row);
    else byUser.set(row.userId, [row]);
  }
  return byUser;
}

/**
 * Re-measures every mastery whose window has come round. The SQL filter is a coarse prefilter;
 * `isDecayDue` is the authority, so the rule lives in exactly one place.
 */
export async function checkMasteryDecay(now: Date = new Date()): Promise<DecayResult> {
  const result: DecayResult = { checked: 0, holding: 0, decayed: [], unmeasured: 0 };
  const cutoff = new Date(now.getTime() - DECAY_CHECK_DAYS * 86_400_000);

  const rows = (await prisma.academyProgress.findMany({
    where: {
      status: "mastered",
      masteredAt: { lte: cutoff },
      OR: [{ decayCheckedAt: null }, { decayCheckedAt: { lte: cutoff } }],
    },
    select: { id: true, userId: true, lessonId: true, masteredAt: true, decayCheckedAt: true },
    orderBy: { masteredAt: "asc" },
    take: BATCH_SIZE,
  })) as DueRow[];

  for (const [userId, userRows] of groupByUser(rows)) {
    const riotAccountId = await primaryRiotAccountId(userId);
    if (!riotAccountId) continue;

    const puuid = await getAccountPuuid(riotAccountId).catch(() => null);
    if (!puuid) continue;

    for (const row of userRows) {
      if (!row.masteredAt || !isDecayDue(row.masteredAt, row.decayCheckedAt, now)) continue;

      // The assignment that earned the mastery carries the metric, the role and the number.
      // Nothing is re-derived: a fresh baseline would move the goalposts every time the player
      // improved, and a mastery with no assignment behind it has nothing to re-measure.
      const assignment = await prisma.academyAssignment.findFirst({
        where: { userId, lessonId: row.lessonId, status: "passed" },
        orderBy: { resolvedAt: "desc" },
      });
      if (!assignment) continue;

      const readings = await loadReadings({
        puuid,
        metric: assignment.metric as AssignmentMetric,
        since: row.decayCheckedAt ?? row.masteredAt,
        position: assignment.position ?? undefined,
        championId: assignment.championId ?? undefined,
        limit: assignment.gamesRequired,
        order: "desc",
      });

      const verdict = judgeDecay({
        direction: assignment.direction === "decrease" ? "decrease" : "increase",
        target: Number(assignment.target),
        gamesRequired: assignment.gamesRequired,
        readings,
      });

      result.checked += 1;

      // Deliberately not stamped when unmeasured: the row is waiting for games, not for time,
      // so tomorrow's run should look again rather than sleep another three weeks.
      if (verdict === "unmeasured") {
        result.unmeasured += 1;
        continue;
      }

      await prisma.academyProgress.update({
        where: { id: row.id },
        data: {
          decayCheckedAt: now,
          ...(verdict === "decayed" ? { status: "review" as const } : {}),
        },
      });

      if (verdict === "decayed") {
        result.decayed.push(`${userId}/${row.lessonId}`);
        logger.info(`[academyDecay] ${row.lessonId} dropped to review for user ${userId}`);
      } else {
        result.holding += 1;
      }
    }
  }

  return result;
}
