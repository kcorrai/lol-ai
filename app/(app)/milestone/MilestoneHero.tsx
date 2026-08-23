"use client";

import { championSplashUrl } from "@/lib/ddragon";
import type { MonthlyMilestone } from "@/domains/analysis/services/milestoneService";

interface MilestoneHeroProps {
  data: MonthlyMilestone;
  isCurrent: boolean;
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "good" | "bad";
}): React.JSX.Element {
  return (
    <div>
      <div className="font-mono text-[9.5px] uppercase tracking-label text-fg-4">{label}</div>
      <div
        className={`mt-1.5 font-display text-2xl font-bold tabular-nums ${
          tone === "good" ? "text-acid-500" : tone === "bad" ? "text-danger" : "text-fg-1"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

/**
 * The month's headline, not a page title.
 *
 * "Monthly Milestone" is the same words every month. What the reader wants at
 * the top is what happened in *this* one, so the heading is the finding and
 * the numbers behind it sit beside it.
 */
export function MilestoneHero({ data, isCurrent }: MilestoneHeroProps): React.JSX.Element {
  const climbed = data.lpChange > 0;
  const flat = data.lpChange === 0;

  // Stated from the two facts that actually disagree most often: how well the
  // month was played, and whether it moved the rank.
  const headline =
    data.winRate >= 55 && flat
      ? "A winning month that didn't move your rank"
      : data.winRate >= 55 && climbed
        ? "You played well and it showed"
        : data.winRate >= 55
          ? "You won more than you lost and still fell"
          : climbed
            ? "You climbed on a losing record"
            : `${data.gamesPlayed} games to lose ${Math.abs(data.lpChange)} LP`;

  const top = data.topChampions[0];

  return (
    <section className="relative overflow-hidden border-b border-line-1">
      {top && (
        <span
          className="absolute inset-0 bg-cover opacity-30"
          style={{
            backgroundImage: `url('${championSplashUrl(top.name)}')`,
            backgroundPosition: "58% 20%",
          }}
          aria-hidden
        />
      )}
      <span className="absolute inset-0 bg-gradient-to-r from-ink-1000 via-ink-1000/85 to-ink-1000/55" />
      <span className="bg-scanline absolute inset-0 opacity-60" aria-hidden />

      <div className="relative mx-auto flex max-w-[1240px] flex-wrap items-end justify-between gap-7 px-5 pb-6 pt-8 md:px-8">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="h-[7px] w-[7px] animate-glow-pulse bg-acid-500" />
            <span className="font-mono text-[10.5px] uppercase tracking-label text-acid-500">
              {"// "}
              {data.label} · {isCurrent ? "In progress" : "Closed"}
            </span>
          </div>
          <h1 className="mt-3 max-w-[22ch] font-display text-4xl font-black uppercase leading-[0.98] text-fg-1 md:text-[44px]">
            {headline}
          </h1>
          <p className="mt-3 max-w-[58ch] text-[15px] text-fg-2">
            {data.gamesPlayed} ranked games at {data.winRate}%, {data.wins} wins and {data.losses}{" "}
            losses.{" "}
            {flat
              ? "You finished on the LP you started with."
              : `Net ${climbed ? "+" : ""}${data.lpChange} LP.`}
          </p>
        </div>

        <div className="flex gap-7 pb-0.5">
          <Stat
            label="Win rate"
            value={`${data.winRate}%`}
            tone={data.winRate >= 55 ? "good" : data.winRate < 45 ? "bad" : undefined}
          />
          <Stat label="Matches" value={String(data.gamesPlayed)} />
          <Stat
            label="LP"
            value={`${climbed ? "+" : ""}${data.lpChange}`}
            tone={climbed ? "good" : data.lpChange < 0 ? "bad" : undefined}
          />
        </div>
      </div>
    </section>
  );
}
