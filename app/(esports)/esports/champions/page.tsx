import type { Metadata } from "next";
import {
  filterByRole,
  getLeagues,
  getProMeta,
  parseProMetaRole,
  parseProMetaSort,
  prominentLeagues,
  sortChampions,
} from "@/domains/esports";
import type { PlayerRole, ProMeta, ProMetaSort } from "@/domains/esports";
import { DataCredit } from "@/domains/esports/components/DataCredit";
import { EsportsBreadcrumb } from "@/domains/esports/components/EsportsBreadcrumb";
import { EsportsJsonLd } from "@/domains/esports/components/EsportsJsonLd";
import { EsportsPageHeader } from "@/domains/esports/components/EsportsPageHeader";
import { ProMetaFilters } from "@/domains/esports/components/ProMetaFilters";
import { ProMetaPodium } from "@/domains/esports/components/ProMetaPodium";
import { ProMetaSummary } from "@/domains/esports/components/ProMetaSummary";
import { ProMetaTable } from "@/domains/esports/components/ProMetaTable";
import { StatBlock } from "@/domains/esports/components/StatBlock";

export const revalidate = 3600;

interface PageProps {
  searchParams: { league?: string; sort?: string; role?: string };
}

/**
 * How many leagues get a scope chip. Twelve is where the row still fits and
 * still reaches LCK, LPL and LCP — the display bands alone would not, which is
 * why this uses the prominence order rather than `displayStatus`.
 */
const SCOPE_LEAGUES = 12;

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const leagues = await getLeagues();
  const league = searchParams.league
    ? prominentLeagues(leagues, SCOPE_LEAGUES).find((entry) => entry.slug === searchParams.league)
    : undefined;
  const scoped =
    Boolean(league) ||
    parseProMetaSort(searchParams.sort) !== "picks" ||
    parseProMetaRole(searchParams.role) !== null;

  return {
    title: league
      ? `${league.name} Champion Meta — Pro Picks & Win Rates`
      : "Pro Champion Meta — What the Pros Are Playing",
    description: league
      ? `Which champions ${league.name} teams actually pick, how often, and how those games go. Read from every recorded game of the split.`
      : "The champions pro teams are picking right now across every league, with pick rate, win rate and the role they are played in. Free, no login.",
    // Every scope is a view of the same table, so the unscoped one is canonical
    // and the rest are follow-only (ADR-017 §3).
    alternates: { canonical: "/esports/champions" },
    robots: scoped ? { index: false, follow: true } : undefined,
  };
}

function scopeHref(
  leagueSlug: string | undefined,
  sort: ProMetaSort,
  role: PlayerRole | null
): string {
  const params = new URLSearchParams();
  if (leagueSlug) params.set("league", leagueSlug);
  if (sort !== "picks") params.set("sort", sort);
  if (role) params.set("role", role);
  const query = params.toString();
  return query ? `/esports/champions?${query}` : "/esports/champions";
}

/** The sample's patch window, written the way a patch note names it. */
function patchWindow(meta: ProMeta): string {
  if (meta.patches.length === 0) return "—";
  if (meta.patches.length === 1) return meta.patches[0];
  return `${meta.patches[0]}–${meta.patches[meta.patches.length - 1]}`;
}

export default async function ProChampionsPage({
  searchParams,
}: PageProps): Promise<React.ReactElement> {
  const leagues = await getLeagues();
  const scopes = prominentLeagues(leagues, SCOPE_LEAGUES);
  const league = searchParams.league
    ? scopes.find((entry) => entry.slug === searchParams.league)
    : undefined;
  const sort = parseProMetaSort(searchParams.sort);
  const role = parseProMetaRole(searchParams.role);

  const meta = await getProMeta(league ? { leagueId: league.id } : {});
  // Sorted here rather than only inside the table, because the win-rate order
  // also drops champions with too few picks to rank — and the count under the
  // table has to say how many rows there actually are.
  const champions = sortChampions(filterByRole(meta?.champions ?? [], role), sort);

  return (
    <div className="mx-auto max-w-[1240px] px-5 pb-20 pt-7 md:px-8">
      <EsportsJsonLd
        schema={{
          kind: "list",
          name: league ? `${league.name} champion meta` : "Champions in pro play",
          items: champions.slice(0, 30).map((champion) => ({
            name: champion.championId,
            href: `/builds/${champion.championId}`,
          })),
        }}
      />

      <EsportsBreadcrumb items={[{ name: "Champions", href: "/esports/champions" }]} />

      <div className="mt-4">
        <EsportsPageHeader
          title={league ? `${league.name} champion meta` : "Pro champion meta"}
          lede="What pro teams actually picked in the most recent series, how often, and how those games ended. Stage games with a full draft behind them — not solo queue."
          stats={
            meta && (
              <>
                <StatBlock label="Games" value={String(meta.games)} />
                <StatBlock label="Patches" value={patchWindow(meta)} />
                <StatBlock
                  label="Through"
                  value={meta.lastGameAt ? meta.lastGameAt.slice(0, 10) : "—"}
                />
              </>
            )
          }
        />
      </div>

      {champions.length > 0 && sort === "picks" && (
        <section className="mt-6">
          <div className="mb-3 flex items-center gap-3">
            <span className="h-[7px] w-[7px] bg-accent" aria-hidden />
            <h2 className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-text">
              Most contested this window
            </h2>
            <span className="h-px flex-1 bg-line-1" aria-hidden />
            <span className="hud-label hidden sm:inline">Pick rate across the sample</span>
          </div>
          <ProMetaPodium champions={champions} />
        </section>
      )}

      <div className="mt-6">
        <ProMetaFilters
          scopes={scopes}
          league={league}
          sort={sort}
          role={role}
          href={scopeHref}
        />
      </div>

      {!meta || champions.length === 0 ? (
        <p className="gaming-card notch-sm mt-5 px-4 py-5 text-sm text-text-muted">
          {meta
            ? "Nothing in this sample survives that filter. Clear the role, widen the league scope, or sort by picks — the win-rate order leaves out champions with too few picks to rank."
            : "No recorded games in this scope yet. Riot publishes per-game stats for most leagues and, for some of the smaller ones, not at all — so a split between games leaves this table empty rather than wrong."}
        </p>
      ) : (
        <>
          {meta.thinSample && (
            <p className="gaming-card notch-sm mt-5 px-4 py-3 text-sm text-text-muted">
              Only {meta.games} {meta.games === 1 ? "game" : "games"} in this sample. The table is
              here because hiding it would be worse, but a pick rate over this few games is an
              anecdote, not a trend.
            </p>
          )}

          <div className="mt-5">
            <ProMetaTable champions={champions} sort={sort} />
          </div>

          <div className="mt-3.5 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 font-mono text-[10px] uppercase tracking-[0.12em] text-text-faint">
            <span>{champions.length} champions shown</span>
            {/* Bans are the obvious missing column, and their absence is a fact
                about the feed rather than an oversight — better said than left
                for a reader to wonder about. */}
            <span>Picks only · Riot publishes no ban data, so none is claimed here</span>
          </div>
        </>
      )}

      <ProMetaSummary
        meta={meta}
        patches={meta ? patchWindow(meta) : "—"}
        scope={league ? league.name : "All leagues"}
      />

      <DataCredit className="mt-8" />
    </div>
  );
}
