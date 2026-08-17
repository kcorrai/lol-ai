import { prismaReadonly } from "@/lib/db/prismaReadonly";
import { utcDateKey } from "@/domains/quiz/services/dailySeed";
import { isoWeekKey } from "@/domains/quiz/services/streakRules";
import {
  rankPlayers,
  type PlayerResults,
  type RankedPlayer,
} from "@/domains/quiz/services/leaderboardRanking";

export type LeaderboardPeriod = "today" | "week";

export interface QuizLeaderboard {
  period: LeaderboardPeriod;
  entries: RankedPlayer[];
  /** The viewer's own standing, whether or not they are listed above. */
  viewer: (RankedPlayer & { listed: boolean }) | null;
}

const BOARD_SIZE = 50;

/** Monday of the ISO week `now` falls in, at 00:00 UTC. */
function weekStart(now: Date): Date {
  const start = new Date(`${utcDateKey(now)}T00:00:00.000Z`);
  const weekday = (start.getUTCDay() + 6) % 7;
  start.setUTCDate(start.getUTCDate() - weekday);
  return start;
}

function periodStart(period: LeaderboardPeriod, now: Date): Date {
  return period === "today" ? new Date(`${utcDateKey(now)}T00:00:00.000Z`) : weekStart(now);
}

interface AttemptRow {
  userId: string;
  guessCount: number;
  completedAt: Date | null;
  user: {
    name: string | null;
    profileSlug: string | null;
    profilePublic: boolean;
    riotAccounts: { gameName: string }[];
  };
}

/** Riot game name first — it is what a League player recognises themselves by. */
function displayNameOf(user: AttemptRow["user"]): string {
  return user.riotAccounts[0]?.gameName ?? user.name ?? "Anonymous";
}

function group(rows: readonly AttemptRow[]): Map<string, PlayerResults> {
  const byUser = new Map<string, PlayerResults>();
  for (const row of rows) {
    const existing = byUser.get(row.userId);
    const at = row.completedAt ?? new Date(0);
    if (existing) {
      existing.solvedGuessCounts.push(row.guessCount);
      if (at > existing.lastSolvedAt) existing.lastSolvedAt = at;
    } else {
      byUser.set(row.userId, {
        userId: row.userId,
        displayName: displayNameOf(row.user),
        profileSlug: row.user.profileSlug,
        solvedGuessCounts: [row.guessCount],
        lastSolvedAt: at,
      });
    }
  }
  return byUser;
}

/**
 * The board for a period, plus the viewer's own line.
 *
 * Only players who have made their profile public are listed — the same consent
 * boundary the ranked leaderboard uses. The viewer always gets their own
 * standing back regardless, because that is their own data, with `listed`
 * saying whether anyone else can see it.
 */
export async function getQuizLeaderboard(
  period: LeaderboardPeriod,
  now: Date,
  viewerId?: string
): Promise<QuizLeaderboard> {
  const rows = (await prismaReadonly.quizAttempt.findMany({
    where: { solved: true, puzzleDate: { gte: periodStart(period, now) } },
    select: {
      userId: true,
      guessCount: true,
      completedAt: true,
      user: {
        select: {
          name: true,
          profileSlug: true,
          profilePublic: true,
          riotAccounts: {
            where: { isPrimary: true },
            select: { gameName: true },
            take: 1,
          },
        },
      },
    },
  })) as AttemptRow[];

  const publicRows = rows.filter((r) => r.user.profilePublic && r.user.profileSlug);
  const entries = rankPlayers([...group(publicRows).values()]).slice(0, BOARD_SIZE);

  let viewer: QuizLeaderboard["viewer"] = null;
  if (viewerId) {
    const listed = entries.find((e) => e.userId === viewerId);
    if (listed) {
      viewer = { ...listed, listed: true };
    } else {
      // Rank the viewer among everyone who played, not only the listed ones, so
      // a private profile still sees a truthful position.
      const all = rankPlayers([...group(rows).values()]);
      const own = all.find((e) => e.userId === viewerId);
      if (own) viewer = { ...own, listed: false };
    }
  }

  return { period, entries, viewer };
}

/** Which ISO week the weekly board covers, for the UI to label it with. */
export function currentWeekLabel(now: Date): string {
  return isoWeekKey(utcDateKey(now));
}
