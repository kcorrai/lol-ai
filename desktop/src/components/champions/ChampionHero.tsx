import { ChampionTile } from "@/components/hud/ChampionTile";
import { ChampionSplash, ScanBand } from "@/components/hud/Splash";
import { TierChip } from "@/components/champions/TierChip";
import { winRateFill, winRateTone } from "@/lib/championList";
import { LANE_LABELS, type DesktopChampion, type Lane } from "@/lib/champions";
import { tierLetter } from "@/domains/meta/tierLetter";
import { cn } from "@/lib/cn";
import { formatCount } from "@/lib/uiLocale";

/**
 * Who this champion is, and how it is doing, over its own splash art.
 *
 * The header of the champion browser's reading. Everything in it is the patch snapshot's
 * own numbers or the Data Dragon catalogue's own words — the epithet and the classes are
 * Riot's, and they are absent rather than guessed at when the catalogue could not be read.
 */
export function ChampionHero({
  champion,
  /** Where this champion's sample sits against the busiest champion in the lane, 0–100. */
  sampleFill,
}: {
  champion: DesktopChampion;
  sampleFill: number;
}): React.ReactElement {
  const lane = LANE_LABELS[champion.position as Lane] ?? champion.position;
  const also = champion.availablePositions
    .filter((position) => position !== champion.position)
    .map((position) => LANE_LABELS[position as Lane] ?? position);

  return (
    <section className="notch-lg relative overflow-hidden border border-border">
      <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <ChampionSplash champion={champion.champion.key} opacity={0.46} position="58% 20%" />
        <span className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-background/20" />
        <span className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        <span className="bg-scanline absolute inset-0" />
        <ScanBand />
      </span>

      <div className="relative p-5">
        <div className="flex flex-wrap items-end justify-between gap-x-5 gap-y-3">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <ChampionTile champion={champion.champion.key} size={62} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <TierChip tier={tierLetter(champion.stats.tier)} size="lg" />
                <h2 className="truncate font-display text-[30px] font-black uppercase leading-none tracking-[0.03em] text-text">
                  {champion.champion.name}
                </h2>
              </div>
              <p className="mt-2 font-mono text-[10.5px] uppercase tracking-[0.16em] text-text-muted">
                {champion.title ? `${champion.title} · ` : ""}
                {lane}
              </p>
            </div>
          </div>

          {champion.tags.length > 0 ? (
            <ul className="flex shrink-0 flex-wrap gap-2">
              {champion.tags.map((tag, index) => (
                <li
                  key={tag}
                  className={cn(
                    "tag-cut border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em]",
                    // The first class is the one the champion mostly is; the rest are context.
                    index === 0
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-line-2 bg-surface-dark text-text-muted"
                  )}
                >
                  {tag}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-px border border-border bg-line-1 md:grid-cols-4">
          <Kpi
            label="Win"
            value={`${champion.stats.winRate.toFixed(1)}%`}
            fill={winRateFill(champion.stats.winRate)}
            tone={winRateTone(champion.stats.winRate)}
            note={
              winRateTone(champion.stats.winRate) === "good"
                ? "▲ strong"
                : winRateTone(champion.stats.winRate) === "bad"
                  ? "▼ weak"
                  : undefined
            }
            index={0}
          />
          <Kpi
            label="Pick"
            value={`${champion.stats.pickRate.toFixed(1)}%`}
            fill={(champion.stats.pickRate / 20) * 100}
            index={1}
          />
          <Kpi
            label="Ban"
            value={`${champion.stats.banRate.toFixed(1)}%`}
            fill={(champion.stats.banRate / 25) * 100}
            index={2}
          />
          {/* Scaled against the busiest champion in this lane rather than against a
              constant. A sample size has no natural ceiling, and a bar drawn to an invented
              one would be a picture of nothing. */}
          <Kpi
            label="Games"
            value={formatCount(champion.stats.games)}
            fill={sampleFill}
            index={3}
          />
        </dl>

        {also.length > 0 ? (
          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-text-faint">
            Also played: {also.join(", ")}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function Kpi({
  label,
  value,
  fill,
  tone = "even",
  note,
  index,
}: {
  label: string;
  value: string;
  fill: number;
  tone?: "good" | "bad" | "even";
  note?: string;
  index: number;
}): React.ReactElement {
  const colour = { good: "text-accent", bad: "text-danger", even: "text-text" }[tone];
  const bar = { good: "bg-accent", bad: "bg-danger", even: "bg-ink-400" }[tone];

  return (
    // The panel's own fill at four fifths, so the splash reads through it without the
    // numbers on top having to fight the art for contrast.
    <div className="min-w-0 bg-background/85 px-3.5 py-3">
      <dt className="hud-label truncate text-[9.5px] tracking-[0.18em]">{label}</dt>
      <dd className="mt-2">
        <span
          className={cn(
            "block truncate font-mono text-[22px] font-bold tabular-nums leading-none",
            colour
          )}
        >
          {value}
        </span>
        {/* Under the number, never beside it. Beside, three words of note widened the cell
            enough to push the fourth reading off the edge of the pane. */}
        {note ? <span className="mt-1 block font-mono text-[10px] text-accent">{note}</span> : null}
      </dd>
      <span aria-hidden className="mt-3 block h-1 bg-surface-dark">
        <span
          className={cn("hud-bar block h-full", bar)}
          style={{
            width: `${Math.max(0, Math.min(100, fill))}%`,
            animationDelay: `${index * 70}ms`,
          }}
        />
      </span>
    </div>
  );
}
