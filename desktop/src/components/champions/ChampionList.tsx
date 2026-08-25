import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { tierLetter } from "@/domains/meta/tierLetter";
import { PanelNote } from "@/components/game/PanelNote";
import { cn } from "@/lib/cn";
import { filterChampions, type DesktopChampionEntry } from "@/lib/champions";
import type { ChampionListState } from "@/lib/useChampions";

/**
 * One lane's champions, best first, as a list you pick from.
 *
 * The order is the website's own — tier, then rank, with small samples sunk below every
 * trustworthy row — so a player who reads the tier list on the site finds the same thing
 * here in the same order. So is what each row says: portrait, tier letter, win rate, and
 * the pick and ban rates under them. The numbers were always in the answer
 * (`championsContract.ts` carries all five) and this used to draw two of them, which made
 * the same list look like a thinner product than the website's.
 *
 * What is not brought over is the furniture `/builds` needs at 1440px and this does not:
 * the splash-art movers and the A–Z jump strip. A lane here is a scrolling column beside a
 * game, not a page.
 */
export function ChampionList({
  state,
  query,
  selected,
  onSelect,
}: {
  state: ChampionListState;
  /** The name filter, from the screen. Empty means everything in the lane. */
  query: string;
  selected: string | null;
  onSelect: (key: string) => void;
}): React.ReactElement {
  if (state.status !== "ready") return <ListNote state={state} />;
  if (state.list.entries.length === 0) {
    return <PanelNote>No champions are played in this lane on this patch.</PanelNote>;
  }

  const shown = filterChampions(state.list.entries, query);

  if (shown.length === 0) {
    return <PanelNote>No champion in this lane is called “{query.trim()}”.</PanelNote>;
  }

  return (
    <ul className="grid gap-px bg-line-1">
      {shown.map((entry) => (
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

/** The website's own reading of a win rate: above the field, at it, or below it. */
function winRateTone(winRate: number): string {
  if (winRate >= 52) return "text-accent";
  if (winRate < 50) return "text-danger";
  return "text-text";
}

/** S and A are worth picking out; the rest are context. Zero is "the snapshot gave none". */
function tierTone(tier: number): string {
  if (tier === 1) return "border-accent bg-accent/15 text-accent";
  if (tier === 2) return "border-border bg-surface text-text";
  return "border-line-1 bg-surface text-text-muted";
}

/** Four digits of games in a column this narrow is the sample, not the number. */
function games(count: number): string {
  return count >= 1000 ? `${Math.round(count / 1000)}k` : String(count);
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
          "flex w-full items-center gap-2.5 px-2.5 py-2 text-left transition-colors duration-150",
          active ? "bg-accent/15" : "bg-surface hover:bg-white/5"
        )}
      >
        <ChampionIcon name={entry.championKey} size={32} className="shrink-0" />

        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-2">
            {entry.tier ? (
              <span
                aria-label={`Tier ${tierLetter(entry.tier)}`}
                className={cn(
                  "tag-cut shrink-0 border px-1.5 font-mono text-[10px] font-bold leading-[1.5]",
                  tierTone(entry.tier)
                )}
              >
                {tierLetter(entry.tier)}
              </span>
            ) : null}
            <span className={cn("min-w-0 flex-1 truncate text-[13px]", active && "text-accent")}>
              {entry.name}
            </span>
            <span
              className={cn(
                "shrink-0 font-mono text-[13px] tabular-nums",
                winRateTone(entry.winRate)
              )}
            >
              {entry.winRate.toFixed(1)}%
            </span>
          </span>

          <span className="mt-0.5 flex items-center gap-2 font-mono text-[9.5px] uppercase tracking-label text-text-faint">
            <span className="tabular-nums">{entry.rank ? `#${entry.rank}` : "—"}</span>
            <span className="tabular-nums">P {entry.pickRate.toFixed(1)}%</span>
            <span className="tabular-nums">B {entry.banRate.toFixed(1)}%</span>
            {/* Marked rather than hidden. A tier from a 30-game sample is noise, and a
                player comparing two champions has to be able to see which number is worth
                less — so the sample sits in the row that names it. */}
            <span
              title={
                entry.lowConfidence
                  ? `Only ${entry.games.toLocaleString()} games — too few for the tier to mean much`
                  : `${entry.games.toLocaleString()} games`
              }
              className={cn("ml-auto tabular-nums", entry.lowConfidence && "text-warning")}
            >
              {games(entry.games)}
              {entry.lowConfidence ? " low" : ""}
            </span>
          </span>
        </span>
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
