import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { Errors } from "@/lib/api/errors";
import { getPlanLimits } from "@/lib/auth/planLimits";

/** Either the singleton client or a transaction client, so checks can run inside a transaction. */
type Db = Prisma.TransactionClient | typeof prisma;

export { PLAN_LIMITS, getPlanLimits } from "@/lib/auth/planLimits";
export type { PlanLimits } from "@/lib/auth/planLimits";

// ── Ownership ────────────────────────────────────────────────────────────────

export async function assertOwnsRiotAccount(userId: string, riotAccountId: string): Promise<void> {
  const account = await prisma.riotAccount.findFirst({
    where: { id: riotAccountId, userId },
    select: { id: true },
  });
  if (!account) throw Errors.riotAccountNotOwned();
}

// ── Account limits ───────────────────────────────────────────────────────────

export async function assertCanAddRiotAccount(userId: string): Promise<void> {
  const limits = await getPlanLimits(userId);
  const currentCount = await prisma.riotAccount.count({ where: { userId } });
  if (currentCount >= limits.maxRiotAccounts) throw Errors.accountLimitReached();
}

export async function assertCanDisconnectRiotAccount(userId: string): Promise<void> {
  const limits = await getPlanLimits(userId);
  // Free plan: one account, permanently locked — prevents data-scraping via connect/disconnect cycling
  if (limits.maxRiotAccounts === 1) throw Errors.cannotDisconnectOnFreePlan();
}

// ── Plan helpers ─────────────────────────────────────────────────────────────

export async function checkIsPro(userId: string): Promise<boolean> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: { plan: true, status: true },
  });
  const isActive = subscription?.status === "active" || subscription?.status === "trialing";
  return (
    isActive &&
    (subscription?.plan === "pro" ||
      subscription?.plan === "elite" ||
      subscription?.plan === "team")
  );
}

// ── Report limits ────────────────────────────────────────────────────────────

/**
 * Pass `db` a transaction client to make this check authoritative: on its own it is a
 * check-then-write race, because the caller inserts the report as a separate statement. The
 * quota only actually holds when this runs inside `withUserLock` alongside the insert (TASK-267).
 */
export async function assertCanGenerateReport(userId: string, db: Db = prisma): Promise<void> {
  const limits = await getPlanLimits(userId);

  // Monthly cap
  if (limits.reportsPerMonth !== -1) {
    const monthStart = new Date();
    monthStart.setDate(monthStart.getDate() - 30);

    const monthCount = await db.coachingReport.count({
      where: {
        riotAccount: { userId },
        createdAt: { gte: monthStart },
        status: { in: ["complete", "pending"] },
      },
    });

    if (monthCount >= limits.reportsPerMonth) throw Errors.reportLimitReached();
  }

  // Daily cap — prevents exhausting the monthly quota in one session
  if (limits.reportsPerDay !== -1) {
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const todayCount = await db.coachingReport.count({
      where: {
        riotAccount: { userId },
        createdAt: { gte: todayStart },
        status: { in: ["complete", "pending"] },
      },
    });

    if (todayCount >= limits.reportsPerDay) throw Errors.dailyReportLimitReached();
  }
}
