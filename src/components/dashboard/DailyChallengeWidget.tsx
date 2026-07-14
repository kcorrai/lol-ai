"use client";

import { useChallenges } from "@/hooks/useChallenges";
import { Zap } from "lucide-react";

function timeLeft(until: Date): string {
  const ms = new Date(until).getTime() - Date.now();
  if (ms <= 0) return "Expired";
  const hours = Math.floor(ms / 3_600_000);
  const mins = Math.floor((ms % 3_600_000) / 60_000);
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

export function DailyChallengeWidget() {
  const { data, isLoading } = useChallenges();

  if (isLoading) {
    return (
      <div className="animate-pulse rounded-xl border border-border bg-surface p-4 h-32" />
    );
  }

  const daily = data?.challenges.find((c) => c.type === "daily");
  const weekly = data?.challenges.find((c) => c.type === "weekly");

  if (!daily && !weekly) {
    return (
      <div className="rounded-xl border border-border bg-surface p-4 text-sm text-text-muted">
        Loading challenges for today...
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4 text-accent" />
        <h3 className="text-sm font-semibold text-text">Today&apos;s Challenge</h3>
      </div>

      {daily && (
        <ChallengeRow
          description={daily.description}
          progress={daily.progress}
          xpReward={daily.xpReward}
          validUntil={daily.validUntil}
          completed={daily.completed}
          label="Daily"
        />
      )}

      {weekly && (
        <ChallengeRow
          description={weekly.description}
          progress={weekly.progress}
          xpReward={weekly.xpReward}
          validUntil={weekly.validUntil}
          completed={weekly.completed}
          label="Weekly"
        />
      )}

      {data && (
        <div className="flex items-center gap-2 pt-1">
          <span className="text-xs text-text-muted">
            🔥 {data.streak} day streak
          </span>
        </div>
      )}
    </div>
  );
}

function ChallengeRow({
  description,
  progress,
  xpReward,
  validUntil,
  completed,
  label,
}: {
  description: string;
  progress: number;
  xpReward: number;
  validUntil: Date;
  completed: boolean;
  label: string;
}) {
  const pct = Math.round(progress * 100);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-accent">{label}</span>
        {completed && <span className="text-[10px] font-bold text-green-400">✓ Completed</span>}
      </div>
      <p className="text-sm text-text">{description}</p>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
        <div
          className={`h-full rounded-full transition-all duration-700 ${completed ? "bg-green-400" : "bg-accent"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-text-muted">
        <span>+{xpReward} XP</span>
        <span>{timeLeft(validUntil)} left</span>
      </div>
    </div>
  );
}
