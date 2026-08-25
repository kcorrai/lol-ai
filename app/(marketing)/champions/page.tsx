import type { Metadata } from "next";
import { fetchAllChampions } from "@/lib/ddragon/championsData";
import { getMetaSnapshot, formatGamePatch } from "@/domains/meta";
import type { ChampionMetaStats } from "@/domains/meta";
import { StatBlock } from "@/components/dashboard/laneiq/HudPanel";
import { ChampionConsole, type ChampionRow } from "@/components/champions/ChampionConsole";
import { ChampionMovers, type ChampionMover } from "@/components/champions/ChampionMovers";
import { championLane, championMovers, hoursAgo } from "@/components/champions/championIndex";
import { formatCount } from "@/lib/uiLocale";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Champion Guides",
  description:
    "League of Legends champion guides: abilities, base stats, matchups and win rates for every champion, with AI coach analysis of your own games.",
  alternates: { canonical: "/champions" },
};

// Data Dragon's own class tags. The guides index has always filtered by class rather than by
// lane — that is what a reader browsing champions is looking for.
const CLASSES = ["Assassin", "Fighter", "Mage", "Marksman", "Support", "Tank"];
const ALL = "All classes";

export default async function ChampionsPage({
  searchParams,
}: {
  searchParams: { role?: string };
}): Promise<React.ReactElement> {
  const [champions, snapshot] = await Promise.all([fetchAllChampions(), getMetaSnapshot()]);
  const patch = snapshot ? formatGamePatch(snapshot.patch) : "";

  // The guides come from Data Dragon and the numbers from the meta snapshot; join them so every
  // tile carries data rather than being a bare portrait.
  const stats = new Map<string, ChampionMetaStats>(
    (snapshot?.champions ?? []).map((c) => [c.championKey, c])
  );

  const rows: ChampionRow[] = champions
    .map((champion) => {
      const meta = stats.get(champion.id);
      return {
        key: champion.id,
        name: champion.name,
        href: `/champions/${champion.id}`,
        group: champion.tags[0] ?? "Fighter",
        winRate: meta?.overallWinRate ?? null,
        games: meta?.overallGames || null,
        delta: meta?.prevPatchRank ? meta.prevPatchRank - meta.overallRank : null,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const movers: ChampionMover[] = championMovers(snapshot?.champions ?? []).map((champion) => ({
    key: champion.championKey,
    name: champion.name,
    href: `/champions/${champion.championKey}`,
    group: championLane(champion),
    winRate: champion.overallWinRate,
    games: champion.overallGames,
    delta: champion.prevPatchRank - champion.overallRank,
  }));

  // `?role=Mage` links predate the in-page filter; keep them landing on the right chip.
  const requested = searchParams.role;
  const initialGroup = requested && CLASSES.includes(requested) ? requested : ALL;

  return (
    <div className="mx-auto max-w-[1240px] px-5 py-12 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="font-display text-[34px] font-black uppercase leading-none tracking-[0.02em] text-text md:text-[42px]">
            Champion guides{patch ? ` — patch ${patch}` : ""}
          </h1>
          <p className="mt-3 max-w-[58ch] text-[15px] text-text-body">
            Abilities, base stats, matchups and what actually wins on every champion — then let your
            AI coach read your own games on them.
          </p>
        </div>
        <div className="flex flex-wrap gap-7 pb-1">
          <StatBlock label="Champions" value={String(champions.length)} />
          {snapshot && (
            <>
              <StatBlock
                label="Games parsed"
                value={snapshot.matchCount ? formatCount(snapshot.matchCount) : "—"}
              />
              <StatBlock label="Updated" value={`${hoursAgo(snapshot.fetchedAt)}h`} unit="ago" />
            </>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-5">
        <ChampionMovers movers={movers} />
        <ChampionConsole
          rows={rows}
          groups={[ALL, ...CLASSES]}
          groupLabel="Class"
          initialGroup={initialGroup}
        />
      </div>

      <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.12em] text-text-faint">
        Win rates from Emerald+ ranked solo/duo · not endorsed by Riot Games
      </p>
    </div>
  );
}
