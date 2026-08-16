import type { Metadata } from "next";
import Link from "next/link";
import { getLeagues, getProMeta, prominentLeagues } from "@/domains/esports";
import type { ProMeta } from "@/domains/esports";
import { DataCredit } from "@/domains/esports/components/DataCredit";
import { EsportsBreadcrumb } from "@/domains/esports/components/EsportsBreadcrumb";
import { EsportsJsonLd } from "@/domains/esports/components/EsportsJsonLd";
import { ProMetaTable } from "@/domains/esports/components/ProMetaTable";
import { PRO_META_SORTS, parseProMetaSort } from "@/domains/esports/proMetaSort";
import type { ProMetaSort } from "@/domains/esports/proMetaSort";

export const revalidate = 3600;

interface PageProps {
  searchParams: { league?: string; sort?: string };
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
  const scoped = Boolean(league) || parseProMetaSort(searchParams.sort) !== "picks";

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

function scopeHref(leagueSlug: string | undefined, sort: ProMetaSort): string {
  const params = new URLSearchParams();
  if (leagueSlug) params.set("league", leagueSlug);
  if (sort !== "picks") params.set("sort", sort);
  const query = params.toString();
  return query ? `/esports/champions?${query}` : "/esports/champions";
}

function Chip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`tag-cut px-2.5 py-1 font-mono text-[11px] uppercase tracking-label transition-colors ${
        active
          ? "bg-accent text-background"
          : "bg-surface-2 text-text-body hover:bg-surface hover:text-text"
      }`}
    >
      {children}
    </Link>
  );
}

/**
 * What the table is made of, stated before the table.
 *
 * A pick rate is meaningless without its sample, and this one is a rolling
 * window of recent series rather than a whole split — so it says how many games,
 * which patches and how recent.
 */
function SampleLine({ meta }: { meta: ProMeta }): React.ReactElement {
  const patches =
    meta.patches.length === 0
      ? null
      : meta.patches.length === 1
        ? `patch ${meta.patches[0]}`
        : `patches ${meta.patches[0]}–${meta.patches[meta.patches.length - 1]}`;

  return (
    <p className="hud-label">
      {meta.games} {meta.games === 1 ? "game" : "games"}
      {patches ? ` · ${patches}` : ""}
      {meta.lastGameAt ? ` · to ${meta.lastGameAt.slice(0, 10)}` : ""}
    </p>
  );
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

  const meta = await getProMeta(league ? { leagueId: league.id } : {});

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 md:py-14">
      <EsportsJsonLd
        schema={{
          kind: "list",
          name: league ? `${league.name} champion meta` : "Champions in pro play",
          items: (meta?.champions ?? []).slice(0, 30).map((champion) => ({
            name: champion.championId,
            href: `/builds/${champion.championId}`,
          })),
        }}
      />

      <EsportsBreadcrumb items={[{ name: "Champions", href: "/esports/champions" }]} />

      <header className="mb-6">
        <h1 className="font-display text-3xl font-black uppercase text-text md:text-4xl">
          {league ? `${league.name} Champion Meta` : "Pro Champion Meta"}
        </h1>
        <p className="mt-2 max-w-2xl text-text-body">
          Every champion pro teams have picked in the most recent series, how often, and how those
          games ended.
        </p>
      </header>

      <div className="mb-3 flex flex-wrap gap-1.5">
        <Chip href={scopeHref(undefined, sort)} active={!league}>
          All leagues
        </Chip>
        {scopes.map((scope) => (
          <Chip key={scope.id} href={scopeHref(scope.slug, sort)} active={league?.id === scope.id}>
            {scope.name}
          </Chip>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
        <nav aria-label="Sort" className="flex flex-wrap gap-1.5">
          {PRO_META_SORTS.map((option) => (
            <Chip
              key={option.key}
              href={scopeHref(league?.slug, option.key)}
              active={sort === option.key}
            >
              {option.label}
            </Chip>
          ))}
        </nav>
        {meta && <SampleLine meta={meta} />}
      </div>

      {!meta || meta.champions.length === 0 ? (
        <p className="gaming-card notch-sm px-4 py-5 text-sm text-text-muted">
          No recorded games in this scope yet. Riot publishes per-game stats for most leagues and,
          for some of the smaller ones, not at all — so a split between games leaves this table empty
          rather than wrong.
        </p>
      ) : (
        <>
          {meta.thinSample && (
            <p className="gaming-card notch-sm mb-4 px-4 py-3 text-sm text-text-muted">
              Only {meta.games} {meta.games === 1 ? "game" : "games"} in this sample. The table is
              here because hiding it would be worse, but a pick rate over this few games is an
              anecdote, not a trend.
            </p>
          )}

          <ProMetaTable champions={meta.champions} sort={sort} />

          {/* Bans are the obvious missing column, and their absence is a fact
              about the feed rather than an oversight — better said than left
              for a reader to wonder about. */}
          <p className="mt-4 text-xs text-text-faint">
            Picks only. Riot publishes the ten champions played in a game and nothing about what was
            banned, so no ban or presence figure is claimed here.
          </p>
        </>
      )}

      <p className="mt-12 text-sm text-text-muted">
        Wondering what wins in your own games instead? The{" "}
        <Link href="/tools/tier-list" className="text-accent hover:underline">
          ranked tier list
        </Link>{" "}
        and every{" "}
        <Link href="/builds" className="text-accent hover:underline">
          champion build
        </Link>{" "}
        are built from solo queue, where the answer is often a different one.
      </p>

      <DataCredit className="mt-8" />
    </div>
  );
}
