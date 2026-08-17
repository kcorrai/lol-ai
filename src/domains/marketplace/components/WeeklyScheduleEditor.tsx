"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RuleInput } from "@/domains/marketplace";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface Props {
  initial: RuleInput[];
  saving: boolean;
  timeZone: string;
  onSave: (rules: RuleInput[]) => Promise<void>;
}

/**
 * The weekly hours, edited as rows of "these days, these hours".
 *
 * The times shown here are the coach's own wall clock, and they are stored that
 * way — 18:00 stays 18:00 through a DST change rather than quietly becoming
 * 17:00 (ADR-022). The zone is stated on screen because a coach who has moved
 * country needs to notice.
 */
export function WeeklyScheduleEditor({
  initial,
  saving,
  timeZone,
  onSave,
}: Props): React.ReactElement {
  const [rules, setRules] = useState<RuleInput[]>(
    initial.length > 0 ? initial : [{ days: [1, 2, 3, 4, 5], startMinute: 1080, endMinute: 1260 }]
  );
  const [error, setError] = useState<string | null>(null);

  function update(index: number, patch: Partial<RuleInput>): void {
    setRules((prev) => prev.map((rule, i) => (i === index ? { ...rule, ...patch } : rule)));
  }

  function toggleDay(index: number, day: number): void {
    setRules((prev) =>
      prev.map((rule, i) =>
        i === index
          ? {
              ...rule,
              days: rule.days.includes(day)
                ? rule.days.filter((d) => d !== day)
                : [...rule.days, day].sort(),
            }
          : rule
      )
    );
  }

  async function save(): Promise<void> {
    setError(null);
    try {
      await onSave(rules);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your hours.");
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-text-muted">
        Times are in <span className="font-mono text-text">{timeZone}</span> — your own clock. They
        stay put when the clocks change.
      </p>

      <div className="space-y-3">
        {rules.map((rule, index) => (
          <div key={index} className="space-y-2 rounded-lg border border-border bg-surface p-3">
            <div className="flex flex-wrap gap-1.5">
              {DAY_LABELS.map((label, day) => (
                <button
                  key={day}
                  type="button"
                  role="checkbox"
                  aria-checked={rule.days.includes(day)}
                  aria-label={label}
                  onClick={() => toggleDay(index, day)}
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                    rule.days.includes(day)
                      ? "border-accent bg-accent/15 text-accent"
                      : "border-border bg-surface-2 text-text-muted hover:text-text"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <TimeInput
                label="From"
                value={rule.startMinute}
                onChange={(startMinute) => update(index, { startMinute })}
              />
              <TimeInput
                label="To"
                value={rule.endMinute}
                onChange={(endMinute) => update(index, { endMinute })}
              />

              <Button
                size="sm"
                variant="ghost"
                className="ml-auto"
                onClick={() => setRules((prev) => prev.filter((_, i) => i !== index))}
                aria-label="Remove this row"
              >
                <Trash2 className="h-3 w-3" aria-hidden />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => void save()} disabled={saving}>
          {saving ? "Saving…" : "Save hours"}
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            setRules((prev) => [...prev, { days: [6], startMinute: 600, endMinute: 780 }])
          }
        >
          <Plus className="h-3 w-3" aria-hidden />
          Add a row
        </Button>
      </div>
    </div>
  );
}

function TimeInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (minutes: number) => void;
}): React.ReactElement {
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <label className="flex items-center gap-2 text-xs text-text-muted">
      {label}
      <input
        type="time"
        value={`${pad(Math.floor(value / 60))}:${pad(value % 60)}`}
        onChange={(e) => {
          const [h, m] = e.target.value.split(":").map(Number);
          if (Number.isFinite(h) && Number.isFinite(m)) onChange(h * 60 + m);
        }}
        className="rounded-md border border-border bg-surface-2 px-2 py-1 font-mono text-sm text-text"
      />
    </label>
  );
}
