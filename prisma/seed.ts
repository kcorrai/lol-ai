import {
  PrismaClient,
  QueueType,
  Position,
  RankTier,
  RankDivision,
  ReportStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding development database...");

  // ── Champions (10 mock) ──────────────────────────────────────
  const champions = await Promise.all([
    upsertChampion(103, "Ahri", "the Nine-Tailed Fox", ["Mage", "Assassin"], 2),
    upsertChampion(64, "LeeSin", "the Blind Monk", ["Fighter", "Assassin"], 3),
    upsertChampion(412, "Thresh", "the Chain Warden", ["Support", "Fighter"], 3),
    upsertChampion(157, "Yasuo", "the Unforgiven", ["Fighter", "Assassin"], 3),
    upsertChampion(11, "MasterYi", "the Wuju Bladesman", ["Fighter", "Assassin"], 1),
    upsertChampion(222, "Jinx", "the Loose Cannon", ["Marksman"], 2),
    upsertChampion(238, "Zed", "the Master of Shadows", ["Assassin", "Fighter"], 3),
    upsertChampion(99, "Lux", "the Lady of Luminosity", ["Mage", "Support"], 1),
    upsertChampion(235, "Senna", "the Redeemer", ["Marksman", "Support"], 2),
    upsertChampion(57, "Maokai", "the Twisted Treant", ["Tank", "Support"], 1),
  ]);
  console.log(`  ✓ ${champions.length} champions upserted`);

  // ── Test User ────────────────────────────────────────────────
  const user = await prisma.user.upsert({
    where: { email: "dev@lolai.test" },
    update: {},
    create: {
      email: "dev@lolai.test",
      name: "DevPlayer",
      emailVerified: new Date(),
      profile: {
        create: {
          preferredRole: Position.MIDDLE,
          coachingStyle: "balanced",
          timezone: "UTC",
          language: "en",
        },
      },
      subscription: {
        create: {
          plan: "free",
          status: "active",
        },
      },
    },
  });
  console.log(`  ✓ Test user: ${user.email}`);

  // ── Riot Account ─────────────────────────────────────────────
  const riotAccount = await prisma.riotAccount.upsert({
    where: { puuid: "mock-puuid-devplayer-euw1-0000000000000000000000000000" },
    update: {},
    create: {
      userId: user.id,
      puuid: "mock-puuid-devplayer-euw1-0000000000000000000000000000",
      summonerId: "mock-summoner-id-001",
      accountId: "mock-account-id-001",
      gameName: "DevPlayer",
      tagLine: "TEST",
      summonerLevel: 142,
      profileIconId: 4361,
      region: "euw1",
      isPrimary: true,
      lastSyncedAt: new Date(),
    },
  });
  console.log(`  ✓ Riot account: ${riotAccount.gameName}#${riotAccount.tagLine}`);

  // ── Ranked History (5 snapshots — LP progression) ────────────
  const rankedSnapshots = [
    { tier: RankTier.GOLD, division: RankDivision.III, lp: 45, wins: 130, losses: 118 },
    { tier: RankTier.GOLD, division: RankDivision.III, lp: 67, wins: 133, losses: 120 },
    { tier: RankTier.GOLD, division: RankDivision.II, lp: 12, wins: 136, losses: 122 },
    { tier: RankTier.GOLD, division: RankDivision.II, lp: 54, wins: 140, losses: 124 },
    { tier: RankTier.GOLD, division: RankDivision.II, lp: 71, wins: 143, losses: 126 },
  ];
  for (let i = 0; i < rankedSnapshots.length; i++) {
    const snap = rankedSnapshots[i];
    await prisma.rankedHistory.create({
      data: {
        riotAccountId: riotAccount.id,
        queueType: QueueType.RANKED_SOLO_5x5,
        tier: snap.tier,
        division: snap.division,
        lp: snap.lp,
        wins: snap.wins,
        losses: snap.losses,
        recordedAt: new Date(Date.now() - (4 - i) * 24 * 60 * 60 * 1000),
      },
    });
  }
  console.log(`  ✓ ${rankedSnapshots.length} ranked snapshots created`);

  // ── 5 Sample Matches ──────────────────────────────────────────
  const matchData = [
    { champion: 103, champName: "Ahri", won: true, k: 9, d: 2, a: 11, cs: 198, vis: 32 },
    { champion: 103, champName: "Ahri", won: false, k: 3, d: 6, a: 5, cs: 154, vis: 21 },
    { champion: 103, champName: "Ahri", won: true, k: 12, d: 3, a: 8, cs: 212, vis: 38 },
    { champion: 238, champName: "Zed", won: false, k: 5, d: 7, a: 3, cs: 167, vis: 18 },
    { champion: 103, champName: "Ahri", won: true, k: 7, d: 2, a: 14, cs: 205, vis: 41 },
  ];

  for (let i = 0; i < matchData.length; i++) {
    const d = matchData[i];
    const gameStart = new Date(Date.now() - (5 - i) * 3 * 60 * 60 * 1000);
    const gameEnd = new Date(gameStart.getTime() + 32 * 60 * 1000);

    const match = await prisma.match.create({
      data: {
        matchId: `EUW1_${7000000000 + i}`,
        region: "euw1",
        queueId: 420,
        queueType: QueueType.RANKED_SOLO_5x5,
        gameMode: "CLASSIC",
        gameDuration: 1920 + i * 60,
        gameStart,
        gameEnd,
        gameVersion: "14.10.1",
        winningTeam: d.won ? 100 : 200,
        rawDataHash: `mock-hash-${i.toString().padStart(3, "0")}`,
      },
    });

    // Our tracked player (team 100)
    await prisma.matchParticipant.create({
      data: {
        matchId: match.id,
        riotAccountId: riotAccount.id,
        puuid: riotAccount.puuid,
        teamId: 100,
        championId: d.champion,
        championName: d.champName,
        position: Position.MIDDLE,
        kills: d.k,
        deaths: d.d,
        assists: d.a,
        cs: d.cs,
        csPerMinute: parseFloat((d.cs / 32).toFixed(2)),
        goldEarned: 13800 + d.k * 300,
        goldPerMinute: parseFloat(((13800 + d.k * 300) / 32).toFixed(2)),
        damageDealt: 32000 + d.k * 1500,
        damageTaken: 18000,
        damageHealed: 4500,
        visionScore: d.vis,
        wardsPlaced: Math.floor(d.vis / 3),
        wardsKilled: Math.floor(d.vis / 8),
        controlWardsBought: 2,
        turretsDestroyed: d.won ? 2 : 0,
        objectivesStolen: 0,
        firstBlood: d.k > 8,
        won: d.won,
        timeSpentDead: d.d * 24,
        totalTimeCCDealt: 180,
        itemIds: [3157, 4629, 3165, 3174, 3089, 3040],
        runePrimaryPath: 8100,
        runePrimaryKeystone: 8112,
        runeSecondaryPath: 8000,
        summonerSpell1: 4,
        summonerSpell2: 14,
      },
    });

    // 9 other participants (mocked, no riotAccountId)
    for (let j = 1; j < 10; j++) {
      const isBlueTeam = j < 5;
      const positions = [Position.TOP, Position.JUNGLE, Position.BOTTOM, Position.UTILITY];
      await prisma.matchParticipant.create({
        data: {
          matchId: match.id,
          riotAccountId: null,
          puuid: `mock-puuid-other-${i}-${j}`,
          teamId: isBlueTeam ? 100 : 200,
          championId: [64, 412, 222, 57, 99, 11, 235, 157, 99][j - 1],
          championName: ["LeeSin", "Thresh", "Jinx", "Maokai", "Lux", "MasterYi", "Senna", "Yasuo", "Lux"][j - 1],
          position: j === 1 ? Position.TOP : j === 2 ? Position.JUNGLE : j === 3 ? Position.BOTTOM : j === 4 ? Position.UTILITY : positions[(j - 5) % 4],
          kills: Math.floor(Math.random() * 8),
          deaths: Math.floor(Math.random() * 7) + 1,
          assists: Math.floor(Math.random() * 12),
          cs: Math.floor(Math.random() * 100) + 100,
          csPerMinute: parseFloat((Math.random() * 4 + 3).toFixed(2)),
          goldEarned: Math.floor(Math.random() * 5000) + 10000,
          goldPerMinute: parseFloat((Math.random() * 100 + 350).toFixed(2)),
          damageDealt: Math.floor(Math.random() * 20000) + 15000,
          damageTaken: Math.floor(Math.random() * 15000) + 10000,
          damageHealed: Math.floor(Math.random() * 3000),
          visionScore: Math.floor(Math.random() * 30) + 10,
          wardsPlaced: Math.floor(Math.random() * 10) + 3,
          wardsKilled: Math.floor(Math.random() * 5),
          controlWardsBought: Math.floor(Math.random() * 4),
          turretsDestroyed: 0,
          objectivesStolen: 0,
          firstBlood: false,
          won: isBlueTeam ? d.won : !d.won,
          timeSpentDead: Math.floor(Math.random() * 120) + 20,
          totalTimeCCDealt: Math.floor(Math.random() * 200),
          itemIds: [3157, 3165, 3174, 3089, 3040, 0],
          summonerSpell1: 4,
          summonerSpell2: 14,
        },
      });
    }
  }
  console.log(`  ✓ ${matchData.length} matches with 10 participants each created`);

  // ── Champion Stats (aggregated from mock matches) ──────────────
  await prisma.championStat.upsert({
    where: {
      riotAccountId_championId_queueType: {
        riotAccountId: riotAccount.id,
        championId: 103,
        queueType: QueueType.RANKED_SOLO_5x5,
      },
    },
    update: {},
    create: {
      riotAccountId: riotAccount.id,
      championId: 103,
      gamesPlayed: 4,
      wins: 3,
      losses: 1,
      avgKda: 7.25,
      avgKills: 7.75,
      avgDeaths: 2.75,
      avgAssists: 9.5,
      avgCs: 192.25,
      avgCsPerMinute: 6.01,
      avgVisionScore: 33.0,
      avgDamageDealt: 34275,
      avgGoldPerMin: 451.5,
      queueType: QueueType.RANKED_SOLO_5x5,
      computedAt: new Date(),
    },
  });
  console.log("  ✓ Champion stats computed");

  console.log("\n✅ Seed complete.");
  console.log("   User:    dev@lolai.test");
  console.log("   Riot ID: DevPlayer#TEST (euw1)");
  console.log("   Matches: 5 ranked games");
}

async function upsertChampion(
  id: number,
  key: string,
  title: string,
  roles: string[],
  difficulty: number
) {
  return prisma.champion.upsert({
    where: { id },
    update: { patchVersion: "14.10" },
    create: {
      id,
      key,
      name: key.replace(/([A-Z])/g, " $1").trim(),
      title,
      roles,
      difficulty,
      imageUrl: `https://ddragon.leagueoflegends.com/cdn/14.10.1/img/champion/${key}.png`,
      patchVersion: "14.10",
    },
  });
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
