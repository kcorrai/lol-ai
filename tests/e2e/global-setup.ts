import { execSync } from "child_process";
import { mkdirSync, writeFileSync } from "fs";
import bcrypt from "bcryptjs";
import { createTestPrisma } from "./helpers/db";
import {
  E2E_USER,
  E2E_RIOT_PRE,
  E2E_SHARE_TOKEN,
  E2E_MATCH_PREFIX,
  STATE_FILE,
} from "./helpers/constants";

// Module-level global setup — runs BEFORE the webServer starts.
// Responsibilities: run DB migrations, seed test data, write state file.
// No browser interaction here (server isn't running yet).
export default async function globalSetup(): Promise<void> {
  mkdirSync("tests/e2e/.auth", { recursive: true });

  const dbUrl = process.env.E2E_DATABASE_URL ?? process.env.DATABASE_URL ?? "";

  // Apply pending migrations to the E2E database
  execSync("npx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: dbUrl },
    stdio: ["ignore", "ignore", "pipe"],
  });

  const prisma = createTestPrisma();

  try {
    await seedTestData(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

async function seedTestData(prisma: Awaited<ReturnType<typeof createTestPrisma>>): Promise<void> {
  // ── Clean previous E2E data ──────────────────────────────────────────────
  // Delete in reverse FK order to avoid constraint violations
  const existing = await prisma.user.findUnique({ where: { email: E2E_USER.email }, select: { id: true } });
  if (existing) {
    await prisma.improvementPlan.deleteMany({ where: { riotAccount: { userId: existing.id } } });
    await prisma.coachingReport.deleteMany({ where: { riotAccount: { userId: existing.id } } });
    await prisma.rankedHistory.deleteMany({ where: { riotAccount: { userId: existing.id } } });
    await prisma.championStat.deleteMany({ where: { riotAccount: { userId: existing.id } } });
    await prisma.matchParticipant.deleteMany({ where: { riotAccount: { userId: existing.id } } });
    await prisma.riotAccount.deleteMany({ where: { userId: existing.id } });
    await prisma.webhookEvent.deleteMany({ where: { eventKey: { startsWith: `weekly-email:${existing.id}` } } });
    await prisma.subscription.deleteMany({ where: { userId: existing.id } });
    await prisma.profile.deleteMany({ where: { userId: existing.id } });
    await prisma.account.deleteMany({ where: { userId: existing.id } });
    await prisma.user.delete({ where: { id: existing.id } });
  }

  // Matches are not owned by the user, so deleting the user leaves them behind
  // and the next run collides on `matchId`. They are synthetic and named for it,
  // so clear them by prefix — unconditionally, since they outlive the user row.
  await prisma.matchParticipant.deleteMany({
    where: { match: { matchId: { startsWith: E2E_MATCH_PREFIX } } },
  });
  await prisma.match.deleteMany({ where: { matchId: { startsWith: E2E_MATCH_PREFIX } } });

  // ── Create test user ─────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash(E2E_USER.password, 10);

  const user = await prisma.user.create({
    data: {
      email: E2E_USER.email,
      name: E2E_USER.name,
      emailVerified: new Date(),
      // Connecting an account through the app calls `ensureProfileSlug`; seeding
      // the riotAccount row directly skips it, and then `/u/<slug>` 404s for a
      // user who has a public profile everywhere else. Same derivation as
      // `toProfileSlug`, which is what the app would have written.
      profileSlug: `${E2E_RIOT_PRE.gameName}-${E2E_RIOT_PRE.tagLine}`.replace(/[^a-zA-Z0-9-_]/g, "-"),
      // Mark onboarding done so the forced first-journey overlay (TASK-217) doesn't block the
      // other smoke specs. The guided-onboarding spec resets this to null for its own run.
      profile: { create: { emailWeeklyReport: false, onboardingCompletedAt: new Date() } },
      subscription: { create: { plan: "free", status: "active" } },
    },
    select: { id: true },
  });

  // Password hash stored in Account.access_token per ADR-003
  await prisma.account.create({
    data: {
      userId: user.id,
      type: "credentials",
      provider: "credentials",
      providerAccountId: E2E_USER.email,
      access_token: passwordHash,
    },
  });

  // ── Pre-connected Riot account (for coaching + share tests) ─────────────
  const riotAccount = await prisma.riotAccount.create({
    data: {
      userId: user.id,
      puuid: E2E_RIOT_PRE.mockPuuid,
      summonerId: "e2e-pre-summoner-id",
      accountId: "e2e-pre-account-id",
      gameName: E2E_RIOT_PRE.gameName,
      tagLine: E2E_RIOT_PRE.tagLine,
      summonerLevel: 88,
      profileIconId: 4361,
      region: E2E_RIOT_PRE.region,
      isPrimary: true,
    },
    select: { id: true },
  });

  // ── 5 recent ranked matches ──────────────────────────────────────────────
  const matchIds: string[] = [];
  for (let i = 0; i < 5; i++) {
    const gameStart = new Date(Date.now() - (5 - i) * 4 * 60 * 60 * 1000);
    const match = await prisma.match.create({
      data: {
        matchId: `${E2E_MATCH_PREFIX}${i.toString().padStart(3, "0")}`,
        region: "euw1",
        queueId: 420,
        queueType: "RANKED_SOLO_5x5",
        gameMode: "CLASSIC",
        gameDuration: 1800,
        gameStart,
        gameEnd: new Date(gameStart.getTime() + 30 * 60 * 1000),
        gameVersion: "14.10.1",
        winningTeam: i % 2 === 0 ? 100 : 200,
        rawDataHash: `e2e-smoke-hash-${i}`,
      },
      select: { id: true },
    });
    matchIds.push(match.id);

    await prisma.matchParticipant.create({
      data: {
        matchId: match.id,
        riotAccountId: riotAccount.id,
        puuid: E2E_RIOT_PRE.mockPuuid,
        // A real synced participant carries the Riot ID, and the scoreboard
        // prints it as the link to that player's profile — which the guided
        // journey spotlights. Without it the row falls back to the position and
        // the tour has nothing to click.
        gameName: E2E_RIOT_PRE.gameName,
        tagLine: E2E_RIOT_PRE.tagLine,
        teamId: 100,
        championId: 103,
        championName: "Ahri",
        position: "MIDDLE",
        kills: 7,
        deaths: 3,
        assists: 9,
        cs: 200,
        csPerMinute: "6.67",
        goldEarned: 14000,
        goldPerMinute: "466.67",
        damageDealt: 35000,
        damageTaken: 20000,
        damageHealed: 3000,
        visionScore: 28,
        wardsPlaced: 9,
        wardsKilled: 3,
        controlWardsBought: 2,
        turretsDestroyed: i % 2 === 0 ? 2 : 0,
        objectivesStolen: 0,
        firstBlood: false,
        won: i % 2 === 0,
        timeSpentDead: 60,
        totalTimeCCDealt: 150,
        itemIds: [3157, 4629, 3165, 3174, 3089, 0],
        summonerSpell1: 4,
        summonerSpell2: 14,
      },
    });
  }

  // ── Complete coaching report ─────────────────────────────────────────────
  const report = await prisma.coachingReport.create({
    data: {
      riotAccountId: riotAccount.id,
      reportType: "session_review",
      status: "complete",
      matchesAnalyzed: matchIds,
      summary: "Strong early game mechanics with consistent CS above 8 min. Your main area for improvement is vision control — focus on buying more control wards.",
      strengths: [
        { area: "Farming", description: "Consistent CS above 8/min", evidence: "8.2 CS/min average across 5 games" },
      ],
      weaknesses: [
        { area: "Vision Control", description: "Ward coverage below average", priority: "high", evidence: "28 avg vision score", rootCause: "Insufficient control ward purchases" },
      ],
      actionItems: [
        { priority: 1, action: "Purchase at least 2 control wards per game", howTo: "Add to your first-back buy list", expectedImpact: "+8 average vision score", timeframe: "Immediate" },
      ],
      coachPersonaResponse: "Your mechanics are solid — you belong in a higher tier. Fix your vision game and you will climb.",
      estimatedRankPotential: "Platinum II",
      championRecommendations: [
        { championName: "Ahri", reason: "Your most played champion with 60% win rate", priority: "high" },
      ],
      aiModelUsed: "gpt-4o-mini",
      processingTimeMs: 3200,
      completedAt: new Date(),
      shareToken: E2E_SHARE_TOKEN,
      // Dated two days back on purpose. A free plan allows one report a day, so a
      // seeded report stamped *now* spends the quota before the suite starts and
      // `coaching.spec`'s generate case can only ever be answered 429. The report
      // stands for work already done, which is what an older date says anyway.
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    select: { id: true },
  });

  // ── Active improvement plan ──────────────────────────────────────────────
  // The seeded user stands for someone who has already been using the app, so
  // the forced first journey fast-forwards past every step that waits on a
  // gate. `hasPlan` was the one gate nothing satisfied, which parked the tour
  // on "Create your first plan" with no way past it.
  await prisma.improvementPlan.create({
    data: {
      riotAccountId: riotAccount.id,
      status: "active",
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      targets: [
        {
          metric: "visionScore",
          label: "Vision score",
          baseline: 28,
          goal: 36,
          unit: "",
          direction: "increase",
        },
      ],
    },
  });

  // ── Write state file for tests to reference ─────────────────────────────
  writeFileSync(
    STATE_FILE,
    JSON.stringify({
      userId: user.id,
      riotAccountId: riotAccount.id,
      reportId: report.id,
      matchIds,
      shareToken: E2E_SHARE_TOKEN,
    })
  );
}
