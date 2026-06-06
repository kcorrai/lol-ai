"use client";

import { cn } from "@/lib/utils";
import { Zap, Swords, Trophy } from "lucide-react";
import type { WinCondition } from "../types/draft.types";

interface WinConditionsCardProps {
  blueConditions: WinCondition[];
  redConditions: WinCondition[];
}

const PHASE_META = {
  early: { label: "Erken Oyun", time: "0-15 dk", Icon: Zap, color: "text-yellow-400" },
  mid: { label: "Orta Oyun", time: "15-25 dk", Icon: Swords, color: "text-orange-400" },
  late: { label: "Geç Oyun", time: "25+ dk", Icon: Trophy, color: "text-purple-400" },
} as const;

type Phase = keyof typeof PHASE_META;

function PhaseHeader({ phase }: { phase: Phase }) {
  const { label, time, Icon, color } = PHASE_META[phase];
  return (
    <div className={cn("flex items-center gap-1.5 text-xs font-semibold", color)}>
      <Icon className="h-3 w-3" />
      {label}
      <span className="font-normal text-text-muted">({time})</span>
    </div>
  );
}

function ConditionItem({ condition, color }: { condition: WinCondition; color: "blue" | "red" }) {
  const isPrimary = condition.priority === "primary";
  const badgeBg = color === "blue"
    ? "bg-blue-500/15 border-blue-500/30 text-blue-400"
    : "bg-red-500/15 border-red-500/30 text-red-400";
  const textColor = color === "blue" ? "text-blue-400" : "text-red-400";

  return (
    <div className="rounded-lg border border-border p-2.5 space-y-1">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border border-border bg-surface-2" />
        <div className="flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={cn("rounded border px-1.5 py-0.5 text-xs shrink-0", badgeBg)}>
              {isPrimary ? "P1" : "P2"}
            </span>
            <p className={cn("text-xs font-medium", textColor)}>{condition.description}</p>
          </div>
          <p className="mt-1 text-xs text-text-muted">{condition.howToAchieve}</p>
        </div>
      </div>
    </div>
  );
}

function TeamColumn({ conditions, color, label }: { conditions: WinCondition[]; color: "blue" | "red"; label: string }) {
  const phases: Phase[] = ["early", "mid", "late"];
  const ungrouped = conditions.filter((c) => !c.phase);
  const grouped = phases.map((p) => ({ phase: p, items: conditions.filter((c) => c.phase === p) }))
    .filter(({ items }) => items.length > 0);
  const hasPhases = grouped.length > 0;

  return (
    <div className="space-y-2">
      <p className={cn("text-xs font-semibold", color === "blue" ? "text-blue-400" : "text-red-400")}>{label}</p>
      {hasPhases ? (
        <>
          {grouped.map(({ phase, items }) => (
            <div key={phase} className="space-y-1.5">
              <PhaseHeader phase={phase} />
              {items.map((c, i) => <ConditionItem key={i} condition={c} color={color} />)}
            </div>
          ))}
          {ungrouped.map((c, i) => <ConditionItem key={`u${i}`} condition={c} color={color} />)}
        </>
      ) : (
        conditions.map((c, i) => <ConditionItem key={i} condition={c} color={color} />)
      )}
    </div>
  );
}

export function WinConditionsCard({ blueConditions, redConditions }: WinConditionsCardProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
      <h3 className="text-sm font-semibold text-text">Kazanma Koşulları</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TeamColumn conditions={blueConditions} color="blue" label="Mavi Takım" />
        <TeamColumn conditions={redConditions} color="red" label="Kırmızı Takım" />
      </div>
    </div>
  );
}
