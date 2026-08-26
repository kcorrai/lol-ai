import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { PanelNote } from "@/components/game/PanelNote";
import { cn } from "@/lib/cn";
import { filterChampions, type DesktopChampionEntry } from "@/lib/champions";
import type { RosterState } from "@/lib/usePregame";

/**
 * One of the two champions in a matchup, chosen by name.
 *
 * A short scrolling list rather than the champion browser's row — this is not a tier list
 * and the numbers in one would be answering a different question. What the player is doing
 * here is naming a champion they have already been given, in the twenty seconds a pick
 * phase leaves them, so the list is portrait and name and nothing else.
 *
 * The chosen champion is drawn above the search rather than only highlighted in it: a list
 * of a hundred and seventy scrolls, and a player who cannot see what they picked without
 * finding it again has not really picked it.
 */
export function ChampionPicker({
  label,
  roster,
  chosen,
  onChoose,
  /** Shown under the label. The two pickers mean different things and both are worth saying. */
  hint,
  clearable,
}: {
  label: string;
  roster: RosterState;
  chosen: string | null;
  onChoose: (name: string | null) => void;
  hint: string;
  clearable?: boolean;
}): React.ReactElement {
  const [query, setQuery] = useState("");

  const entries = roster.status === "ok" ? roster.value : [];
  // Memoised because it runs over every champion in the lane on every keystroke, and the
  // list under it re-renders either way.
  const shown = useMemo(() => filterChampions(entries, query), [entries, query]);
  const picked = entries.find((entry) => entry.name === chosen) ?? null;

  return (
    <div className="grid gap-2">
      <div>
        <p className="hud-label">{label}</p>
        <p className="mt-1 text-xs text-text-muted">{hint}</p>
      </div>

      {picked ? (
        <div className="notch-sm flex items-center gap-2 border border-accent bg-accent/10 px-2 py-1.5">
          <ChampionIcon name={picked.championKey} size={24} className="shrink-0" />
          <span className="min-w-0 flex-1 truncate text-sm text-text">{picked.name}</span>
          {clearable ? (
            <button
              type="button"
              onClick={() => onChoose(null)}
              aria-label={`Clear ${picked.name}`}
              className="cursor-pointer text-text-muted transition-colors hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search"
          aria-label={`Search champions for ${label.toLowerCase()}`}
          className={cn(
            "notch-sm w-full border border-line-2 bg-surface-dark py-1.5 pl-8 pr-2 text-sm text-text",
            "placeholder:text-text-faint",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          )}
        />
      </div>

      <div className="h-52 overflow-y-auto">
        <Roster roster={roster} shown={shown} query={query} chosen={chosen} onChoose={onChoose} />
      </div>
    </div>
  );
}

function Roster({
  roster,
  shown,
  query,
  chosen,
  onChoose,
}: {
  roster: RosterState;
  shown: readonly DesktopChampionEntry[];
  query: string;
  chosen: string | null;
  onChoose: (name: string) => void;
}): React.ReactElement {
  switch (roster.status) {
    case "loading":
      return <PanelNote>Reading this lane…</PanelNote>;
    case "unavailable":
      return <PanelNote>This preview has no champion list. Run the desktop app.</PanelNote>;
    case "unpaired":
      return <PanelNote>Pair this machine with your account to read champions.</PanelNote>;
    case "error":
      return <PanelNote>{roster.message}</PanelNote>;
    case "ok":
      break;
  }

  if (shown.length === 0) {
    return (
      <PanelNote>
        {query.trim()
          ? `No champion in this lane is called “${query.trim()}”.`
          : "No champions are played in this lane on this patch."}
      </PanelNote>
    );
  }

  return (
    <ul className="grid gap-px bg-line-1">
      {shown.map((entry) => (
        <Row
          key={entry.championKey}
          entry={entry}
          active={entry.name === chosen}
          onChoose={onChoose}
        />
      ))}
    </ul>
  );
}

function Row({
  entry,
  active,
  onChoose,
}: {
  entry: DesktopChampionEntry;
  active: boolean;
  onChoose: (name: string) => void;
}): React.ReactElement {
  return (
    <li>
      <button
        type="button"
        aria-pressed={active}
        onClick={() => onChoose(entry.name)}
        className={cn(
          "flex w-full cursor-pointer items-center gap-2 px-2 py-1.5 text-left transition-colors duration-150",
          "focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent",
          active ? "bg-accent/15 text-accent" : "bg-surface text-text hover:bg-surface-2"
        )}
      >
        <ChampionIcon name={entry.championKey} size={24} className="shrink-0" />
        <span className="min-w-0 flex-1 truncate text-sm">{entry.name}</span>
      </button>
    </li>
  );
}
