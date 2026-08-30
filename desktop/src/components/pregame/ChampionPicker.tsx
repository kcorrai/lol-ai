import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { ChampionTile } from "@/components/hud/ChampionTile";
import { SearchField } from "@/components/hud/SearchField";
import { Spinner } from "@/components/hud/Spinner";
import { ChampionSplash } from "@/components/hud/Splash";
import { winRateTone } from "@/lib/championList";
import { cn } from "@/lib/cn";
import { filterChampions, type DesktopChampionEntry } from "@/lib/champions";
import type { RosterState } from "@/lib/usePregame";

const TONE = { good: "text-accent", bad: "text-danger", even: "text-text-body" } as const;

/**
 * One of the two champions in a matchup, chosen by name.
 *
 * A grid of portraits rather than a list of words. A player at champion select has about
 * twenty seconds and already knows what they are looking for by sight — which is the case
 * the old list of names was worst at, because a name is something you read and a splash is
 * something you spot. The search box is still there for the player who would rather type.
 *
 * The chosen champion is drawn above the grid as a wide art card rather than only being
 * highlighted in it: a grid of a hundred and seventy scrolls, and a player who cannot see
 * what they picked without finding it again has not really picked it.
 */
export function ChampionPicker({
  label,
  roster,
  chosen,
  onChoose,
  /** Shown under the label. The two pickers mean different things and both are worth saying. */
  hint,
  /** `mine` is the accent; `theirs` is the danger red, because it is the threat. */
  side,
  clearable,
}: {
  label: string;
  roster: RosterState;
  chosen: string | null;
  onChoose: (name: string | null) => void;
  hint: string;
  side: "mine" | "theirs";
  clearable?: boolean;
}): React.ReactElement {
  const [query, setQuery] = useState("");

  const entries = roster.status === "ok" ? roster.value : [];
  // Memoised because it runs over every champion in the lane on every keystroke, and the
  // grid under it re-renders either way. Computed from `entries` rather than from the branch
  // above it, so the dependency is stable when the roster is not ready.
  const shown = useMemo(() => filterChampions(entries, query), [entries, query]);
  const picked = entries.find((entry) => entry.name === chosen) ?? null;

  const kicker = side === "mine" ? "text-accent" : "text-danger";
  const edge = side === "mine" ? "border-accent" : "border-danger";

  return (
    <div className="grid min-w-0 gap-3 p-5">
      <div>
        <div className="flex items-baseline justify-between gap-3">
          <p className={cn("font-mono text-[10px] uppercase tracking-[0.2em]", kicker)}>{label}</p>
          {clearable && picked ? (
            <button
              type="button"
              onClick={() => onChoose(null)}
              aria-label={`Clear ${picked.name}`}
              className="flex cursor-pointer items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted transition-colors hover:text-text"
            >
              Clear
              <X aria-hidden className="h-3 w-3" />
            </button>
          ) : null}
        </div>
        <p className="mt-1.5 text-[13px] text-text-muted">{hint}</p>
      </div>

      {picked ? (
        <div
          className={cn(
            "tag-cut relative animate-hud-enter overflow-hidden border",
            edge,
            side === "mine" && "glow-accent-soft"
          )}
        >
          <ChampionSplash
            champion={picked.championKey}
            opacity={1}
            position="56% 16%"
            className="brightness-[.8]"
          />
          <span className="absolute inset-0 bg-gradient-to-r from-ink-1000 via-ink-1000/60 to-ink-1000/25" />
          <span className="relative flex items-center gap-3.5 px-4 py-3.5">
            <ChampionTile champion={picked.championKey} size={44} />
            <span className="min-w-0">
              <span className="block truncate font-display text-[18px] font-bold uppercase tracking-[0.04em] text-text">
                {picked.name}
              </span>
              <span
                className={cn(
                  "mt-1 block font-mono text-[10px] uppercase tracking-[0.14em]",
                  kicker
                )}
              >
                {side === "mine" ? "Your pick" : "Their pick"}
              </span>
            </span>
          </span>
        </div>
      ) : null}

      {roster.status === "ok" ? (
        <>
          <SearchField
            value={query}
            onChange={setQuery}
            label={`Search champions for ${label.toLowerCase()}`}
            placeholder="Search"
          />
          {shown.length === 0 ? (
            <p className="px-3 py-8 text-center font-mono text-[10.5px] uppercase tracking-[0.14em] text-text-faint">
              No champion in this lane is called “{query.trim()}”.
            </p>
          ) : (
            <ul className="grid max-h-[296px] grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2 overflow-y-auto pr-1">
              {shown.map((entry, index) => (
                <Option
                  key={entry.championKey}
                  entry={entry}
                  active={entry.name === chosen}
                  index={index}
                  onChoose={onChoose}
                />
              ))}
            </ul>
          )}
        </>
      ) : (
        <RosterNote roster={roster} />
      )}
    </div>
  );
}

function Option({
  entry,
  active,
  index,
  onChoose,
}: {
  entry: DesktopChampionEntry;
  active: boolean;
  index: number;
  onChoose: (name: string) => void;
}): React.ReactElement {
  return (
    <li>
      <button
        type="button"
        aria-pressed={active}
        onClick={() => onChoose(entry.name)}
        title={entry.name}
        style={{ animationDelay: `${Math.min(index, 20) * 24}ms` }}
        className={cn(
          "hud-tile-in tag-cut relative h-[118px] w-full cursor-pointer overflow-hidden border bg-surface-dark text-left",
          "transition-colors duration-150 ease-out",
          active ? "glow-accent-soft border-accent" : "border-line-2 hover:border-line-3"
        )}
      >
        <ChampionSplash
          champion={entry.championKey}
          opacity={1}
          position="52% 14%"
          className="brightness-[.72]"
        />
        <span className="absolute inset-0 bg-gradient-to-t from-ink-1000 via-ink-1000/25 to-transparent" />
        {active ? <span className="absolute inset-0 bg-accent/15" /> : null}
        <span className="absolute inset-x-0 bottom-0 p-2.5">
          <span className={cn("block truncate text-xs", active ? "text-accent" : "text-text")}>
            {entry.name}
          </span>
          <span className="mt-1 flex items-baseline gap-1.5">
            <span
              className={cn(
                "font-mono text-[10.5px] tabular-nums",
                TONE[winRateTone(entry.winRate)]
              )}
            >
              {entry.winRate.toFixed(1)}%
            </span>
          </span>
        </span>
      </button>
    </li>
  );
}

/** The roster's three ways of having nothing to offer, each with what the player can do. */
function RosterNote({
  roster,
}: {
  roster: Exclude<RosterState, { status: "ok" }>;
}): React.ReactElement {
  const message =
    roster.status === "loading"
      ? "Reading this lane…"
      : roster.status === "unavailable"
        ? "This preview has no champion list. Run the desktop app."
        : roster.status === "unpaired"
          ? "Pair this machine on the Pairing screen to read champions."
          : roster.message;

  return (
    <div className="grid gap-2">
      {roster.status === "loading" ? (
        // The shape of what is coming, so the wait is not a void.
        <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2">
          {Array.from({ length: 8 }, (_, i) => (
            <span
              key={i}
              className="hud-shimmer tag-cut block h-[118px] border border-line-1 bg-surface-dark"
              style={{ animationDelay: `${i * 90}ms` }}
            />
          ))}
        </div>
      ) : null}
      <div className="flex items-center justify-center gap-3 px-3 py-6 text-center">
        {roster.status === "loading" ? <Spinner size={18} /> : null}
        <p className="text-[13.5px] text-text-muted">{message}</p>
      </div>
    </div>
  );
}
