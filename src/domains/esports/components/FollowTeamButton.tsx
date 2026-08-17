"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Star } from "lucide-react";
import { useFollowedTeams, useFollowTeam, useUnfollowTeam } from "@/hooks/useFollowedTeams";

const BASE =
  "tag-cut inline-flex items-center gap-1.5 border px-3 py-1.5 font-mono text-[11px] uppercase tracking-label transition-colors disabled:opacity-60";
const ON = "border-accent bg-accent/15 text-accent";
const OFF = "border-border bg-surface text-text-muted hover:border-accent/40 hover:text-text";

/**
 * Follow or unfollow a team (TASK-313).
 *
 * Signed out it is a link to sign in rather than a button that fails on click:
 * the esports section is deliberately public (ADR-016), so most readers seeing
 * this have no account, and a button that only tells you off is worse than an
 * honest invitation.
 *
 * It stays mounted while the query loads — a button that appears a beat after
 * the rest of the header is a button people miss.
 */
export function FollowTeamButton({
  teamId,
  slug,
  name,
}: {
  teamId: string;
  slug: string;
  name: string;
}): React.ReactElement {
  const { status } = useSession();
  const { data, isPending } = useFollowedTeams();
  const follow = useFollowTeam();
  const unfollow = useUnfollowTeam();

  if (status !== "authenticated") {
    return (
      <Link href={`/login?next=/esports/teams/${slug}`} className={`${BASE} ${OFF}`}>
        <Star aria-hidden className="h-3.5 w-3.5" />
        Follow
      </Link>
    );
  }

  const following = data?.follows.some((entry) => entry.teamId === teamId) ?? false;
  const busy = isPending || follow.isPending || unfollow.isPending;
  const atLimit = !following && data !== undefined && data.follows.length >= data.limit;

  return (
    <button
      type="button"
      disabled={busy || atLimit}
      onClick={() => (following ? unfollow.mutate(teamId) : follow.mutate(slug))}
      className={`${BASE} ${following ? ON : OFF}`}
      aria-pressed={following}
      title={atLimit ? `You can follow up to ${data?.limit} teams.` : undefined}
    >
      <Star aria-hidden className={`h-3.5 w-3.5 ${following ? "fill-current" : ""}`} />
      {following ? "Following" : "Follow"}
      <span className="sr-only"> {name}</span>
    </button>
  );
}
