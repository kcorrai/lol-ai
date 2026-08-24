import { PanelNote } from "@/components/game/PanelNote";
import { cn } from "@/lib/cn";
import type { DesktopChampionEntry } from "@/lib/champions";
import type { ChampionListState } from "@/lib/useChampions";

/**
 * One lane's champions, best first, as a list you pick from.
 *
 * The order is the website's own — tier, then rank, with small samples sunk below every
 * trustworthy row — so a player who reads the tier list on the site finds the same thing
 * here in the same order.
 */
export function ChampionList({
  state,
  selected,
  onSelect,
}: {
  state: ChampionListState;
  selected: string | null;
  onSelect: (key: string) => void;
}): React.ReactElement {
  if (state.status !== "ready") return <ListNote state={state} />;
  if (state.list.entries.length === 0) {
    return <PanelNote>No champions are played in this lane on this patch.</PanelNote>;
  }

  return (
    <ul className="grid gap-px bg-line-1">
      {state.list.entries.map((entry) => (
        <Row
          key={entry.championKey}
          entry={entry}
          active={entry.championKey === selected}
          onSelect={onSelect}
        />
      ))}
    </ul>
  );
}

function Row({
  entry,
  active,
  onSelect,
}: {
  entry: DesktopChampionEntry;
  active: boolean;
  onSelect: (key: string) => void;
}): React.ReactElement {
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(entry.championKey)}
        aria-current={active ? "true" : undefined}
        className={cn(
          "flex w-full items-baseline gap-2 px-3 py-2 text-left transition-colors duration-150",
          active ? "bg-accent/15 text-accent" : "bg-surface text-text hover:bg-white/5"
        )}
      >
        <span className="w-6 shrink-0 font-mono text-xs text-text-faint">{entry.rank || "—"}</span>
        <span className="min-w-0 flex-1 truncate text-sm">{entry.name}</span>
        <span className="shrink-0 font-mono text-xs text-text-muted">
          {entry.winRate.toFixed(1)}%
        </span>
        {/* Marked rather than hidden. A tier from a 30-game sample is noise, and a player
            comparing two champions has to be able to see which number is worth less. */}
        {entry.lowConfidence ? (
          <span
            title={`Only ${entry.games.toLocaleString()} games — too few for the rank to mean much`}
            className="shrink-0 font-mono text-[10px] uppercase text-text-faint"
          >
            low
          </span>
        ) : null}
      </button>
    </li>
  );
}

/** The list's four ways of having nothing to show, each with what the player can do. */
function ListNote({ state }: { state: Exclude<ChampionListState, { status: "ready" }> }) {
  switch (state.status) {
    case "unavailable":
      return (
        <PanelNote>
          This preview cannot reach the website. Run the desktop app, which has the credential
          store.
        </PanelNote>
      );
    case "loading":
      return <PanelNote>Reading this patch…</PanelNote>;
    case "unpaired":
      return <PanelNote>Pair this machine with your account in Settings.</PanelNote>;
    case "error":
      return <PanelNote>{state.message}</PanelNote>;
  }
}
