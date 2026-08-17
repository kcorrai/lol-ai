"use client";

import { championSplashUrl } from "@/lib/ddragon";
import type { ChampionPoolEntry } from "@/domains/champions/services/championStatsService";
import { poolHeadline, poolShape } from "./poolVerdict";

interface PoolVerdictPanelProps {
  entries: ChampionPoolEntry[];
  totalGames: number;
}

const BAND_FILL: Record<string, string> = {
  good: "bg-acid-500",
  mid: "bg-ink-400",
  bad: "bg-danger",
};

/**
 * The audit, not another card.
 *
 * A grid of champion cards says what you played; it never says what to do
 * about it. The verdict states the shape of the pool, and the bands beside it
 * are the evidence for the claim.
 */
export function PoolVerdictPanel({
  entries,
  totalGames,
}: PoolVerdictPanelProps): React.JSX.Element | null {
  const headline = poolHeadline(entries);
  if (!headline) return null;

  const bands = poolShape(entries);
  const best = [...entries].sort((a, b) => b.winRate - a.winRate)[0];
  const worst = [...entries].sort((a, b) => a.winRate - b.winRate)[0];

  return (
    <section className="grid items-stretch gap-4 lg:grid-cols-[1.25fr_1fr]">
      <div className="notch glow-accent-soft relative overflow-hidden border border-acid-500">
        {best && (
          <span
            className="absolute inset-0 bg-cover opacity-25"
            style={{
              backgroundImage: `url('${championSplashUrl(best.championName)}')`,
              backgroundPosition: "56% 22%",
            }}
            aria-hidden
          />
        )}
        <span className="absolute inset-0 bg-gradient-to-r from-ink-1000 via-ink-1000/85 to-ink-1000/55" />
        <div className="relative px-6 py-5">
          <div className="mb-3 flex items-center gap-2.5">
            <span className="h-[7px] w-[7px] animate-glow-pulse bg-acid-500" />
            <span className="font-mono text-[10.5px] uppercase tracking-label text-acid-500">
              {"// POOL VERDICT"}
            </span>
          </div>
          <p className="m-0 max-w-[26ch] font-display text-2xl font-extrabold uppercase leading-[1.16] text-fg-1">
            {headline}
          </p>
          <p className="mb-0 mt-3.5 max-w-[58ch] text-[14.5px] text-fg-2">
            {entries.length} champions with enough ranked games to judge, {totalGames} games between
            them. Narrowing the pool is the only lever here you control before the game starts.
          </p>
        </div>
      </div>

      <div className="notch border border-border bg-surface px-5 py-5">
        <div className="mb-3.5 font-mono text-[10.5px] uppercase tracking-label text-text-muted">
          {"// POOL SHAPE"}
        </div>
        <div className="grid gap-3">
          {bands.map((band) => (
            <div key={band.label}>
              <div className="mb-1.5 flex justify-between gap-3">
                <span className="font-mono text-[11px] uppercase tracking-wide text-fg-3">
                  {band.label}
                </span>
                <span className="font-mono text-[12.5px] tabular-nums text-fg-1">
                  {band.games} games · {band.winRate}%
                </span>
              </div>
              <span className="block h-[5px] bg-surface-dark">
                <span
                  className={`block h-[5px] ${BAND_FILL[band.tone]}`}
                  style={{ width: `${band.winRate}%` }}
                />
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-2.5 border-t border-line-1 pt-3.5 text-[13.5px]">
          {best && (
            <div className="flex justify-between gap-2.5">
              <span className="text-fg-3">Best pick for climbing</span>
              <span className="font-mono text-xs uppercase text-acid-500">
                {best.championName} · {best.winRate}%
              </span>
            </div>
          )}
          {worst && worst !== best && (
            <div className="flex justify-between gap-2.5">
              <span className="text-fg-3">Lowest win rate</span>
              <span className="font-mono text-xs uppercase text-danger">
                {worst.championName} · {worst.winRate}%
              </span>
            </div>
          )}
          <div className="flex justify-between gap-2.5">
            <span className="text-fg-3">Champions judged</span>
            <span className="font-mono text-xs uppercase text-fg-1">{entries.length}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
