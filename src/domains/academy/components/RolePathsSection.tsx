import Link from "next/link";
import { roleTracksFor, trackCompletion } from "@/domains/academy/curriculum";
import { ROLE_LABEL } from "@/domains/academy/roles";
import { ChampionTeaser } from "@/domains/academy/components/ChampionTeaser";
import { SectionHeading } from "@/domains/academy/components/SectionHeading";
import { TrackCard } from "@/domains/academy/components/TrackCard";
import type { ChampionOption } from "@/domains/academy/services/championLessonService";
import type { LessonStatus, RoleId } from "@/domains/academy/types";

interface RolePathsSectionProps {
  role: RoleId | null;
  statuses: Map<string, LessonStatus>;
  champions: ChampionOption[];
}

/**
 * The role paths on the hub. Only one of the five is ever the player's, so only one is given a
 * card here — the other four are a row of links and the `/academy/roles` page. Putting all five
 * in the grid would tell a support main that most of the Academy is not for them.
 *
 * The player's own champions sit beside it: both halves answer "what here is about *me*".
 */
export function RolePathsSection({
  role,
  statuses,
  champions,
}: RolePathsSectionProps): React.ReactElement {
  const tracks = roleTracksFor(role);
  const mine = role ? tracks[0] : null;
  const rest = mine ? tracks.slice(1) : tracks;

  return (
    <section className="mt-8">
      <SectionHeading label="Role paths" action={{ href: "/academy/roles", label: "All five" }} />

      <p className="mt-3 max-w-2xl text-[13.5px] leading-relaxed text-text-body">
        {mine
          ? `Your ranked games are mostly ${ROLE_LABEL[mine.role]}, so this is the path that is about them. Five short lessons covering only what is specific to the role — the curriculum above still applies to everybody.`
          : "Five short paths, one per role, covering only what is specific to that role. Link a Riot account and the Academy picks yours from the games you actually queue."}
      </p>

      <div className="mt-3.5 grid items-start gap-3.5 lg:grid-cols-2">
        {mine && (
          <TrackCard
            track={mine}
            statuses={statuses}
            completion={trackCompletion(mine, statuses)}
            yours
          />
        )}
        <ChampionTeaser champions={champions} statuses={statuses} />
      </div>

      <div className="mt-3.5 flex flex-wrap gap-2">
        <Link
          href="/academy/champion"
          className="tag-cut border border-accent/40 bg-surface px-3 py-1.5 font-mono text-[11px] uppercase tracking-label text-accent transition-colors hover:border-accent"
        >
          Your champions →
        </Link>
        {rest.map((track) => (
          <Link
            key={track.id}
            href={`/academy/${track.id}`}
            className="tag-cut border border-border bg-surface px-3 py-1.5 font-mono text-[11px] uppercase tracking-label text-text-muted transition-colors hover:border-line-3 hover:text-accent"
          >
            {ROLE_LABEL[track.role]}
          </Link>
        ))}
      </div>
    </section>
  );
}
