"use client";

import { Flame } from "lucide-react";
import { championSplashUrl } from "@/lib/ddragon";
import { ResetCountdown } from "./ResetCountdown";

interface QuizHeroProps {
  /** Set after mount — it reads the viewer's clock. */
  dateLabel?: string;
  streak: number;
  solvedToday: number;
  totalModes: number;
  nextResetAt?: string;
}

/** Decorative and fixed: the same champion every day, so it cannot hint at one. */
const HERO_ART = "Thresh";

function HudStat({ label, value }: { label: string; value: React.ReactNode }): React.JSX.Element {
  return (
    <div>
      <p className="font-mono text-[9.5px] uppercase tracking-label text-fg-4">{label}</p>
      <p className="mt-1.5 font-mono text-[22px] font-bold tabular-nums leading-none text-fg-1">
        {value}
      </p>
    </div>
  );
}

/**
 * The day's front page. Everything a returning player checks before they play —
 * streak, how much of today is left to solve, when the next set lands — reads
 * from here without scrolling, over art rather than over an empty bar.
 */
export function QuizHero({
  dateLabel,
  streak,
  solvedToday,
  totalModes,
  nextResetAt,
}: QuizHeroProps): React.JSX.Element {
  return (
    <section className="relative overflow-hidden border-b border-line-1">
      <span
        aria-hidden
        className="absolute inset-0 bg-cover opacity-[.34] contrast-[1.1] grayscale-[.4]"
        style={{
          backgroundImage: `url('${championSplashUrl(HERO_ART)}')`,
          backgroundPosition: "60% 20%",
        }}
      />
      <span
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-ink-1000 via-ink-1000/70 to-ink-1000/30"
      />
      <span aria-hidden className="bg-scanline absolute inset-0" />
      <span aria-hidden className="bg-protect-bottom absolute inset-x-0 bottom-0 h-1/2" />

      <div className="relative mx-auto flex max-w-[1240px] flex-wrap items-end justify-between gap-8 px-5 pb-6 pt-8 md:px-8">
        <div>
          <div className="flex items-center gap-2.5">
            <span aria-hidden className="h-[6px] w-[6px] animate-glow-pulse bg-acid-500" />
            <span className="font-mono text-[10.5px] uppercase tracking-micro text-acid-500">
              Daily{dateLabel ? ` · ${dateLabel}` : ""}
            </span>
          </div>
          <h1 className="mt-3 font-display text-[38px] font-black uppercase leading-[0.94] text-fg-1 md:text-[52px]">
            LaneIQ Daily
          </h1>
          <p className="mt-3.5 max-w-[52ch] text-[15px] leading-relaxed text-fg-2">
            Eight puzzles, one champion each, new at midnight UTC. Unlimited guesses — every miss
            hands you a little more. Solve any one mode to keep the streak.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-7 pb-0.5">
          <div
            className={`notch flex items-center gap-3 border px-4 py-3 ${
              streak > 0
                ? "glow-accent-soft border-acid-500 bg-ink-1000/60"
                : "border-line-2 bg-ink-1000/60"
            }`}
          >
            <Flame
              className={`h-[22px] w-[22px] shrink-0 ${streak > 0 ? "text-acid-500" : "text-fg-4"}`}
            />
            <span className="grid gap-1">
              <span
                className={`font-mono text-[22px] font-bold tabular-nums leading-none ${
                  streak > 0 ? "text-acid-500" : "text-fg-3"
                }`}
              >
                {streak}
              </span>
              <span className="font-mono text-[9.5px] uppercase tracking-label text-fg-4">
                day streak
              </span>
            </span>
          </div>

          <HudStat label="Solved today" value={`${solvedToday}/${totalModes}`} />
          <HudStat
            label="Next set in"
            value={nextResetAt ? <ResetCountdown nextResetAt={nextResetAt} /> : "—"}
          />
        </div>
      </div>
    </section>
  );
}
