import { prisma } from "@/lib/db/prisma";
import { getPlayerPerformanceProfile } from "@/domains/analysis";
import { getCurrentRank } from "@/domains/riot";
import type { PlayerPerformanceProfile } from "@/domains/analysis";

// What the coach sees before the session.
//
// The gap the research found: on every competing platform, coach prep still
// runs on "send me your OP.GG". We already hold the student's matches, so the
// coach can walk in having read them — and none of this is generated. It is the
// student's own data, shown to the one person they asked to look at it. No AI
// touches this file, by design.
//
// **Consent is structural, not a setting.** A coach sees this only because the
// student attached a Riot account to the booking, and only for that account.
// No attachment, nothing to see — which is also why this returns a shape with
// `shared: false` rather than an error.

export interface SessionPrep {
  shared: boolean;
  riotId: string | null;
  rank: {
    tier: string;
    division: string;
    lp: number;
    wins: number;
    losses: number;
  } | null;
  /** The matches the student specifically pointed at, if any. */
  flaggedMatchIds: string[];
  profile: PlayerPerformanceProfile | null;
  studentGoal: string;
}

/**
 * The prep for one booking, for the coach on it.
 *
 * Refused for anybody else — including the student, who has all of this on
 * their own dashboard already and does not need a second copy of it here.
 */
export async function sessionPrep(
  bookingId: string,
  userId: string
): Promise<SessionPrep | null> {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, coachProfile: { userId } },
    select: {
      studentGoal: true,
      matchIds: true,
      riotAccountId: true,
      riotAccount: { select: { id: true, gameName: true, tagLine: true } },
    },
  });

  if (!booking) return null;

  const base: SessionPrep = {
    shared: false,
    riotId: null,
    rank: null,
    flaggedMatchIds: booking.matchIds,
    profile: null,
    studentGoal: booking.studentGoal,
  };

  if (!booking.riotAccount) return base;

  const [rank, profile] = await Promise.all([
    getCurrentRank(booking.riotAccount.id),
    // A profile needs games to be about anything; an account with none throws
    // nothing but returns an empty one, which the UI reads as "no history yet".
    getPlayerPerformanceProfile(booking.riotAccount.id).catch(() => null),
  ]);

  return {
    ...base,
    shared: true,
    riotId: `${booking.riotAccount.gameName}#${booking.riotAccount.tagLine}`,
    rank: rank
      ? {
          tier: rank.tier,
          division: rank.division,
          lp: rank.lp,
          wins: rank.wins,
          losses: rank.losses,
        }
      : null,
    profile,
  };
}
