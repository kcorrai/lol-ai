"use client";

import { ShieldOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import type { BanRecommendation } from "../types/draft.types";

interface BanRecommendationsCardProps {
  recommendations: BanRecommendation[];
}

export function BanRecommendationsCard({ recommendations }: BanRecommendationsCardProps) {
  if (recommendations.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
      <div className="flex items-center gap-2">
        <ShieldOff className="h-4 w-4 text-orange-400" />
        <h3 className="text-sm font-semibold text-text">AI Ban Önerileri</h3>
      </div>

      <div className="space-y-2">
        {recommendations.map((rec, i) => (
          <div key={i} className="flex items-start gap-3 rounded-lg border border-border bg-surface-2 p-3">
            <ChampionIcon name={rec.champion} size={36} className="rounded-lg shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-text">{rec.champion}</span>
                <span className={cn(
                  "rounded px-1.5 py-0.5 text-xs font-semibold",
                  rec.targetTeam === "blue"
                    ? "bg-blue-500/15 text-blue-400"
                    : "bg-red-500/15 text-red-400"
                )}>
                  {rec.targetTeam === "blue" ? "Mavi Takım Tehdidi" : "Kırmızı Takım Tehdidi"}
                </span>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">{rec.reason}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
