import { getTeam, getTeams } from "@/domains/esports/services/teamService";
import { prisma } from "@/lib/db/prisma";
import type { FollowedTeamEntry } from "@/domains/esports/types";

// Following a team is the one thing in this section that writes to Postgres
// (TASK-313). Everything else is a cache over a feed we do not own (ADR-016),
// and stays that way: what is stored here is a reader's choice, not the feed's
// data. The two fields that look like feed data — name and slug — are copies
// kept so a follow list never has to ask the feed anything.

/** Nobody needs a hundred teams on a dashboard, and it bounds the write path. */
export const MAX_FOLLOWS = 20;

/** A reader's followed teams, most recently followed first. */
export async function listFollows(userId: string): Promise<FollowedTeamEntry[]> {
  const rows = await prisma.followedTeam.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { teamId: true, teamName: true, teamSlug: true, createdAt: true },
  });

  return rows.map((row) => ({
    teamId: row.teamId,
    name: row.teamName,
    slug: row.teamSlug,
    followedAt: row.createdAt.toISOString(),
  }));
}

/** Just the ids, for deciding how a follow button should render. */
export async function followedTeamIds(userId: string): Promise<Set<string>> {
  const rows = await prisma.followedTeam.findMany({
    where: { userId },
    select: { teamId: true },
  });
  return new Set(rows.map((row) => row.teamId));
}

export type FollowOutcome =
  | { ok: true; entry: FollowedTeamEntry }
  | { ok: false; reason: "unknown-team" | "limit-reached" };

/**
 * Follow a team by its slug.
 *
 * The slug is what a reader has — it is in the URL of the page the button sits
 * on — but it is not what gets stored: slugs are reused across 53 teams and
 * resolution ranks candidates, so the row hangs on the feed's id instead. The
 * name and slug ride along as a copy, which is what lets `listFollows` answer
 * without a feed read and lets a follow outlive its team leaving the feed.
 *
 * Following twice is not an error. The button is the same button either way,
 * and a reader who double-clicks it has not done anything wrong.
 */
export async function followTeam(userId: string, slug: string): Promise<FollowOutcome> {
  const team = await getTeam(slug);
  if (!team) return { ok: false, reason: "unknown-team" };

  const existing = await prisma.followedTeam.findUnique({
    where: { userId_teamId: { userId, teamId: team.id } },
    select: { createdAt: true },
  });

  if (existing) {
    return {
      ok: true,
      entry: {
        teamId: team.id,
        name: team.name,
        slug: team.slug,
        followedAt: existing.createdAt.toISOString(),
      },
    };
  }

  // Counted rather than enforced in the schema: a limit is a product decision
  // and moves, and a check constraint on a count is not something Postgres does
  // without a trigger.
  const count = await prisma.followedTeam.count({ where: { userId } });
  if (count >= MAX_FOLLOWS) return { ok: false, reason: "limit-reached" };

  const row = await prisma.followedTeam.create({
    data: { userId, teamId: team.id, teamName: team.name, teamSlug: team.slug },
    select: { createdAt: true },
  });

  return {
    ok: true,
    entry: {
      teamId: team.id,
      name: team.name,
      slug: team.slug,
      followedAt: row.createdAt.toISOString(),
    },
  };
}

/**
 * Unfollow by team id.
 *
 * By id and not by slug, because a reader must be able to undo a follow whose
 * team has since left the feed — resolving the slug first would make exactly
 * that case impossible. Returns whether a row went, so a double unfollow is a
 * no-op rather than a 404.
 */
export async function unfollowTeam(userId: string, teamId: string): Promise<boolean> {
  const { count } = await prisma.followedTeam.deleteMany({ where: { userId, teamId } });
  return count > 0;
}

/**
 * Followed teams with their next and last match, for the dashboard block.
 *
 * One `getTeams` read covers every follow, so this costs the same for one
 * followed team as for twenty. A team the feed no longer publishes keeps its
 * stored name and returns no fixtures, rather than vanishing from the list.
 */
export async function followsWithTeams(
  userId: string
): Promise<{ entry: FollowedTeamEntry; live: boolean }[]> {
  const follows = await listFollows(userId);
  if (follows.length === 0) return [];

  const teams = await getTeams();
  const known = new Set((teams ?? []).map((team) => team.id));

  return follows.map((entry) => ({ entry, live: known.has(entry.teamId) }));
}
