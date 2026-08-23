import type { Metadata } from "next";
import { getMetaSnapshot, formatGamePatch, POSITION_LABELS } from "@/domains/meta";
import type { ChampionMetaStats } from "@/domains/meta";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { StatBlock } from "@/components/dashboard/laneiq/HudPanel";
import { ChampionConsole, type ChampionRow } from "@/components/champions/ChampionConsole";
import { ChampionMovers, type ChampionMover } from "@/components/champions/ChampionMovers";
import { PublicOnly } from "@/components/tools/PublicOnly";
import { RelatedTools } from "../RelatedTools";
import { championLane, championMovers, hoursAgo } from "@/components/champions/championIndex";

export const revalidate = 43200;

const LANES = ["All lanes", ...Object.values(POSITION_LABELS)];

export async function generateMetadata(): Promise<Metadata> {
  const snapshot = await getMetaSnapshot();
  const patch = snapshot ? formatGamePatch(snapshot.patch) : "";
  return {
    title: `LoL Champion Builds${patch ? ` — Patch ${patch}` : ""}`,
    description:
      "Highest win rate League of Legends builds: runes, items and skill order for every champion, from real ranked games. Free, updated every patch.",
    alternates: { canonical: "/builds" },
  };
}

function toRow(champion: ChampionMetaStats): ChampionRow {
  return {
    key: champion.championKey,
    name: champion.name,
    href: `/builds/${champion.championKey}`,
    group: championLane(champion),
    winRate: champion.overallWinRate,
    games: champion.overallGames || null,
    delta: champion.prevPatchRank ? champion.prevPatchRank - champion.overallRank : null,
  };
}

export default async function BuildsHubPage(): Promise<React.ReactElement> {
  const snapshot = await getMetaSnapshot();
  const champions = snapshot?.champions ?? [];
  const patch = snapshot ? formatGamePatch(snapshot.patch) : "";

  const movers: ChampionMover[] = championMovers(champions).map((champion) => ({
    key: champion.championKey,
    name: champion.name,
    href: `/builds/${champion.championKey}`,
    group: championLane(champion),
    winRate: champion.overallWinRate,
    games: champion.overallGames,
    delta: champion.prevPatchRank - champion.overallRank,
  }));

  return (
    <div className="mx-auto max-w-[1240px] px-5 py-12 md:px-8">
      <Breadcrumb
        items={[
          { name: "Free Tools", href: "/tools" },
          { name: "Builds", href: "/builds" },
        ]}
      />

      <PublicOnly>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-accent">
          Free Tool · No login required
        </p>
      </PublicOnly>

      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="font-display text-[34px] font-black uppercase leading-none tracking-[0.02em] text-text md:text-[42px]">
            Champion builds{patch ? ` — patch ${patch}` : ""}
          </h1>
          <p className="mt-3 max-w-[58ch] text-[15px] text-text-body">
            Runes, items and skill order with the highest win rate in every matchup. Built from
            ranked games, rebuilt every patch.
          </p>
        </div>
        {snapshot && (
          <div className="flex flex-wrap gap-7 pb-1">
            <StatBlock label="Champions" value={String(champions.length)} />
            <StatBlock
              label="Games parsed"
              value={snapshot.matchCount ? snapshot.matchCount.toLocaleString() : "—"}
            />
            <StatBlock label="Updated" value={`${hoursAgo(snapshot.fetchedAt)}h`} unit="ago" />
          </div>
        )}
      </div>

      {champions.length === 0 ? (
        <p className="notch mt-6 border border-dashed border-border px-4 py-12 text-center text-text-muted">
          Build data is unavailable right now. Please try again shortly.
        </p>
      ) : (
        <div className="mt-6 grid gap-5">
          <ChampionMovers movers={movers} />
          <ChampionConsole rows={champions.map(toRow)} groups={LANES} groupLabel="Lane" />
        </div>
      )}

      <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.12em] text-text-faint">
        Emerald+ ranked solo/duo · not endorsed by Riot Games
      </p>

      <RelatedTools exclude="/builds" />
    </div>
  );
}
