"use client";

import { Sparkles } from "lucide-react";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import type { Position } from "@prisma/client";
import type { OtpRecommendation } from "@/domains/otp/services/otpRecommendationService";

const POSITION_LABEL: Record<string, string> = {
  TOP: "Top", JUNGLE: "Jungle", MIDDLE: "Mid", BOTTOM: "ADC", UTILITY: "Support",
};

interface Props {
  recommendations: OtpRecommendation[];
  onSelect: (champion: string, role: Position) => void;
}

// Data-driven "one-trick these" suggestions from the user's own ranked data (TASK-235). Clicking a
// card selects that champion + role so the existing OTP analysis loads.
export function RecommendedOtps({ recommendations, onSelect }: Props): React.JSX.Element | null {
  if (recommendations.length === 0) return null;

  return (
    <div data-tour="otp-recommendations" className="mb-6 rounded-xl border border-accent/30 bg-accent/5 p-4">
      <div className="mb-3 flex items-center gap-1.5">
        <Sparkles className="h-4 w-4 text-accent" />
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">Recommended OTPs for you</p>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {recommendations.map((r) => (
          <button
            key={r.championId}
            type="button"
            onClick={() => onSelect(r.name, r.position)}
            className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3 text-left transition-colors hover:border-accent/50 hover:bg-accent/5"
          >
            <ChampionIcon name={r.name} size={40} className="shrink-0" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-text">{r.name}</p>
              <p className="text-[11px] text-text-muted">{POSITION_LABEL[r.position] ?? r.position} · {r.games} games</p>
              <p className="text-[11px]">
                <span className={r.winRate >= 55 ? "text-success" : r.winRate < 45 ? "text-danger" : "text-text-muted"}>
                  {r.winRate}% WR
                </span>
                <span className="text-text-muted"> · {r.avgKda.toFixed(2)} KDA</span>
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
