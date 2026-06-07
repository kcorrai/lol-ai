"use client";

import { useEffect, useState } from "react";
import type { ComponentType } from "react";

function useCountUp(target: number, active: boolean, duration = 1200): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) { setCount(0); return; }
    let start: number | undefined;
    const step = (ts: number) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      setCount(Math.min(Math.round((elapsed / duration) * target), target));
      if (elapsed < duration) requestAnimationFrame(step);
    };
    const id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [target, active, duration]);
  return count;
}

interface Stat {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  icon?: ComponentType<{ className?: string }>;
  color?: string;
}

interface Props {
  stats: Stat[];
  active?: boolean;
}

function StatCard({ stat, active }: { stat: Stat; active: boolean }) {
  const count = useCountUp(Math.abs(stat.value), active);
  const Icon = stat.icon;
  const color = stat.color ?? "text-text";
  return (
    <div
      className="gaming-card flex flex-col items-center gap-2 rounded-2xl p-4"
      style={{ boxShadow: "0 0 20px rgba(200,155,60,0.06), inset 0 1px 0 rgba(255,255,255,0.04)" }}
    >
      {Icon && (
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
      )}
      <span className={`font-display text-3xl font-black ${color}`}>
        {stat.prefix}{stat.value < 0 ? "-" : ""}{count}{stat.suffix}
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
        {stat.label}
      </span>
    </div>
  );
}

export function RecapStats({ stats, active = true }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 w-full">
      {stats.map((s) => (
        <StatCard key={s.label} stat={s} active={active} />
      ))}
    </div>
  );
}
