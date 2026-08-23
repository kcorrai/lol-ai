import { createTestPrisma } from "./helpers/db";
import { E2E_USER } from "./helpers/constants";

export default async function globalTeardown(): Promise<void> {
  const prisma = createTestPrisma();

  try {
    const user = await prisma.user.findUnique({
      where: { email: E2E_USER.email },
      select: { id: true },
    });
    if (!user) return;

    // Matches created by E2E connect tests don't have riotAccountId linkage for
    // participants, so clean by matchId prefix instead.
    await prisma.match.deleteMany({ where: { matchId: { startsWith: "E2E_SMOKE_" } } });

    await prisma.coachingReport.deleteMany({ where: { riotAccount: { userId: user.id } } });
    await prisma.rankedHistory.deleteMany({ where: { riotAccount: { userId: user.id } } });
    await prisma.championStat.deleteMany({ where: { riotAccount: { userId: user.id } } });
    await prisma.matchParticipant.deleteMany({ where: { riotAccount: { userId: user.id } } });
    await prisma.riotAccount.deleteMany({ where: { userId: user.id } });
    await prisma.webhookEvent.deleteMany({
      where: { eventKey: { startsWith: `weekly-email:${user.id}` } },
    });
    await prisma.subscription.deleteMany({ where: { userId: user.id } });
    await prisma.profile.deleteMany({ where: { userId: user.id } });
    await prisma.account.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });

    // Clean up any E2E-registered users (auth.spec.ts register tests)
    await prisma.user.deleteMany({ where: { email: { endsWith: "@e2e-reg.test" } } });
  } finally {
    await prisma.$disconnect();
  }
}
