import { prisma } from "@/lib/db/prisma";
import { mergeProfileSettings, type ProfileSettingsPatch } from "@/lib/db/profileSettingsStore";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProfileSettings {
  showRank: boolean;
  showWR: boolean;
  showBadges: boolean;
  showChampions: boolean;
}

export interface PublicChampion {
  name: string;
  games: number;
  wins: number;
  winRate: number;
  avgKda: number;
  avgCsPerMinute: number;
  avgVisionScore: number;
  masteryLevel: number | null;
  masteryPoints: number | null;
}

export interface PublicProfileData {
  displayName: string;
  region: string | null;
  profileIconId: number | null;
  rank: {
    tier: string;
    division: string;
    lp: number;
    wins: number;
    losses: number;
    hotStreak: boolean;
  } | null;
  winRate: number | null;
  totalGames: number;
  avgKda: number | null;
  topChampions: PublicChampion[];
  badges: { id: string; name: string; tier: string; iconSlug: string }[];
  joinedAt: string;
  isPrivate: boolean;
}

const DEFAULT_SETTINGS: ProfileSettings = {
  showRank: true,
  showWR: true,
  showBadges: true,
  showChampions: true,
};

// ── Slug helpers ──────────────────────────────────────────────────────────────

export function toProfileSlug(gameName: string, tagLine: string): string {
  return `${gameName}-${tagLine}`.replace(/[^a-zA-Z0-9\-_]/g, "-");
}

export async function ensureProfileSlug(
  userId: string,
  gameName: string,
  tagLine: string
): Promise<string> {
  const slug = toProfileSlug(gameName, tagLine);
  await prisma.user.update({
    where: { id: userId },
    data: { profileSlug: slug },
  });
  return slug;
}

// ── Public data builder ───────────────────────────────────────────────────────

export async function getPublicProfile(slug: string): Promise<PublicProfileData | null> {
  const user = await prisma.user.findUnique({
    where: { profileSlug: slug },
    include: {
      riotAccounts: {
        where: { isPrimary: true },
        include: {
          rankedHistory: {
            where: { queueType: "RANKED_SOLO_5x5" },
            orderBy: { recordedAt: "desc" },
            take: 1,
          },
          championStats: {
            where: { queueType: "RANKED_SOLO_5x5" },
            orderBy: { gamesPlayed: "desc" },
            take: 5,
            include: { champion: { select: { name: true } } },
          },
        },
        take: 1,
      },
      userAchievements: {
        where: { seen: true },
        include: { achievement: { select: { id: true, name: true, tier: true, iconSlug: true } } },
        take: 6,
        orderBy: { earnedAt: "desc" },
      },
    },
  });

  if (!user) return null;

  const account = user.riotAccounts[0];
  const displayName = account ? `${account.gameName}#${account.tagLine}` : (user.name ?? "Player");

  if (!user.profilePublic) {
    return {
      displayName,
      region: null,
      profileIconId: null,
      rank: null,
      winRate: null,
      totalGames: 0,
      avgKda: null,
      topChampions: [],
      badges: [],
      joinedAt: user.createdAt.toISOString(),
      isPrivate: true,
    };
  }

  const settings: ProfileSettings = {
    ...DEFAULT_SETTINGS,
    ...(user.profileSettings as Partial<ProfileSettings> | null),
  };

  const latestRank = account?.rankedHistory[0] ?? null;
  const stats = account?.championStats ?? [];

  const topChampions: PublicChampion[] = settings.showChampions
    ? stats.map((c) => ({
        name: c.champion.name,
        games: c.gamesPlayed,
        wins: c.wins,
        winRate: c.gamesPlayed > 0 ? Math.round((c.wins / c.gamesPlayed) * 100) : 0,
        avgKda: parseFloat(Number(c.avgKda).toFixed(2)),
        avgCsPerMinute: parseFloat(Number(c.avgCsPerMinute).toFixed(1)),
        avgVisionScore: parseFloat(Number(c.avgVisionScore).toFixed(1)),
        masteryLevel: c.masteryLevel ?? null,
        masteryPoints: c.masteryPoints ? Number(c.masteryPoints) : null,
      }))
    : [];

  const totalGames = stats.reduce((s, c) => s + c.gamesPlayed, 0);
  const totalWins = stats.reduce((s, c) => s + c.wins, 0);
  const overallWR = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : null;

  // Weighted average KDA across top champions
  const kdaSum = stats.reduce((s, c) => s + Number(c.avgKda) * c.gamesPlayed, 0);
  const avgKda = totalGames > 0 ? parseFloat((kdaSum / totalGames).toFixed(2)) : null;

  return {
    displayName,
    region: account?.region ?? null,
    profileIconId: account?.profileIconId ?? null,
    rank:
      settings.showRank && latestRank
        ? {
            tier: latestRank.tier,
            division: latestRank.division,
            lp: latestRank.lp,
            wins: latestRank.wins,
            losses: latestRank.losses,
            hotStreak: latestRank.hotStreak,
          }
        : null,
    winRate: settings.showWR ? overallWR : null,
    totalGames,
    avgKda,
    topChampions,
    badges: settings.showBadges
      ? user.userAchievements.map((ua) => ({
          id: ua.achievement.id,
          name: ua.achievement.name,
          tier: ua.achievement.tier,
          iconSlug: ua.achievement.iconSlug,
        }))
      : [],
    joinedAt: user.createdAt.toISOString(),
    isPrivate: false,
  };
}

export async function updateProfileSettings(
  userId: string,
  settings: Partial<ProfileSettings & { profilePublic: boolean }>
): Promise<void> {
  const { profilePublic, ...rest } = settings;

  if (profilePublic !== undefined) {
    await prisma.user.update({ where: { id: userId }, data: { profilePublic } });
  }

  // Merged, never assigned. Assigning dropped every key the caller did not send:
  // toggling `showRank` alone reset the other three visibility flags to their
  // defaults — which are *shown* — and deleted the pending-deletion stamp that
  // `gdprErasure` reads to decide whether an erasure is still wanted.
  if (Object.keys(rest).length > 0) {
    await mergeProfileSettings(userId, rest as ProfileSettingsPatch);
  }
}

export async function getProfileSettings(
  userId: string
): Promise<ProfileSettings & { profilePublic: boolean; profileSlug: string | null }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { profilePublic: true, profileSettings: true, profileSlug: true },
  });

  // Picked key by key rather than spread: the column also carries the pending
  // deletion stamp and the 2FA challenge stamp, and neither belongs in the
  // visibility payload this endpoint returns.
  const stored = (user?.profileSettings ?? null) as Partial<ProfileSettings> | null;

  return {
    profilePublic: user?.profilePublic ?? true,
    profileSlug: user?.profileSlug ?? null,
    showRank: stored?.showRank ?? DEFAULT_SETTINGS.showRank,
    showWR: stored?.showWR ?? DEFAULT_SETTINGS.showWR,
    showBadges: stored?.showBadges ?? DEFAULT_SETTINGS.showBadges,
    showChampions: stored?.showChampions ?? DEFAULT_SETTINGS.showChampions,
  };
}
