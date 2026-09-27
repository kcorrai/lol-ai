"use client";

import { useState } from "react";
import type { SessionGoalMetric } from "@prisma/client";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GOAL_METRICS } from "@/domains/marketplace/goalMetrics";
import { useSetSessionGoals } from "@/hooks/useSessionGoals";
import type { GoalView } from "@/domains/marketplace/services/sessionGoalService";

const METRICS = Object.keys(GOAL_METRICS) as SessionGoalMetric[];
const MAX = 3;

interface Row {
  metric: SessionGoalMetric;
  target: string;
}

interface Props {
  bookingId: string;
  current: GoalView[];
  onDone: () => void;
}

/** The coach's side: up to three measurable goals for the student's next games. */
export function GoalEditor({ bookingId, current, onDone }: Props): React.ReactElement {
  const save = useSetSessionGoals(bookingId);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>(
    current.length > 0
      ? current.map((g) => ({ metric: g.metric, target: String(g.target) }))
      : [{ metric: "CS_PER_MIN", target: "7" }]
  );

  const unused = METRICS.filter((m) => !rows.some((r) => r.metric === m));
  const change = (i: number, patch: Partial<Row>): void =>
    setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  async function submit(): Promise<void> {
    setError(null);
    try {
      await save.mutateAsync(rows.map((r) => ({ metric: r.metric, target: Number(r.target) })));
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the goals.");
    }
  }

  return (
    <div className="grid gap-3">
      {rows.map((row, i) => {
        const rule = GOAL_METRICS[row.metric];
        return (
          <div key={row.metric} className="flex flex-wrap items-center gap-2">
            <select
              value={row.metric}
              aria-label="Metric"
              onChange={(e) => change(i, { metric: e.target.value as SessionGoalMetric })}
              className="h-10 border border-line-2 bg-surface-dark px-2.5 text-[13px] text-text"
            >
              {[row.metric, ...unused].map((m) => (
                <option key={m} value={m}>
                  {GOAL_METRICS[m].label}
                </option>
              ))}
            </select>
            <span className="text-[12.5px] text-text-muted">
              {rule.direction === "min" ? "at least" : "at most"}
            </span>
            <input
              type="number"
              step="0.1"
              min={rule.range[0]}
              max={rule.range[1]}
              value={row.target}
              aria-label={`${rule.label} target`}
              onChange={(e) => change(i, { target: e.target.value })}
              className="h-10 w-20 border border-line-2 bg-surface-dark px-2.5 font-mono text-[13px] text-text"
            />
            <span className="text-[12px] text-text-faint">{rule.unit}</span>
            <button
              type="button"
              onClick={() => setRows(rows.filter((_, j) => j !== i))}
              aria-label="Remove goal"
              className="ml-auto p-1.5 text-text-muted hover:text-danger"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}

      {rows.length < MAX && unused.length > 0 && (
        <button
          type="button"
          onClick={() =>
            setRows([
              ...rows,
              { metric: unused[0], target: String(GOAL_METRICS[unused[0]].range[0]) },
            ])
          }
          className="flex w-fit items-center gap-1.5 text-[12.5px] text-accent hover:underline"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Add a goal
        </button>
      )}

      {error && <p className="text-[12.5px] text-danger">{error}</p>}
      <div className="flex gap-2.5">
        <Button size="sm" onClick={() => void submit()} disabled={save.isPending}>
          Save goals
        </Button>
        <Button size="sm" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
