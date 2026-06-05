"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { ScalingProfile } from "../types/draft.types";

interface ScalingChartProps {
  blue: ScalingProfile;
  red: ScalingProfile;
}

const PHASES: Array<{ key: keyof ScalingProfile; label: string }> = [
  { key: "earlyGame", label: "Erken Oyun" },
  { key: "midGame", label: "Orta Oyun" },
  { key: "lateGame", label: "Geç Oyun" },
];

function ScalingDot({ score, color }: { score: number; color: "blue" | "red" }) {
  const size = 8 + Math.round((score / 10) * 12);
  const bg = color === "blue" ? "bg-blue-500" : "bg-red-500";
  return (
    <div
      className={cn("rounded-full", bg)}
      style={{ width: size, height: size }}
      title={`${score}/10`}
    />
  );
}

export function ScalingChart({ blue, red }: ScalingChartProps) {
  const [expanded, setExpanded] = useState<keyof ScalingProfile | null>(null);

  return (
    <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
      <h3 className="text-sm font-semibold text-text">Scaling Profili</h3>
      <div className="grid grid-cols-3 gap-3">
        {PHASES.map(({ key, label }) => {
          const bs = blue[key];
          const rs = red[key];
          const isOpen = expanded === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setExpanded(isOpen ? null : key)}
              className="rounded-lg border border-border p-3 text-left hover:bg-surface-2 transition-colors"
            >
              <p className="mb-2 text-xs font-medium text-text-muted">{label}</p>
              <div className="flex items-end gap-2">
                <div className="flex flex-col items-center gap-1">
                  <ScalingDot score={bs.score} color="blue" />
                  <span className="text-xs font-semibold text-blue-400">{bs.score}</span>
                </div>
                <span className="mb-1 text-xs text-text-muted">vs</span>
                <div className="flex flex-col items-center gap-1">
                  <ScalingDot score={rs.score} color="red" />
                  <span className="text-xs font-semibold text-red-400">{rs.score}</span>
                </div>
              </div>
              {isOpen && (
                <div className="mt-2 space-y-1 border-t border-border pt-2">
                  <p className="text-xs text-blue-400/80">{bs.description}</p>
                  <p className="text-xs text-red-400/80">{rs.description}</p>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
