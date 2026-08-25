import { useState } from "react";
import { Search } from "lucide-react";
import { ChampionDetail } from "@/components/champions/ChampionDetail";
import { ChampionList } from "@/components/champions/ChampionList";
import { LaneTabs } from "@/components/champions/LaneTabs";
import { useChampions } from "@/lib/useChampions";

/**
 * Somewhere to read between games (LA-75, ADR-042).
 *
 * A lane on the left and whatever is open on the right, which is the shape every champion
 * page in this category has — and the shape that survives a window narrow enough to sit
 * beside a game. The list scrolls on its own so picking the twentieth champion does not
 * scroll the reading of the first off the top.
 *
 * Everything here is the patch's own numbers rather than this account's. It is the one
 * screen in the app that is worth opening with no game running.
 */
export function ChampionsScreen(): React.ReactElement {
  const champions = useChampions();
  // Kept across lane changes, unlike the open champion: a player who typed three letters
  // and then switched lane is looking for the same champion somewhere else.
  const [query, setQuery] = useState("");

  const patch = champions.list.status === "ready" ? champions.list.list.patch : null;

  return (
    <div className="grid h-full min-h-0 gap-4 md:grid-cols-[minmax(15rem,21rem)_1fr]">
      <div className="flex min-h-0 flex-col gap-2">
        {/* The patch every number below is from. The website prints it in the page title
            of `/builds`; here it is the one line above the list, because a reading that
            does not say which patch it is from is not a reading. */}
        <p className="hud-label flex items-baseline justify-between gap-2 text-[10px]">
          <span>Ranked meta</span>
          <span className="text-text-faint">{patch ? `patch ${patch}` : "—"}</span>
        </p>

        <LaneTabs active={champions.lane} onSelect={champions.setLane} />

        <label className="relative block">
          <span className="sr-only">Search a champion</span>
          <Search
            aria-hidden
            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search a champion"
            className="notch-sm h-8 w-full border border-border bg-surface-dark pl-8 pr-3 text-sm text-text placeholder:text-text-muted focus:border-accent/50 focus:outline-none"
          />
        </label>

        <div className="min-h-0 flex-1 overflow-y-auto border border-border">
          <ChampionList
            state={champions.list}
            query={query}
            selected={champions.selected}
            onSelect={champions.select}
          />
        </div>
      </div>

      <div className="min-h-0 overflow-y-auto">
        <ChampionDetail state={champions.champion} />
      </div>
    </div>
  );
}
