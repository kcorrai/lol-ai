import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/utils/logger";
import { getActiveDuo, type ActiveDuo } from "@/domains/analysis/services/duoService";
import { loadDuoMatches, sharedOnly } from "@/domains/analysis/services/duoMatchLoader";
import {
  questsForWeek,
  weekWindow,
  type QuestDefinition,
  type QuestMatch,
} from "@/domains/analysis/services/duoQuestCatalog";

export interface DuoQuest {
  key: string;
  label: string;
  detail: string;
  /** Current value in the quest's own unit, capped at the target. */
  progress: number;
  target: number;
  completed: boolean;
  xpReward: number;
  periodEnd: string;
}

export interface DuoQuestsResponse {
  partner: ActiveDuo;
  weekStart: string;
  weekEnd: string;
  quests: DuoQuest[];
  /** XP awarded by this read, so the client can say something about it. */
  xpAwarded: number;
}

/**
 * This week's duo quests, with progress recomputed from the pair's shared matches.
 *
 * Generation happens on read rather than on a schedule: which quests run is a pure function of
 * the week (`questsForWeek`), so there is nothing a cron could compute that this cannot, and a
 * pair who never open the panel cost nothing. The unique index on
 * `(riotAccountId, partnerPuuid, key, periodStart)` is what makes repeated reads idempotent.
 *
 * Returns null when no duo is marked.
 */
export async function getDuoQuests(
  riotAccountId: string,
  now: Date = new Date(),
): Promise<DuoQuestsResponse | null> {
  const partner = await getActiveDuo(riotAccountId);
  if (!partner) return null;

  const { start, end } = weekWindow(now);
  const definitions = questsForWeek(start);

  const matches = await loadDuoMatches(riotAccountId, partner.puuid, { since: start });
  const shared: QuestMatch[] = sharedOnly(matches).map((m) => ({
    won: m.won,
    kills: m.kills,
    deaths: m.deaths,
    assists: m.assists,
    visionScore: m.visionScore,
    gameStart: m.gameStart,
  }));

  const stored = await prisma.duoQuest.findMany({
    where: { riotAccountId, partnerPuuid: partner.puuid, periodStart: start },
    select: { key: true, completed: true },
  });
  const completedKeys = new Set(stored.filter((q) => q.completed).map((q) => q.key));

  const quests: DuoQuest[] = [];
  let xpAwarded = 0;

  for (const definition of definitions) {
    const raw = definition.measure(shared);
    const progress = Math.min(raw, definition.target);
    const completed = progress >= definition.target;
    // Only the transition pays. A quest already marked complete is not paid again, which is what
    // stops a page refresh from being an XP button.
    const newlyCompleted = completed && !completedKeys.has(definition.key);

    await persist(riotAccountId, partner.puuid, definition, {
      start,
      end,
      progress,
      completed,
      newlyCompleted,
    });

    if (newlyCompleted) xpAwarded += definition.xpReward;

    quests.push({
      key: definition.key,
      label: definition.label,
      detail: definition.detail,
      progress,
      target: definition.target,
      completed,
      xpReward: definition.xpReward,
      periodEnd: end.toISOString(),
    });
  }

  return {
    partner,
    weekStart: start.toISOString(),
    weekEnd: end.toISOString(),
    quests,
    xpAwarded,
  };
}

interface PersistInput {
  start: Date;
  end: Date;
  progress: number;
  completed: boolean;
  newlyCompleted: boolean;
}

/**
 * Writes one quest's state, paying its XP in the same transaction when it has just completed.
 *
 * Same shape as `challengeProgressService`: the completion and the XP are one write or neither,
 * so a failed XP increment cannot leave a quest marked done and unpaid.
 *
 * A write failure here is logged and swallowed — the caller has already computed the correct
 * progress, and showing it beats failing the panel over a bookkeeping row.
 */
async function persist(
  riotAccountId: string,
  partnerPuuid: string,
  definition: QuestDefinition,
  { start, end, progress, completed, newlyCompleted }: PersistInput,
): Promise<void> {
  const data = {
    progress,
    completed,
    completedAt: completed ? new Date() : null,
    target: definition.target,
    xpReward: definition.xpReward,
    periodEnd: end,
  };

  try {
    await prisma.$transaction(async (tx) => {
      await tx.duoQuest.upsert({
        where: {
          riotAccountId_partnerPuuid_key_periodStart: {
            riotAccountId,
            partnerPuuid,
            key: definition.key,
            periodStart: start,
          },
        },
        create: { riotAccountId, partnerPuuid, key: definition.key, periodStart: start, ...data },
        update: data,
      });

      if (!newlyCompleted) return;

      const account = await tx.riotAccount.findUnique({
        where: { id: riotAccountId },
        select: { userId: true },
      });
      if (!account) return;

      await tx.user.update({
        where: { id: account.userId },
        data: { xp: { increment: definition.xpReward } },
      });
    });
  } catch (err) {
    logger.warn(
      `[duoQuest] Could not persist ${definition.key} for ${riotAccountId}: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }
}
