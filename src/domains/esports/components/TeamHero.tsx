import { FollowTeamButton } from "@/domains/esports/components/FollowTeamButton";
import { FormStrip } from "@/domains/esports/components/FormStrip";
import { TeamCrest } from "@/domains/esports/components/TeamCrest";
import type { EsportsTeam } from "@/domains/esports/types";

interface TeamHeroProps {
  team: EsportsTeam;
  /** Newest-first, as `recentForm` returns it. */
  form: ("W" | "L")[];
  /** The season strip — `StatBlock`s in their own cells. */
  stats?: React.ReactNode;
  /** The breadcrumb, which sits inside the band rather than above it. */
  children?: React.ReactNode;
}

/**
 * The band a team page opens with.
 *
 * Full-bleed and lit, against the flat panels below it: on a page that is
 * otherwise a roster and two lists, the crest and the name are the only part
 * that says which team this is, and they have to carry the whole page.
 */
export function TeamHero({ team, form, stats, children }: TeamHeroProps): React.ReactElement {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <span className="bg-hero-fade absolute inset-0" aria-hidden />
      <span className="bg-scanline absolute inset-0" aria-hidden />

      <div className="relative mx-auto max-w-[1240px] px-5 pb-6 pt-7 md:px-8">
        {children}

        <div className="mt-4 flex flex-wrap items-end justify-between gap-x-7 gap-y-5">
          <div className="flex min-w-0 items-center gap-5">
            <TeamCrest src={team.image} code={team.code || team.name} size={74} accent />
            <div className="min-w-0">
              <h1 className="font-display text-[34px] font-black uppercase leading-[0.9] tracking-[0.02em] text-text md:text-[52px]">
                {team.name}
              </h1>
              <p className="mt-2.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-text-muted">
                {team.code}
                {team.league ? ` · ${team.league.name}` : ""}
                {team.league?.region ? ` · ${team.league.region}` : ""}
                {team.status === "archived" ? " · Archived" : ""}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-6">
            {form.length > 0 && (
              <div>
                <p className="hud-label mb-2">Form · last {form.length}</p>
                <FormStrip form={form} size={22} />
              </div>
            )}
            <FollowTeamButton teamId={team.id} slug={team.slug} name={team.name} />
          </div>
        </div>

        {/* Hairline gaps rather than borders: the cells share one grid line, so a
            strip of five reads as one instrument and not five small cards. */}
        {stats && (
          <div className="mt-6 grid gap-px border border-border bg-line-1 sm:grid-cols-2 lg:grid-cols-4">
            {stats}
          </div>
        )}
      </div>
    </section>
  );
}
