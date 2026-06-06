"use client";

import { AlertTriangle, ShieldCheck } from "lucide-react";
import type { MatchupAnalysis } from "../types/matchup.types";

function MistakeCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
      <p className="mb-2 text-xs font-semibold text-red-400">{title}</p>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm text-text">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MatchupMistakesTab({ data }: { data: MatchupAnalysis }) {
  const { criticalMistakes: cm } = data;
  const hasAdvice = cm.avoidanceAdvice && cm.avoidanceAdvice.length > 0;

  return (
    <div className="space-y-3">
      <MistakeCard title="Kaçınılacak Tradeler" items={cm.avoidTrades} />
      <MistakeCard title="Riskli Zamanlamalar" items={cm.riskyTimings} />

      <div>
        <p className="mb-2 text-xs font-semibold text-text-muted">Kritik Hatalar</p>
        {hasAdvice ? (
          <div className="space-y-2">
            {cm.keyMistakes.map((mistake, i) => (
              <div key={i} className="overflow-hidden rounded-lg border border-red-500/20">
                <div className="flex items-start gap-2 bg-red-500/5 p-3">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
                  <p className="text-sm text-text">{mistake}</p>
                </div>
                {cm.avoidanceAdvice![i] && (
                  <div className="flex items-start gap-2 border-t border-green-500/20 bg-green-500/5 p-3">
                    <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-400" />
                    <p className="text-xs text-text-muted">{cm.avoidanceAdvice![i]}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <ul className="space-y-1.5 rounded-lg border border-red-500/20 bg-red-500/5 p-3">
            {cm.keyMistakes.map((item, i) => (
              <li key={i} className="flex gap-2 text-sm text-text">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
                {item}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
