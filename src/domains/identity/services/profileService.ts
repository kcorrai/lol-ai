import { prisma } from "@/lib/db/prisma";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProfileSettings {
  showRank: boolean;
  showWR: boolean;
  showBadges: boolean;
  showChampions: boolean;
}

export interface PublicProfileData {
  displayName: string;
  rank: { tier: string; division: string; lp: number } | null;
  winRate: number | null;
  topChampions: { name: string; games: number; winRate: number }[];
  badges: { id: string; name: string; tier: string; iconSlug: string }[];
  joinedAt: string;
  isPrivate: boolean;
  profileIconId: number | null;
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

export async function ensureProfileSlug(userId: string, gameName: string, tagLine: string): Promise<string> {
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
            orderBy: { recordedAt: "desc" },
            take: 1,
          },
          championStats: {
            orderBy: { gamesPlayed: "desc" },
            take: 3,
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
  const displayName = account
    ? `${account.gameName}#${account.tagLine}`
    : user.name ?? "Player";

  if (!user.profilePublic) {
    return {
      displayName,
      rank: null,
      winRate: null,
      topChampions: [],
      badges: [],
      joinedAt: user.createdAt.toISOString(),
      isPrivate: true,
      profileIconId: null,
    };
  }

  const settings: ProfileSettings = {
    ...DEFAULT_SETTINGS,
    ...(user.profileSettings as Partial<ProfileSettings> | null),
  };

  const latestRank = account?.rankedHistory[0] ?? null;

  const topChampions = settings.showChampions
    ? (account?.championStats ?? []).map((c) => ({
        name: c.champion.name,
        games: c.gamesPlayed,
        winRate: c.gamesPlayed > 0 ? Math.round((c.wins / c.gamesPlayed) * 100) : 0,
      }))
    : [];

  const allGames = (account?.championStats ?? []).reduce((s, c) => s + c.gamesPlayed, 0);
  const allWins = (account?.championStats ?? []).reduce((s, c) => s + c.wins, 0);
  const overallWR = allGames > 0 ? Math.round((allWins / allGames) * 100) : null;

  return {
    displayName,
    profileIconId: account?.profileIconId ?? null,
    rank: settings.showRank && latestRank
      ? { tier: latestRank.tier, division: latestRank.division, lp: latestRank.lp }
      : null,
    winRate: settings.showWR ? overallWR : null,
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
  await prisma.user.update({
    where: { id: userId },
    data: {
      ...(profilePublic !== undefined ? { profilePublic } : {}),
      ...(Object.keys(rest).length > 0 ? { profileSettings: rest } : {}),
    },
  });
}

export async function getProfileSettings(userId: string): Promise<ProfileSettings & { profilePublic: boolean; profileSlug: string | null }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { profilePublic: true, profileSettings: true, profileSlug: true },
  });

  return {
    profilePublic: user?.profilePublic ?? true,
    profileSlug: user?.profileSlug ?? null,
    ...DEFAULT_SETTINGS,
    ...(user?.profileSettings as Partial<ProfileSettings> | null),
  };
}
