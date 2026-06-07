"use client";

import { useEffect, useState } from "react";

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
}

interface Props {
  stats: Stat[];
  active?: boolean;
}

export function RecapStats({ stats, active = true }: Props) {
  return (
    <div className="grid grid-cols-2 gap-6">
      {stats.map((s) => {
        const count = useCountUp(Math.abs(s.value), active); // eslint-disable-line react-hooks/rules-of-hooks
        return (
          <div key={s.label} className="flex flex-col items-center gap-1">
            <span className="font-display text-4xl font-black text-text">
              {s.prefix}{s.value < 0 ? "-" : ""}{count}{s.suffix}
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              {s.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
