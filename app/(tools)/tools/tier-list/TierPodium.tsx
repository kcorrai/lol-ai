"use client";

import Image from "next/image";
import Link from "next/link";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { championSplashUrl } from "@/lib/ddragon";
import { tierLetter } from "@/domains/meta/tierLetter";
import { formatGames, movementOf, tierChipClass } from "./tierDisplay";
import type { TierListEntry } from "@/domains/meta";

interface TierPodiumProps {
  entries: TierListEntry[]; // the displayed list, best-first
  roleLabel: string;
  hrefBase: string;
}

function movementLabel(entry: TierListEntry): { text: string; tone: string } {
  const delta = movementOf(entry);
  if (delta === null) return { text: "new this patch", tone: "text-text-muted" };
  if (delta === 0) return { text: "no change", tone: "text-text-muted" };
  return {
    text: `${delta > 0 ? "▲" : "▼"}${Math.abs(delta)} vs last patch`,
    tone: delta > 0 ? "text-accent" : "text-danger",
  };
}

/** The three champions worth looking at, over their splash art. */
export function TierPodium({ entries, roleLabel, hrefBase }: TierPodiumProps): React.ReactElement {
  return (
    <section className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
      {entries.slice(0, 3).map((entry, i) => {
        const letter = tierLetter(entry.tier);
        const move = movementLabel(entry);
        const lead = i === 0;
        return (
          <Link
            key={entry.championKey}
            href={`${hrefBase}/${entry.championKey}`}
            className={`notch relative min-h-[190px] overflow-hidden border transition-colors ${
              lead ? "glow-accent-soft border-accent" : "border-border hover:border-accent/40"
            }`}
          >
            <Image
              src={championSplashUrl(entry.championKey)}
              alt=""
              aria-hidden
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover object-[52%_16%] opacity-[0.34]"
              unoptimized
            />
            {/* Splash art is busy at the bottom, which is exactly where the numbers sit. */}
            <div className="absolute inset-0 bg-gradient-to-t from-surface-dark from-[14%] to-[rgba(6,10,9,0.28)]" />

            <div className="relative flex h-full flex-col justify-between gap-6 p-4">
              <div className="flex items-start justify-between gap-3">
                <span className="hud-label text-[10.5px] text-text-body">
                  #{i + 1} · {roleLabel}
                </span>
                <span
                  className={`tag-cut inline-grid h-[26px] w-[26px] place-items-center border font-mono text-[13px] font-bold ${tierChipClass(letter, entry.lowConfidence)}`}
                >
                  {letter}
                </span>
              </div>

              <div>
                <div className="flex items-center gap-3">
                  <ChampionIcon name={entry.championKey} size={44} />
                  <div className="min-w-0">
                    <div className="truncate font-display text-[19px] font-extrabold uppercase leading-none tracking-[0.04em] text-text">
                      {entry.name}
                    </div>
                    <div className="mt-1.5 font-mono text-[10.5px] tracking-[0.12em] text-text-muted">
                      {formatGames(entry.games)} games
                    </div>
                  </div>
                </div>
                <div className="mt-3.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-mono text-[32px] font-bold tabular-nums leading-none text-accent">
                    {entry.winRate.toFixed(1)}%
                  </span>
                  <span className="hud-label text-[11px]">
                    win · {entry.pickRate.toFixed(1)}% pick
                  </span>
                  <span className={`ml-auto font-mono text-xs ${move.tone}`}>{move.text}</span>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </section>
  );
}
