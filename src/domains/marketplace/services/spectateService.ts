import { prisma } from "@/lib/db/prisma";
import { getLiveDraft } from "@/domains/riot";

// Live game coaching: the coach watches the student play and debriefs after.
//
// There is nothing to build a video pipeline for here — the coach spectates in
// their own client. What the platform is good for is the part that is otherwise
// a scramble in a Discord DM: whether the student is in a game *right now*, and
// which one.
//
// Only for a booking of this kind, only for its coach, and only against the
// account the student attached — the same consent rule as session prep.

export interface SpectateStatus {
  /** False when the student never attached an account. Nothing to watch. */
  shared: boolean;
  riotId: string | null;
  region: string | null;
  inGame: boolean;
  gameMode: string | null;
  /** Seconds since the game started, so the coach knows what they are joining. */
  gameLength: number | null;
  /** The student's own champion, when we could work it out. */
  championName: string | null;
}

/**
 * Whether the student is playing, for the coach on a live-spectate booking.
 *
 * Returns null when the caller is not that coach — including for the student,
 * who does not need the platform to tell them whether they are in a game.
 */
export async function spectateStatus(
  bookingId: string,
  userId: string
): Promise<SpectateStatus | null> {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, kind: "LIVE_SPECTATE", coachProfile: { userId } },
    select: {
      riotAccount: { select: { id: true, gameName: true, tagLine: true, region: true } },
    },
  });

  if (!booking) return null;

  const account = booking.riotAccount;
  if (!account) {
    return {
      shared: false,
      riotId: null,
      region: null,
      inGame: false,
      gameMode: null,
      gameLength: null,
      championName: null,
    };
  }

  const base = {
    shared: true,
    riotId: `${account.gameName}#${account.tagLine}`,
    region: account.region,
  };

  // A Riot outage or a rate limit must not break the session page — a coach who
  // cannot see the live state can still just look in their own client.
  const live = await getLiveDraft(account.id).catch(() => ({ inGame: false as const }));

  if (!live.inGame) {
    return { ...base, inGame: false, gameMode: null, gameLength: null, championName: null };
  }

  return {
    ...base,
    inGame: true,
    gameMode: live.gameMode,
    gameLength: live.gameLength,
    championName: live.yourMatchup?.champion ?? null,
  };
}
