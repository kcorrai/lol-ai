import { prisma } from "@/lib/db/prisma";

const TIER_ORDER: Record<string, number> = {
  IRON: 0, BRONZE: 1, SILVER: 2, GOLD: 3, PLATINUM: 4,
  EMERALD: 5, DIAMOND: 6, MASTER: 7, GRANDMASTER: 8, CHALLENGER: 9,
};
const DIVISION_ORDER: Record<string, number> = { IV: 0, III: 1, II: 2, I: 3 };

function toGlobalLp(tier: string, division: string, lp: number): number {
  const tierBase = (TIER_ORDER[tier] ?? 0) * 400;
  const divBase = (DIVISION_ORDER[division] ?? 0) * 100;
  return tierBase + divBase + lp;
}

export interface LeaderboardEntry {
  rank: number;
  profileSlug: string;
  displayName: string;
  profileIconId: number | null;
  currentTier: string;
  currentDivision: string;
  currentLp: number;
  lpGained: number;
  wins: number;
  losses: number;
  winRate: number;
}

export async function getLeaderboard(period: "week" | "month" = "week"): Promise<LeaderboardEntry[]> {
  const since = new Date();
  since.setDate(since.getDate() - (period === "week" ? 7 : 30));

  const history = await prisma.rankedHistory.findMany({
    where: {
      recordedAt: { gte: since },
      queueType: "RANKED_SOLO_5x5",
      riotAccount: {
        isPrimary: true,
        user: {
          profilePublic: true,
          profileSlug: { not: null },
        },
      },
    },
    select: {
      riotAccountId: true,
      tier: true,
      division: true,
      lp: true,
      wins: true,
      losses: true,
      recordedAt: true,
      riotAccount: {
        select: {
          gameName: true,
          tagLine: true,
          profileIconId: true,
          user: { select: { profileSlug: true } },
        },
      },
    },
    orderBy: { recordedAt: "asc" },
  });

  // Group by account
  const byAccount = new Map<string, typeof history>();
  for (const entry of history) {
    const arr = byAccount.get(entry.riotAccountId) ?? [];
    arr.push(entry);
    byAccount.set(entry.riotAccountId, arr);
  }

  const results: LeaderboardEntry[] = [];

  for (const [, entries] of byAccount) {
    if (entries.length < 2) continue;

    const first = entries[0]!;
    const last = entries[entries.length - 1]!;

    const winsGained = last.wins - first.wins;
    const lossesGained = last.losses - first.losses;
    const gamesPlayed = winsGained + lossesGained;

    if (gamesPlayed < 3) continue;

    const lpGained =
      toGlobalLp(String(last.tier), String(last.division), last.lp) -
      toGlobalLp(String(first.tier), String(first.division), first.lp);

    const profileSlug = last.riotAccount.user.profileSlug!;

    results.push({
      rank: 0,
      profileSlug,
      displayName: `${last.riotAccount.gameName}#${last.riotAccount.tagLine}`,
      profileIconId: last.riotAccount.profileIconId,
      currentTier: String(last.tier),
      currentDivision: String(last.division),
      currentLp: last.lp,
      lpGained,
      wins: winsGained,
      losses: lossesGained,
      winRate: Math.round((winsGained / gamesPlayed) * 100),
    });
  }

  results.sort((a, b) => b.lpGained - a.lpGained);

  return results.slice(0, 50).map((r, i) => ({ ...r, rank: i + 1 }));
}
