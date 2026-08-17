"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { PlayerPerformanceProfile } from "@/domains/analysis/types/analysis.types";
import type { CurrentRank } from "@/domains/riot";

interface ChatContextRailProps {
  profile: PlayerPerformanceProfile | undefined;
  rank: CurrentRank | null | undefined;
}

interface ContextRow {
  label: string;
  value: string;
  tone?: "accent" | "loss";
}

/**
 * The rail answers "what is it actually looking at".
 *
 * Every row here is part of the sample the answers are drawn from, so a reply
 * that surprises the reader can be checked against the context that produced
 * it rather than taken on faith.
 */
export function ChatContextRail({ profile, rank }: ChatContextRailProps): React.JSX.Element | null {
  const rows: ContextRow[] = [];

  if (profile) {
    rows.push({ label: "Games read", value: String(profile.gamesAnalyzed) });
    rows.push({
      label: "Win rate",
      value: `${Math.round(profile.winRate)}%`,
      tone: profile.winRate >= 50 ? "accent" : undefined,
    });
    rows.push({ label: "Playstyle", value: profile.playstyle });
    rows.push({ label: "Strongest", value: profile.strongestArea, tone: "accent" });
    rows.push({ label: "Weakest", value: profile.weakestArea, tone: "loss" });
    if (profile.mostPlayedChampions[0]) {
      rows.push({ label: "Most played", value: profile.mostPlayedChampions[0] });
    }
  }
  if (rank) {
    rows.push({ label: "Rank", value: `${rank.tier} ${rank.division} · ${rank.lp} LP` });
  }

  if (rows.length === 0) return null;

  return (
    <div className="grid content-start gap-3.5 overflow-y-auto p-4">
      <section className="notch border border-border bg-surface">
        <div className="border-b border-line-1 px-4 py-3 font-mono text-[10px] uppercase tracking-label text-text-muted">
          {"// WHAT THE COACH SEES"}
        </div>
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-2.5 border-b border-line-1 px-4 py-2 text-[13px] last:border-b-0"
          >
            <span className="text-fg-3">{row.label}</span>
            <span
              className={`text-right font-mono text-xs uppercase ${
                row.tone === "accent"
                  ? "text-acid-500"
                  : row.tone === "loss"
                    ? "text-danger"
                    : "text-fg-1"
              }`}
            >
              {row.value}
            </span>
          </div>
        ))}
      </section>

      {/* Extra bottom padding so the notch's corner cut clears the button. */}
      <section className="notch bg-hero-fade glow-accent-soft border border-acid-500 bg-surface px-4 pb-6 pt-4">
        <div className="font-display text-sm font-extrabold uppercase leading-tight tracking-wide text-fg-1">
          Turn this into a plan
        </div>
        <p className="mb-3 mt-2 text-[12.5px] text-fg-2">
          Tracked targets read from your games, not from this conversation.
        </p>
        <Link
          href="/improvement"
          className="notch-sm inline-flex w-full items-center justify-center gap-2 border border-acid-500 px-3 py-2 font-mono text-[10px] uppercase tracking-label text-acid-500 transition-colors hover:bg-acid-500/10"
        >
          Build my plan
          <ArrowRight className="h-3 w-3" aria-hidden />
        </Link>
      </section>
    </div>
  );
}
