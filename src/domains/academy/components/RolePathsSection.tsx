import Link from "next/link";
import { roleTracksFor, trackCompletion } from "@/domains/academy/curriculum";
import { ROLE_LABEL } from "@/domains/academy/roles";
import { TrackCard } from "@/domains/academy/components/TrackCard";
import type { LessonStatus, RoleId } from "@/domains/academy/types";

interface RolePathsSectionProps {
  role: RoleId | null;
  statuses: Map<string, LessonStatus>;
}

/**
 * The role paths on the hub. Only one of the five is ever the player's, so only one is given a
 * card here — the other four are a row of links and the `/academy/roles` page. Putting all five
 * in the grid would tell a support main that most of the Academy is not for them.
 */
export function RolePathsSection({ role, statuses }: RolePathsSectionProps): React.ReactElement {
  const tracks = roleTracksFor(role);
  const mine = role ? tracks[0] : null;
  const rest = mine ? tracks.slice(1) : tracks;

  return (
    <section className="mt-12">
      <div className="flex items-center gap-3.5">
        <span className="hud-label">{"// Role paths"}</span>
        <span className="h-px flex-1 bg-line-1" />
        <Link
          href="/academy/roles"
          className="font-mono text-[11px] uppercase tracking-label text-text-muted transition-colors hover:text-accent"
        >
          All five →
        </Link>
      </div>

      <p className="mt-3 max-w-2xl text-[13.5px] leading-relaxed text-text-body">
        {mine
          ? `Your ranked games are mostly ${ROLE_LABEL[mine.role]}, so this is the path that is about them. Five short lessons covering only what is specific to the role — the curriculum above still applies to everybody.`
          : "Five short paths, one per role, covering only what is specific to that role. Link a Riot account and the Academy picks yours from the games you actually queue."}
      </p>

      {mine && (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <TrackCard
            track={mine}
            statuses={statuses}
            completion={trackCompletion(mine, statuses)}
            yours
          />
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {rest.map((track) => (
          <Link
            key={track.id}
            href={`/academy/${track.id}`}
            className="border border-border bg-surface px-3 py-1.5 font-mono text-[11px] uppercase tracking-label text-text-muted transition-colors hover:border-line-3 hover:text-accent"
          >
            {ROLE_LABEL[track.role]}
          </Link>
        ))}
      </div>
    </section>
  );
}
