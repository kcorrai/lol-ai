"use client";

import Link from "next/link";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import type { ChampionPoolEntry } from "@/domains/champions/services/championStatsService";
import { verdictFor } from "./poolVerdict";

interface PoolRailProps {
  entries: ChampionPoolEntry[];
}

function ChampionList({
  title,
  entries,
  tone,
  empty,
}: {
  title: string;
  entries: ChampionPoolEntry[];
  tone: "keep" | "drop";
  empty: string;
}): React.JSX.Element {
  return (
    <section className="notch border border-border bg-surface">
      <div className="border-b border-line-1 px-4 py-3 font-mono text-[10px] uppercase tracking-label text-text-muted">
        {"// "}
        {title}
      </div>
      {entries.length === 0 ? (
        <p className="px-4 py-4 text-[12.5px] text-text-muted">{empty}</p>
      ) : (
        entries.map((entry) => (
          <div
            key={entry.championId}
            className="grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-2.5 border-b border-line-1 px-4 py-2.5 last:border-b-0"
          >
            <ChampionIcon name={entry.championName} size={28} />
            <span className="min-w-0">
              <span className="block truncate text-[13px] text-fg-1">{entry.championName}</span>
              <span className="block font-mono text-[9.5px] tracking-wide text-fg-4">
                {entry.gamesPlayed} games · KDA {entry.avgKda.toFixed(1)}
              </span>
            </span>
            <span
              className={`font-mono text-[12.5px] tabular-nums ${
                tone === "keep" ? "text-acid-500" : "text-danger"
              }`}
            >
              {entry.winRate}%
            </span>
          </div>
        ))
      )}
    </section>
  );
}

/**
 * The two lists the verdict is asking for, pulled out of the table so they can
 * be acted on without reading it.
 */
export function PoolRail({ entries }: PoolRailProps): React.JSX.Element {
  const ranked = [...entries].sort((a, b) => b.winRate - a.winRate);
  const keep = ranked.filter((c) => verdictFor(c) === "keep").slice(0, 3);
  const drop = ranked
    .filter((c) => verdictFor(c) === "drop")
    .slice(-3)
    .reverse();

  return (
    <div className="grid gap-3.5 lg:sticky lg:top-4">
      <ChampionList
        title="KEEP THESE"
        entries={keep}
        tone="keep"
        empty="No champion is clearing 60% yet."
      />
      <ChampionList
        title="STOP QUEUEING"
        entries={drop}
        tone="drop"
        empty="Nothing in your pool is under 45%."
      />

      <section className="notch bg-hero-fade glow-accent-soft border border-acid-500 bg-surface px-4 pb-6 pt-4">
        <div className="font-display text-sm font-extrabold uppercase leading-tight tracking-wide text-fg-1">
          Turn this into a plan
        </div>
        <p className="mb-3 mt-2 text-[12.5px] text-fg-2">
          Tracked targets read from your games over the next two weeks.
        </p>
        <Link
          href="/improvement"
          className="notch-sm inline-flex w-full items-center justify-center gap-2 border border-acid-500 px-3 py-2 font-mono text-[10px] uppercase tracking-label text-acid-500 transition-colors hover:bg-acid-500/10"
        >
          Build my plan →
        </Link>
      </section>
    </div>
  );
}
