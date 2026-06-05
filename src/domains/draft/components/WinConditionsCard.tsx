"use client";

import { cn } from "@/lib/utils";
import type { WinCondition } from "../types/draft.types";

interface WinConditionsCardProps {
  blueConditions: WinCondition[];
  redConditions: WinCondition[];
}

function WinConditionItem({ condition, color }: { condition: WinCondition; color: "blue" | "red" }) {
  const isPrimary = condition.priority === "primary";
  const textColor = color === "blue" ? "text-blue-400" : "text-red-400";
  const badgeBg = color === "blue"
    ? "bg-blue-500/15 border-blue-500/30 text-blue-400"
    : "bg-red-500/15 border-red-500/30 text-red-400";

  return (
    <div className="rounded-lg border border-border p-3 space-y-1">
      <div className="flex items-center gap-2">
        <span className={cn("rounded border px-1.5 py-0.5 text-xs", badgeBg)}>
          {isPrimary ? "P1" : "P2"}
        </span>
        <p className={cn("text-xs font-medium", textColor)}>{condition.description}</p>
      </div>
      <p className="text-xs text-text-muted pl-8">{condition.howToAchieve}</p>
    </div>
  );
}

export function WinConditionsCard({ blueConditions, redConditions }: WinConditionsCardProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
      <h3 className="text-sm font-semibold text-text">Kazanma Koşulları</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-blue-400">Mavi Takım</p>
          {blueConditions.map((c, i) => (
            <WinConditionItem key={i} condition={c} color="blue" />
          ))}
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold text-red-400">Kırmızı Takım</p>
          {redConditions.map((c, i) => (
            <WinConditionItem key={i} condition={c} color="red" />
          ))}
        </div>
      </div>
    </div>
  );
}
