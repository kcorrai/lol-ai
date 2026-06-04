"use client";

import { useTodaysFocus } from "@/hooks/useTodaysFocus";

interface TodaysFocusCardProps {
  riotAccountId: string | null | undefined;
}

export function TodaysFocusCard({ riotAccountId }: TodaysFocusCardProps) {
  const { data: focus, isLoading } = useTodaysFocus(riotAccountId);

  if (isLoading) {
    return <div className="h-20 animate-pulse rounded-xl border border-border bg-surface" />;
  }

  if (!focus) return null;

  return (
    <div className="rounded-xl border border-accent/30 bg-accent/5 p-4">
      <p className="mb-1 text-xs font-medium uppercase tracking-widest text-accent">
        Today&apos;s Focus
      </p>
      <p className="mb-2 text-sm font-semibold text-text">{focus.action}</p>
      <p className="mb-3 text-xs text-text-muted">{focus.howTo}</p>
      <div className="flex flex-wrap gap-3 text-xs text-text-muted">
        <span>
          Impact:{" "}
          <span className="font-medium text-text">{focus.expectedImpact}</span>
        </span>
        <span>
          Timeframe:{" "}
          <span className="font-medium text-text">{focus.timeframe}</span>
        </span>
      </div>
    </div>
  );
}
