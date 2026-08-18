import Link from "next/link";
import { FormStrip } from "@/domains/esports/components/FormStrip";
import { MatchTime } from "@/domains/esports/components/MatchTime";
import { TeamCrest } from "@/domains/esports/components/TeamCrest";
import type { EsportsTeam } from "@/domains/esports/types";

interface FeaturedTeamCardProps {
  team: EsportsTeam;
  /** Newest-first, as `recentForm` returns it. Empty when nothing is recorded. */
  form: ("W" | "L")[];
  /** Kickoff of the match that put this team on the strip, ISO 8601. */
  startTime: string;
  /** That match is under way — the card goes red and the clock gives way. */
  live: boolean;
}

/**
 * A team that is playing right now or within the day.
 *
 * The strip this fills is the answer to "who is on today", which is the only
 * question a team index can answer that a search box cannot — so the cards carry
 * form and a kickoff rather than being bigger versions of the tiles below.
 */
export function FeaturedTeamCard({
  team,
  form,
  startTime,
  live,
}: FeaturedTeamCardProps): React.ReactElement {
  return (
    <Link
      href={`/esports/teams/${team.slug}`}
      className={`notch block px-4 py-4 transition-colors ${
        live
          ? "border border-danger bg-surface shadow-[0_0_26px_rgba(255,90,90,0.10)] hover:bg-surface-2"
          : "bg-hero-fade border border-border bg-surface hover:border-line-2 hover:bg-surface-2"
      }`}
    >
      <span className="flex items-center gap-3.5">
        <TeamCrest src={team.image} code={team.code || team.name} size={42} accent={live} />
        <span className="min-w-0">
          <span className="block truncate font-display text-xl font-extrabold uppercase tracking-[0.05em] text-text">
            {team.code || team.name}
          </span>
          <span className="mt-0.5 block truncate font-mono text-[9.5px] uppercase tracking-label text-text-faint">
            {team.name}
            {team.league ? ` · ${team.league.name}` : ""}
          </span>
        </span>
      </span>

      <span className="mt-3.5 flex items-center justify-between gap-3 border-t border-line-1 pt-2.5">
        {form.length > 0 ? (
          <FormStrip form={form} size={16} />
        ) : (
          <span className="hud-label">No recorded results</span>
        )}
        {live ? (
          <span className="flex shrink-0 items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.12em] text-danger">
            <span className="h-1.5 w-1.5 bg-danger motion-safe:animate-pulse" aria-hidden />
            Live now
          </span>
        ) : (
          <MatchTime
            startTime={startTime}
            className="shrink-0 text-right font-mono text-[10.5px] uppercase tracking-[0.12em] text-text-muted"
          />
        )}
      </span>
    </Link>
  );
}
