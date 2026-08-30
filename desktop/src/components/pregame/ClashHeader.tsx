import { UserRoundSearch } from "lucide-react";
import { ChampionTile } from "@/components/hud/ChampionTile";
import { ChampionSplash, ScanBand } from "@/components/hud/Splash";
import { LANE_LABELS, type Lane } from "@/lib/champions";
import { cn } from "@/lib/cn";
import { formatCount } from "@/lib/uiLocale";
import type { LiveContext } from "@/lib/liveContext";

const VERDICT_LABEL: Record<string, string> = {
  favored: "Favoured",
  even: "Even",
  unfavored: "Unfavoured",
};

/**
 * The two champions, facing each other.
 *
 * It appears the moment a champion is named and before anything has been read, which is the
 * point of it: the screen under it is two search boxes, and two search boxes are a form. The
 * header is what turns the form into a matchup — the player sees who they are and who they
 * are into before they have pressed anything.
 *
 * The opponent's art is mirrored so the two face each other. That is the only reason it is
 * flipped, and it is worth a line of CSS: a pair of champions both looking the same way is a
 * roster, and a pair looking at each other is a lane.
 */
export function ClashHeader({
  mine,
  theirs,
  lane,
  /** The read, when there is one. Absent before the player has pressed Read. */
  context,
}: {
  mine: string;
  theirs: string | null;
  lane: Lane;
  context: LiveContext | null;
}): React.ReactElement {
  const meta = context?.meta ?? null;
  const verdict = meta ? (VERDICT_LABEL[meta.verdict] ?? meta.verdict) : null;

  return (
    <section className="notch-lg relative overflow-hidden border border-border">
      <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <ChampionSplash champion={mine} side="left" opacity={0.42} />
        {theirs ? (
          <ChampionSplash champion={theirs} side="right" opacity={0.34} flip position="44% 20%" />
        ) : null}
        {/* Dark in the middle and at both edges, so two portraits read as one panel rather
            than as two pictures with a seam. */}
        <span className="absolute inset-0 bg-[linear-gradient(90deg,var(--ink-900)_4%,rgba(8,11,10,.56)_34%,rgba(8,11,10,.82)_50%,rgba(8,11,10,.58)_66%,var(--ink-900)_96%)]" />
        <span className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        <span className="bg-scanline absolute inset-0" />
        <ScanBand />
      </span>

      <div className="relative grid items-center gap-6 p-6 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <span className="flex min-w-0 items-center gap-4">
          <ChampionTile champion={mine} size={56} selected />
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2.5">
              <span className="truncate font-display text-[23px] font-black uppercase tracking-[0.04em] text-text">
                {mine}
              </span>
              <span className="tag-cut bg-accent px-1.5 py-[3px] font-mono text-[8.5px] font-bold uppercase tracking-[0.16em] text-ink-1000">
                You
              </span>
            </span>
            <span className="mt-1.5 block font-mono text-[10.5px] uppercase tracking-[0.14em] text-text-muted">
              {LANE_LABELS[lane]} · your pick
            </span>
          </span>
        </span>

        <span className="text-center">
          <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-text-faint">
            {theirs ? "Matchup" : "Against"}
          </span>
          {theirs ? (
            <span className="mt-1.5 block font-display text-[15px] font-bold tracking-[0.12em] text-text-muted">
              VS
            </span>
          ) : null}
          <span
            className={cn(
              "tag-cut mt-2.5 inline-block border px-2.5 py-1 font-mono text-[9.5px] font-bold uppercase tracking-[0.16em]",
              verdict
                ? "border-accent bg-accent/10 text-accent"
                : "border-line-2 bg-surface-dark text-text-muted"
            )}
          >
            {verdict ?? (theirs ? "Unread" : "Anyone")}
          </span>
        </span>

        {theirs ? (
          <span className="flex min-w-0 items-center justify-end gap-4 text-right">
            <span className="min-w-0">
              <span className="block truncate font-display text-[23px] font-black uppercase tracking-[0.04em] text-text">
                {theirs}
              </span>
              <span className="mt-1.5 block font-mono text-[10.5px] uppercase tracking-[0.14em] text-text-muted">
                Their pick
              </span>
            </span>
            <ChampionTile champion={theirs} size={56} />
          </span>
        ) : (
          <span className="flex min-w-0 items-center justify-end gap-3.5">
            <span className="max-w-[34ch] text-right font-mono text-[11px] uppercase tracking-[0.14em] text-text-faint">
              Name an opponent for the matchup read · your build and record work without one
            </span>
            <span className="tag-cut grid h-14 w-14 shrink-0 place-items-center border border-dashed border-line-3 text-text-faint">
              <UserRoundSearch aria-hidden className="h-[22px] w-[22px]" />
            </span>
          </span>
        )}
      </div>

      {meta ? (
        <div className="relative px-6 pb-5">
          <div className="mb-2 flex items-center justify-between gap-3.5">
            <span className="hud-label text-[10px] tracking-[0.18em]">
              Lane win rate · patch {meta.patch}
            </span>
            <span className="font-mono text-[12.5px] tabular-nums text-accent">
              {meta.winRate.toFixed(1)}%
            </span>
          </div>
          <div className="relative h-1.5 overflow-hidden bg-surface-dark">
            <span
              className="hud-bar block h-full bg-accent"
              style={{ width: `${Math.max(0, Math.min(100, meta.winRate))}%` }}
            />
            {/* Even, marked. Without it the bar is a length with no meaning — the whole
                question a lane win rate answers is which side of this line it falls. */}
            <span aria-hidden className="absolute -bottom-1 -top-1 left-1/2 w-px bg-text-muted" />
          </div>
          <div className="mt-2 flex justify-between font-mono text-[10.5px] tracking-[0.1em] text-text-faint">
            <span className="truncate">{mine}</span>
            <span className="shrink-0">{formatCount(meta.games)} games</span>
            <span className="truncate">{theirs}</span>
          </div>
        </div>
      ) : null}
    </section>
  );
}
