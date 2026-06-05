"use client";

import type { TeamComposition } from "../types/draft.types";

interface TeamCompositionCardProps {
  blue: TeamComposition;
  red: TeamComposition;
}

const METRICS: Array<{ key: keyof Omit<TeamComposition, "summary">; label: string }> = [
  { key: "engagePower", label: "Engage" },
  { key: "disengagePower", label: "Disengage" },
  { key: "teamfightPower", label: "Teamfight" },
  { key: "pickPotential", label: "Pick Pot." },
  { key: "splitPushPower", label: "Split Push" },
];

function MetricBar({ label, blueScore, redScore }: { label: string; blueScore: number; redScore: number }) {
  const bluePct = (blueScore / 10) * 100;
  const redPct = (redScore / 10) * 100;

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
      {/* Blue bar (right-aligned) */}
      <div className="flex items-center justify-end gap-1.5">
        <span className="text-xs font-semibold text-blue-400">{blueScore}</span>
        <div className="h-2 w-24 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-blue-500 ml-auto"
            style={{ width: `${bluePct}%` }}
          />
        </div>
      </div>
      <span className="w-20 text-center text-xs text-text-muted">{label}</span>
      {/* Red bar (left-aligned) */}
      <div className="flex items-center gap-1.5">
        <div className="h-2 w-24 overflow-hidden rounded-full bg-surface-2">
          <div className="h-full rounded-full bg-red-500" style={{ width: `${redPct}%` }} />
        </div>
        <span className="text-xs font-semibold text-red-400">{redScore}</span>
      </div>
    </div>
  );
}

export function TeamCompositionCard({ blue, red }: TeamCompositionCardProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-blue-400">Mavi Takım</h3>
        <span className="text-xs text-text-muted">Takım Kompozisyonu</span>
        <h3 className="text-sm font-semibold text-red-400">Kırmızı Takım</h3>
      </div>
      <div className="space-y-3">
        {METRICS.map(({ key, label }) => (
          <MetricBar key={key} label={label} blueScore={blue[key]} redScore={red[key]} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 border-t border-border pt-3">
        <p className="text-xs text-text-muted italic">{blue.summary}</p>
        <p className="text-xs text-text-muted italic text-right">{red.summary}</p>
      </div>
    </div>
  );
}
