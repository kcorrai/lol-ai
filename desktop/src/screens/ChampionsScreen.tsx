import { useMemo, useState } from "react";
import { ChampionDetail } from "@/components/champions/ChampionDetail";
import { ChampionList } from "@/components/champions/ChampionList";
import { LaneTabs } from "@/components/champions/LaneTabs";
import type { Suggestion } from "@/components/champions/ChampionSuggestions";
import { SearchField } from "@/components/hud/SearchField";
import { Tag } from "@/components/hud/Tag";
import { filterChampions } from "@/lib/champions";
import { SORTS, type Sort } from "@/lib/championList";
import { useChampions } from "@/lib/useChampions";

/**
 * Somewhere to read between games (LA-75, ADR-042).
 *
 * A lane on the left and whatever is open on the right, which is the shape every champion
 * page in this category has — and the shape that survives a window narrow enough to sit
 * beside a game. Each pane scrolls on its own, so picking the twentieth champion does not
 * scroll the reading of the first off the top.
 *
 * Everything here is the patch's own numbers rather than this account's. It is the one
 * screen in the app that is worth opening with no game running, which is why it gets the
 * splash art, the tier grouping and the three suggestions: it has to look like somewhere to
 * spend five minutes rather than a lookup table.
 */
export function ChampionsScreen(): React.ReactElement {
  const champions = useChampions();
  // Both kept across lane changes, unlike the open champion: a player who typed three
  // letters and then switched lane is looking for the same champion somewhere else, and one
  // who asked for a win-rate order meant it for the screen and not for one lane.
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("Tier");

  const entries = champions.list.status === "ready" ? champions.list.list.entries : [];
  const patch = champions.list.status === "ready" ? champions.list.list.patch : null;

  const shown = useMemo(() => filterChampions(entries, query), [entries, query]);

  // The lane's own top three, in the lane's own order — never the sorted or filtered one.
  // These are an entry point, and an entry point that changed as you typed would be a
  // fourth thing moving on a screen that already has three.
  const suggestions = useMemo<Suggestion[]>(
    () =>
      entries.slice(0, 3).map((entry) => ({
        championKey: entry.championKey,
        name: entry.name,
        winRate: entry.winRate,
        games: entry.games,
      })),
    [entries]
  );

  const laneMaxGames = useMemo(
    () => entries.reduce((most, entry) => Math.max(most, entry.games), 0),
    [entries]
  );

  return (
    <div className="grid h-full min-h-0 md:grid-cols-[minmax(18rem,380px)_minmax(0,1fr)]">
      <section className="flex min-h-0 flex-col border-b border-line-1 md:border-b-0 md:border-r">
        <LaneTabs
          active={champions.lane}
          onSelect={champions.setLane}
          layout="stacked"
          className="shrink-0 border-b border-line-1"
        />

        <div className="grid shrink-0 gap-2.5 border-b border-line-1 px-4 py-3.5">
          <SearchField
            value={query}
            onChange={setQuery}
            label="Search a champion"
            placeholder="Search a champion"
          />
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="hud-label text-[9.5px] tracking-[0.18em]">Sort</span>
            {SORTS.map((option) => (
              <Tag key={option} active={sort === option} onClick={() => setSort(option)}>
                {option}
              </Tag>
            ))}
            <span className="ml-auto font-mono text-[9.5px] uppercase tracking-[0.14em] text-text-faint">
              {/* The patch every number below is from. A reading that does not say which
                  patch it is from is not a reading. */}
              {patch ? `Patch ${patch}` : "—"}
            </span>
          </div>
          <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-text-faint">
            {shown.length} of {entries.length} champions
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <ChampionList
            state={champions.list}
            query={query}
            sort={sort}
            selected={champions.selected}
            onSelect={champions.select}
          />
        </div>
      </section>

      <section className="min-h-0 min-w-0 overflow-y-auto">
        <ChampionDetail
          state={champions.champion}
          laneMaxGames={laneMaxGames}
          suggestions={suggestions}
          onSelect={champions.select}
        />
      </section>
    </div>
  );
}
