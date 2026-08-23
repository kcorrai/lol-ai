"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RuleInput } from "@/domains/marketplace";
import {
  cellKey,
  gridToRules,
  isHourAligned,
  openHoursPerWeek,
  rulesToGrid,
  type CellKey,
} from "@/domains/marketplace/availabilityGrid";
import { HudPanel } from "@/domains/marketplace/components/hud/HudPanel";
import { WeekGrid, WeekGridLegend } from "@/domains/marketplace/components/WeekGrid";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface Props {
  initial: RuleInput[];
  saving: boolean;
  timeZone: string;
  /** Hours already sold, as `day:hour`. Drawn on the grid and not editable. */
  booked: Set<CellKey>;
  onSave: (rules: RuleInput[]) => Promise<void>;
}

/**
 * The weekly hours, edited two ways over one piece of state.
 *
 * The grid is how a coach thinks about a week; the rows are what actually gets
 * stored, and they stay visible so the pattern is never a black box. Clicking a
 * cell rewrites the rows from the grid, which snaps to the hour — the warning
 * above the grid says so before it can happen to a 18:30 start.
 *
 * The times here are the coach's own wall clock and are stored that way: 18:00
 * stays 18:00 through a DST change rather than quietly becoming 17:00
 * (ADR-022). The zone is on screen because a coach who has moved needs to see it.
 */
export function WeeklyScheduleEditor({
  initial,
  saving,
  timeZone,
  booked,
  onSave,
}: Props): React.ReactElement {
  const [rules, setRules] = useState<RuleInput[]>(initial);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const grid = rulesToGrid(rules);
  const aligned = isHourAligned(rules);

  function change(next: RuleInput[]): void {
    setRules(next);
    setSaved(false);
  }

  function toggleCell(day: number, hour: number): void {
    const next = new Set(grid);
    const key = cellKey(day, hour);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    change(gridToRules(next));
  }

  function fillEvenings(): void {
    const next = new Set(grid);
    for (const day of [1, 2, 3, 4, 5]) {
      for (const hour of [18, 19, 20, 21]) next.add(cellKey(day, hour));
    }
    change(gridToRules(next));
  }

  async function save(): Promise<void> {
    setError(null);
    try {
      await onSave(rules);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your hours.");
    }
  }

  return (
    <div className="grid gap-4">
      <HudPanel
        label="Your week · click to open or close an hour"
        action={<WeekGridLegend />}
        padded={false}
      >
        <div className="p-5">
          {!aligned && (
            <p className="mb-3 border-l-2 border-warning bg-warning/10 px-3 py-2 text-[12.5px] text-warning">
              One of your rows starts or ends on a half hour. The grid shows those hours as fully
              open, and clicking any cell will round the whole pattern to the hour — edit the rows
              below instead if you want to keep it.
            </p>
          )}
          <WeekGrid open={grid} booked={booked} onToggle={toggleCell} />
        </div>

        <div className="flex flex-wrap items-center gap-3.5 border-t border-line-1 px-5 py-3">
          <Button size="sm" onClick={() => void save()} disabled={saving}>
            {saving ? "Saving…" : saved ? "Saved" : "Save hours"}
          </Button>
          <GhostAction onClick={fillEvenings}>Open weekday evenings</GhostAction>
          <GhostAction onClick={() => change([])}>Clear the week</GhostAction>
          <span className="ml-auto font-mono text-[9.5px] uppercase tracking-[0.14em] text-text-faint">
            {openHoursPerWeek(rules)} hours open &middot; {booked.size} booked
          </span>
        </div>
      </HudPanel>

      <HudPanel
        label="Repeating pattern"
        padded={false}
        action={
          <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-text-faint">
            Times are in {timeZone} — they stay put when the clocks change
          </span>
        }
      >
        {rules.length === 0 ? (
          <p className="px-5 py-8 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-text-faint">
            No hours open — students cannot book a scheduled session
          </p>
        ) : (
          rules.map((rule, index) => (
            <div
              key={index}
              className="flex flex-wrap items-center justify-between gap-4 border-b border-line-1 px-5 py-4"
            >
              <div className="flex flex-wrap gap-1.5">
                {DAY_LABELS.map((label, day) => (
                  <button
                    key={day}
                    type="button"
                    role="checkbox"
                    aria-checked={rule.days.includes(day)}
                    aria-label={label}
                    onClick={() =>
                      change(
                        rules.map((r, i) =>
                          i === index
                            ? {
                                ...r,
                                days: r.days.includes(day)
                                  ? r.days.filter((d) => d !== day)
                                  : [...r.days, day].sort((a, b) => a - b),
                              }
                            : r
                        )
                      )
                    }
                    className={cn(
                      "tag-cut border px-2.5 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.08em] transition-colors",
                      rule.days.includes(day)
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-line-2 bg-surface-dark text-text-faint hover:text-text"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <TimeInput
                  label="From"
                  value={rule.startMinute}
                  onChange={(startMinute) =>
                    change(rules.map((r, i) => (i === index ? { ...r, startMinute } : r)))
                  }
                />
                <TimeInput
                  label="to"
                  value={rule.endMinute}
                  onChange={(endMinute) =>
                    change(rules.map((r, i) => (i === index ? { ...r, endMinute } : r)))
                  }
                />
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-accent">
                  {openHoursPerWeek([rule])}h / week
                </span>
                <button
                  type="button"
                  aria-label="Remove this row"
                  onClick={() => change(rules.filter((_, i) => i !== index))}
                  className="tag-cut grid h-[30px] w-[30px] place-items-center border border-line-2 bg-surface-dark text-text-muted hover:border-danger hover:text-danger"
                >
                  <Trash2 className="h-[15px] w-[15px]" aria-hidden />
                </button>
              </div>
            </div>
          ))
        )}

        <div className="px-5 py-3">
          <GhostAction
            onClick={() =>
              change([...rules, { days: [1, 2, 3, 4, 5], startMinute: 1140, endMinute: 1320 }])
            }
          >
            <Plus className="mr-1 inline h-3 w-3" aria-hidden />
            Add a row
          </GhostAction>
        </div>
      </HudPanel>

      {error && (
        <p className="border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

function GhostAction({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted hover:text-text"
    >
      {children}
    </button>
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
    <label className="flex items-center gap-2 font-mono text-[9.5px] uppercase tracking-[0.16em] text-text-muted">
      {label}
      <input
        type="time"
        value={`${pad(Math.floor(value / 60))}:${pad(value % 60)}`}
        onChange={(e) => {
          const [h, m] = e.target.value.split(":").map(Number);
          if (Number.isFinite(h) && Number.isFinite(m)) onChange(h * 60 + m);
        }}
        className="well border border-line-2 bg-background px-2.5 py-1.5 font-mono text-[13px] normal-case tracking-[0.06em] text-text"
      />
    </label>
  );
}
