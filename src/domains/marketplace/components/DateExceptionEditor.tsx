"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AvailabilityView, ExceptionInput } from "@/domains/marketplace";
import { HudPanel } from "@/domains/marketplace/components/hud/HudPanel";
import { StatusChip } from "@/domains/marketplace/components/hud/StatusChip";

interface Props {
  exceptions: AvailabilityView["exceptions"];
  saving: boolean;
  onSave: (input: ExceptionInput) => void;
  onDelete: (date: string) => void;
}

/**
 * Days that do not follow the weekly rules.
 *
 * An exception **replaces** the day rather than adding to it, which is the only
 * behaviour that can express both "closed on the 3rd" and "open on a Sunday
 * for once" without a second concept. That sentence is in the header rather
 * than in a help page, because getting it backwards silently doubles a day.
 */
export function DateExceptionEditor({
  exceptions,
  saving,
  onSave,
  onDelete,
}: Props): React.ReactElement {
  const [date, setDate] = useState("");
  const [blocked, setBlocked] = useState(true);
  const [from, setFrom] = useState("10:00");
  const [to, setTo] = useState("13:00");

  function add(): void {
    if (!date) return;
    onSave({
      date,
      isBlocked: blocked,
      startMinute: blocked ? null : toMinutes(from),
      endMinute: blocked ? null : toMinutes(to),
    });
    setDate("");
  }

  return (
    <HudPanel
      label="Exceptions"
      padded={false}
      action={
        <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-text-faint">
          An exception replaces that day&apos;s hours rather than adding to them
        </span>
      }
    >
      <div className="flex flex-wrap items-end gap-3 border-b border-line-1 px-5 py-4">
        <label className="grid gap-1.5">
          <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-text-muted">
            Date
          </span>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-[180px]"
          />
        </label>

        <label className="flex items-center gap-2 pb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
          <input
            type="checkbox"
            checked={blocked}
            onChange={(e) => setBlocked(e.target.checked)}
            className="h-3.5 w-3.5 accent-accent"
          />
          Closed all day
        </label>

        {!blocked && (
          <>
            <label className="grid gap-1.5">
              <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-text-muted">
                From
              </span>
              <Input type="time" value={from} onChange={(e) => setFrom(e.target.value)} />
            </label>
            <label className="grid gap-1.5">
              <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-text-muted">
                To
              </span>
              <Input type="time" value={to} onChange={(e) => setTo(e.target.value)} />
            </label>
          </>
        )}

        <Button size="sm" onClick={add} disabled={!date || saving} className="mb-0.5">
          Add
        </Button>
      </div>

      {exceptions.length === 0 ? (
        <p className="px-5 py-8 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-text-faint">
          No exceptions — every week follows the pattern above
        </p>
      ) : (
        exceptions.map((exception) => (
          <div
            key={exception.id}
            className="flex flex-wrap items-center gap-3.5 border-b border-line-1 px-5 py-3 last:border-b-0"
          >
            <span className="font-mono text-[13px] text-text">{exception.date}</span>
            <StatusChip tone={exception.isBlocked ? "bad" : "info"}>
              {exception.isBlocked ? "Closed" : "Custom hours"}
            </StatusChip>
            <span className="text-[13px] text-text-muted">
              {exception.isBlocked
                ? "Nothing bookable that day"
                : `${fromMinutes(exception.startMinute)}–${fromMinutes(exception.endMinute)} instead of the pattern`}
            </span>
            <button
              type="button"
              disabled={saving}
              onClick={() => onDelete(exception.date)}
              aria-label={`Remove the exception on ${exception.date}`}
              className="tag-cut ml-auto grid h-[30px] w-[30px] place-items-center border border-line-2 bg-surface-dark text-text-muted hover:border-danger hover:text-danger disabled:opacity-50"
            >
              <Trash2 className="h-[15px] w-[15px]" aria-hidden />
            </button>
          </div>
        ))
      )}
    </HudPanel>
  );
}

function toMinutes(value: string): number {
  const [h, m] = value.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function fromMinutes(value: number | null | undefined): string {
  if (value == null) return "—";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(value / 60))}:${pad(value % 60)}`;
}
