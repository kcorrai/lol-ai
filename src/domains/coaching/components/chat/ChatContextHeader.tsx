"use client";

import type { PlayerPerformanceProfile } from "@/domains/analysis/types/analysis.types";

interface ChatContextHeaderProps {
  profile: PlayerPerformanceProfile | undefined;
}

function Stat({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <div>
      <div className="font-mono text-[9.5px] uppercase tracking-label text-fg-4">{label}</div>
      <div className="mt-1 font-display text-base font-bold uppercase text-fg-1">{value}</div>
    </div>
  );
}

/**
 * What the coach already knows, stated before the first question.
 *
 * The blank chat gave no reason to believe the answers would be about *your*
 * games rather than a wiki page. Naming the sample up front is the difference.
 */
export function ChatContextHeader({ profile }: ChatContextHeaderProps): React.JSX.Element {
  return (
    <div className="notch bg-hero-fade border border-border bg-surface px-5 py-4">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="h-[7px] w-[7px] animate-glow-pulse bg-acid-500" />
        <span className="font-mono text-[10.5px] uppercase tracking-label text-acid-500">
          {profile
            ? `// YOUR COACH HAS READ ${profile.gamesAnalyzed} GAMES`
            : "// YOUR COACH READS YOUR RANKED GAMES"}
        </span>
      </div>
      <p className="m-0 mb-3 max-w-[30ch] font-display text-[17px] font-bold uppercase leading-[1.26] text-fg-1">
        Ask about your own games, not a wiki page
      </p>
      {profile && (
        <div className="flex flex-wrap gap-x-6 gap-y-3 border-t border-line-1 pt-3">
          <Stat label="Games read" value={String(profile.gamesAnalyzed)} />
          <Stat label="Win rate" value={`${Math.round(profile.winRate)}%`} />
          <Stat label="Biggest leak" value={profile.weakestArea} />
        </div>
      )}
    </div>
  );
}
