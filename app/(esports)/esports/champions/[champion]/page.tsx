import type { Metadata } from "next";
import Link from "next/link";
import { getProBuild, getProChampionIds, getPlayerIndex } from "@/domains/esports";
import type { ProBuildResult } from "@/domains/esports";
import { fetchItems } from "@/lib/ddragon/itemsData";
import { fetchRunes } from "@/lib/ddragon/runesData";
import { fetchChampionDetail } from "@/lib/ddragon/championsData";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { DataCredit } from "@/domains/esports/components/DataCredit";
import { EsportsBreadcrumb } from "@/domains/esports/components/EsportsBreadcrumb";
import { EsportsJsonLd } from "@/domains/esports/components/EsportsJsonLd";
import { ProAverages } from "@/domains/esports/components/ProAverages";
import { ProBuildPanel } from "@/domains/esports/components/ProBuildPanel";
import { RecentProGames, TopPlayers } from "@/domains/esports/components/ProChampionGames";
import { YouVsThePros } from "@/domains/esports/components/YouVsThePros";

export const revalidate = 86400;
export const dynamicParams = true;

interface PageProps {
  params: { champion: string };
}

/** Only champions with pro games are worth building ahead; the rest render on demand. */
export async function generateStaticParams(): Promise<{ champion: string }[]> {
  return (await getProChampionIds()).map((champion) => ({ champion }));
}

function pickRate(result: ProBuildResult): number {
  return result.meta.games > 0 ? (result.build.games / result.meta.games) * 100 : 0;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const result = await getProBuild(params.champion);
  const detail = await fetchChampionDetail(params.champion);
  const name = detail?.name ?? params.champion;

  if (!result) {
    return {
      title: `${name} in Pro Play`,
      description: `${name} has not been picked in the recent pro games on record. See what wins in ranked instead.`,
      alternates: { canonical: `/esports/champions/${params.champion}` },
      // A champion nobody is playing has no content here (ADR-017 §4). The page
      // still renders and still links onward; it just does not enter the index.
      robots: { index: false, follow: true },
    };
  }

  const { build } = result;
  const winRate = build.games > 0 ? Math.round((build.wins / build.games) * 100) : 0;

  return {
    title: `${name} Pro Builds — Items, Runes & Pick Rate`,
    description: `How pros build ${name}: the items and runes from ${build.games} recorded pro ${
      build.games === 1 ? "game" : "games"
    }, a ${winRate}% win rate, and who plays it.`,
    alternates: { canonical: `/esports/champions/${build.championId}` },
  };
}

function Header({
  name,
  championId,
  result,
}: {
  name: string;
  championId: string;
  result: ProBuildResult | null;
}): React.ReactElement {
  const winRate =
    result && result.build.games > 0
      ? Math.round((result.build.wins / result.build.games) * 100)
      : null;

  return (
    <header className="mb-8 flex flex-wrap items-start gap-4">
      <ChampionIcon name={championId} size={64} />
      <div className="min-w-0 flex-1">
        <h1 className="font-display text-3xl font-black uppercase text-text md:text-4xl">
          {name} in Pro Play
        </h1>
        {result ? (
          <p className="mt-1 font-mono text-[11px] uppercase tracking-label text-text-muted">
            {result.build.games} {result.build.games === 1 ? "game" : "games"} ·{" "}
            {pickRate(result).toFixed(0)}% pick rate · {winRate}% win rate
          </p>
        ) : (
          <p className="mt-1 font-mono text-[11px] uppercase tracking-label text-text-muted">
            no games on record
          </p>
        )}
      </div>
    </header>
  );
}

/**
 * The handoff.
 *
 * A pro build and a ranked build are answers to different questions, and the
 * gap between them is the interesting part — so this links across rather than
 * pretending the pro answer is the one a reader should copy into solo queue.
 */
