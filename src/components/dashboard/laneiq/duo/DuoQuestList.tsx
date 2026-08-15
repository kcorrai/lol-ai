import { Check } from "lucide-react";
import type { DuoQuest } from "@/domains/analysis/services/duoQuestService";

interface Props {
  quests: DuoQuest[];
  weekEnd: string;
  isLoading: boolean;
}

/** Whole days left in the week, floored — "0 days left" means today is the last day. */
function daysLeft(weekEnd: string): number {
  return Math.max(0, Math.floor((new Date(weekEnd).getTime() - Date.now()) / 86_400_000));
}

export function DuoQuestList({ quests, weekEnd, isLoading }: Props): React.ReactElement | null {
  if (isLoading) {
    return (
      <div className="border-b border-border p-5">
        <p className="hud-label mb-3">{"// This week"}</p>
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-8 animate-pulse bg-surface-dark" />
          ))}
        </div>
      </div>
    );
  }

  if (quests.length === 0) return null;

  const remaining = daysLeft(weekEnd);

  return (
    <div className="border-b border-border p-5">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <p className="hud-label">{"// This week"}</p>
        <span className="font-mono text-[10px] uppercase tracking-label text-text-muted">
          {remaining === 0 ? "last day" : `${remaining}d left`}
        </span>
      </div>

      <ul className="space-y-3">
        {quests.map((q) => {
          const share = Math.round((q.progress / q.target) * 100);

          return (
            <li key={q.key}>
              <div className="flex items-baseline justify-between gap-2">
                <span
                  className={`min-w-0 flex-1 truncate text-[12.5px] ${
                    q.completed ? "text-text-muted line-through" : "text-text-body"
                  }`}
                >
                  {q.detail}
                </span>
                <span className="shrink-0 font-mono text-[11px] text-text-muted">
                  {q.completed ? (
                    <span className="inline-flex items-center gap-1 text-accent">
                      <Check className="h-3 w-3" strokeWidth={3} />+{q.xpReward}
                    </span>
                  ) : (
                    `${q.progress}/${q.target}`
                  )}
                </span>
              </div>
              <div className="mt-1.5 h-1 w-full overflow-hidden bg-surface-dark">
                <div
                  className={`h-full ${q.completed ? "bg-accent" : "bg-line-3"}`}
                  style={{ width: `${share}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
