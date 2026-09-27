"use client";

import { useState } from "react";
import { Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { HudPanel } from "@/domains/marketplace/components/hud/HudPanel";
import { GoalEditor } from "@/domains/marketplace/components/sessions/GoalEditor";
import { useSessionGoals } from "@/hooks/useSessionGoals";
import type { BookingDetail } from "@/domains/marketplace/types";

const OPEN = ["CONFIRMED", "DELIVERED", "COMPLETED"];

/**
 * "What to work on", measured.
 *
 * The coach sets up to three numbers; the student's next ranked games on the
 * attached account are read against them. Both sides see the same count, so
 * the next session can start from it instead of from "did you practise?".
 */
export function SessionGoalsPanel({
  booking,
}: {
  booking: BookingDetail;
}): React.ReactElement | null {
  const { data } = useSessionGoals(booking.id);
  const [editing, setEditing] = useState(false);
  if (!OPEN.includes(booking.status) || !data) return null;

  const isCoach = booking.role === "coach";
  if (!isCoach && data.goals.length === 0) return null;

  return (
    <HudPanel
      label="Goals until next time"
      tone="accent"
      action={
        isCoach && !editing ? (
          <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
            {data.goals.length ? "Edit goals" : "Set goals"}
          </Button>
        ) : undefined
      }
    >
      {editing ? (
        <GoalEditor bookingId={booking.id} current={data.goals} onDone={() => setEditing(false)} />
      ) : data.goals.length === 0 ? (
        <p className="text-[13.5px] text-text-body">
          Give your student up to three numbers to hit in their next {data.window} ranked games.
          LaneIQ tracks them from their match history.
        </p>
      ) : (
        <div className="grid gap-4">
          {data.goals.map((goal) => (
            <div key={goal.metric}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="flex items-center gap-2 text-[14px] text-text">
                  <Target className="h-4 w-4 text-accent" aria-hidden />
                  {goal.label} {goal.direction === "min" ? "≥" : "≤"}{" "}
                  <span className="font-mono">{goal.target}</span>
                </span>
                <span className="font-mono text-[12.5px] text-text-muted">
                  {goal.hits}/{data.games.length} games
                </span>
              </div>
              <div className="mt-2 flex gap-1" aria-hidden>
                {Array.from({ length: data.window }).map((_, i) => {
                  const result = data.games[i]?.results[goal.metric];
                  return (
                    <span
                      key={i}
                      className={cn(
                        "h-2 flex-1",
                        !result ? "bg-surface-dark" : result.met ? "bg-accent" : "bg-danger/70"
                      )}
                    />
                  );
                })}
              </div>
            </div>
          ))}
          <p className="text-[12px] text-text-muted">
            {footnote(data.tracked, data.games.length, data.window)}
          </p>
        </div>
      )}
    </HudPanel>
  );
}

function footnote(tracked: boolean, games: number, window: number): string {
  if (!tracked) return "No Riot account was attached to this booking, so games cannot be tracked.";
  if (games === 0)
    return `Counting starts with the next ranked game. The first ${window} are tracked.`;
  return `Ranked games since the goals were set, first ${window} counted.`;
}