function CrossLinks({ name, championId }: { name: string; championId: string }): React.ReactElement {
  return (
    <section className="mt-12">
      <h2 className="mb-3 font-display text-xl font-extrabold uppercase text-text md:text-2xl">
        The same champion, in your games
      </h2>
      <div className="grid gap-2 sm:grid-cols-3">
        <Link
          href={`/builds/${championId}`}
          className="gaming-card notch-sm px-4 py-3 transition-colors hover:border-line-2"
        >
          <span className="block font-display text-sm font-bold uppercase text-text">
            {name} build
          </span>
          <span className="mt-0.5 block text-xs text-text-muted">
            What actually wins in ranked, by win rate.
          </span>
        </Link>
        <Link
          href={`/counters/${championId}`}
          className="gaming-card notch-sm px-4 py-3 transition-colors hover:border-line-2"
        >
          <span className="block font-display text-sm font-bold uppercase text-text">
            {name} counters
          </span>
          <span className="mt-0.5 block text-xs text-text-muted">
            The picks that beat it, from real games.
          </span>
        </Link>
        <Link
          href={`/champions/${championId}`}
          className="gaming-card notch-sm px-4 py-3 transition-colors hover:border-line-2"
        >
          <span className="block font-display text-sm font-bold uppercase text-text">
            {name} overview
          </span>
          <span className="mt-0.5 block text-xs text-text-muted">
            Abilities, difficulty and where it fits.
          </span>
        </Link>
      </div>
    </section>
  );
}

export default async function ProChampionPage({ params }: PageProps): Promise<React.ReactElement> {
  const [result, detail] = await Promise.all([
    getProBuild(params.champion),
    fetchChampionDetail(params.champion),
  ]);

  const championId = result?.build.championId ?? detail?.id ?? params.champion;
  const name = detail?.name ?? championId;

  const [items, runes, playerIndex] = await Promise.all([
    fetchItems().catch(() => new Map()),
    fetchRunes().catch(() => new Map()),
    getPlayerIndex(),
  ]);

  // Handles in the game feed carry no slug, so player links are resolved through
  // the index by handle; anyone not in it renders as plain text.
  const slugByHandle = new Map(
    playerIndex.map((entry) => [entry.player.handle.toLowerCase(), entry.slug])
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 md:py-14">
      {result && (
        <EsportsJsonLd
          schema={{
            kind: "list",
            name: `Pro players on ${name}`,
            items: result.build.topPlayers.map((player) => {
              const slug = slugByHandle.get(player.handle.toLowerCase());
              return {
                name: player.handle,
                href: slug ? `/esports/players/${slug}` : undefined,
              };
            }),
          }}
        />
      )}

      <EsportsBreadcrumb
        items={[
          { name: "Champions", href: "/esports/champions" },
          { name, href: `/esports/champions/${championId}` },
        ]}
      />

      <Header name={name} championId={championId} result={result} />

      {!result ? (
        <p className="gaming-card notch-sm px-4 py-5 text-sm text-text-muted">
          No pro team has picked {name} in the games on record. That is a real answer about the
          current pro meta, not missing data — and it says nothing about whether {name} is worth
          playing in your own games.
        </p>
      ) : (
        <>
          <p className="mb-8 text-sm text-text-muted">
            From {result.meta.games} recorded pro {result.meta.games === 1 ? "game" : "games"}
            {result.meta.patches.length > 0
              ? ` on ${result.meta.patches.length === 1 ? "patch" : "patches"} ${result.meta.patches.join(", ")}`
              : ""}
            . Pro games are stage games on a fresh patch with a full draft behind them — the numbers
            below describe that, not solo queue.
          </p>

          <ProBuildPanel
            items={result.build.items}
            runes={result.build.runes}
            skillOrder={result.build.skillOrder}
            skillOrderGames={result.build.skillOrderGames}
            games={result.build.games}
            itemCatalogue={items}
            runeCatalogue={runes}
          />

          <ProAverages averages={result.build.averages} games={result.build.games} />

          <TopPlayers
            players={result.build.topPlayers}
            slugFor={(handle) => slugByHandle.get(handle.toLowerCase())}
          />

          <RecentProGames games={result.build.recentGames} />

          <YouVsThePros
            championId={result.build.championId}
            championName={name}
            pro={result.build.averages}
            proGames={result.build.games}
          />
        </>
      )}

      <CrossLinks name={name} championId={championId} />

      <p className="mt-12 text-sm text-text-muted">
        Back to the full{" "}
        <Link href="/esports/champions" className="text-accent hover:underline">
          pro champion meta
        </Link>
        .
      </p>

      <DataCredit className="mt-8" />
    </div>
  );
}
