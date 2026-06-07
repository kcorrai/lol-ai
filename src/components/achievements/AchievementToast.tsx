"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useAchievements, useMarkAchievementsSeen } from "@/hooks/useAchievements";
import { TIER_COLORS } from "@/types/achievement";

export function AchievementToast() {
  const { data } = useAchievements();
  const { mutate: markSeen } = useMarkAchievementsSeen();
  const shownRef = useRef(new Set<string>());

  const unseen = data?.earned.filter((a) => !a.seen && !shownRef.current.has(a.id)) ?? [];
  const current = unseen[0] ?? null;

  useEffect(() => {
    if (!current) return;
    shownRef.current.add(current.id);
  }, [current]);

  if (!current) return null;

  const tierColor = TIER_COLORS[current.tier];

  function dismiss(): void {
    if (!current) return;
    markSeen([current.id]);
  }

  return (
    <div
      className="fixed bottom-20 right-4 z-50 flex w-72 items-start gap-3 rounded-xl border bg-surface p-4 shadow-xl md:bottom-6"
      style={{ borderColor: `${tierColor}55` }}
    >
      {/* Icon */}
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl"
        style={{ background: `${tierColor}22`, border: `2px solid ${tierColor}` }}
      >
        {current.iconSlug}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: tierColor }}>
          Yeni Rozet!
        </p>
        <p className="font-semibold text-text">{current.name}</p>
        <p className="mt-0.5 text-xs text-text-muted">{current.description}</p>
      </div>

      {/* Dismiss */}
      <button
        onClick={dismiss}
        className="shrink-0 rounded p-0.5 text-text-muted transition-colors hover:text-text"
        aria-label="Kapat"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
