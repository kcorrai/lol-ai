"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { useFollowedTeams } from "@/hooks/useFollowedTeams";

const PANEL = "notch border border-border bg-surface";
const PANEL_HEAD =
  "border-b border-line-1 px-4 py-3 font-mono text-[10.5px] uppercase tracking-label text-text-muted";

/**
 * The reader's followed teams, at the top of the hub rail (TASK-313).
 *
 * Renders nothing at all when signed out, still loading, or following nobody.
 * The hub is a public page that most readers arrive at from a search result,
 * and an empty panel telling them about a feature they have not opted into is
 * an advert in the position a useful panel should be.
 *
 * A client component on an ISR page on purpose: the page is cached for five
 * minutes and shared by everyone, so anything reader-specific has to be fetched
 * rather than rendered into it.
 */
export function HubFollowedTeams(): React.ReactElement | null {
  const { data } = useFollowedTeams();
  if (!data || data.follows.length === 0) return null;

  return (
    <section className={PANEL}>
      <div className={PANEL_HEAD}>{"// your teams"}</div>
      {data.follows.map((entry) => (
        <Link
          key={entry.teamId}
          href={`/esports/teams/${entry.slug}`}
          className="flex items-center gap-2.5 border-b border-line-1 px-4 py-2.5 last:border-b-0 hover:bg-surface-2/60"
        >
          <Star aria-hidden className="h-3.5 w-3.5 shrink-0 fill-current text-accent" />
          <span className="min-w-0 truncate text-sm text-text">{entry.name}</span>
        </Link>
      ))}
    </section>
  );
}
