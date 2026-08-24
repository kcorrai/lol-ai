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

  return (
    <div className="grid h-full min-h-0 gap-4 md:grid-cols-[minmax(11rem,15rem)_1fr]">
      <div className="flex min-h-0 flex-col gap-2">
        <LaneTabs active={champions.lane} onSelect={champions.setLane} />
        <div className="min-h-0 flex-1 overflow-y-auto border border-border">
          <ChampionList
            state={champions.list}
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
