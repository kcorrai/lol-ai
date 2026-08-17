"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AvailabilityView, ExceptionInput } from "@/domains/marketplace";

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
 * for once" without a second concept.
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
    <div className="space-y-4">
      <div className="space-y-3 rounded-lg border border-border bg-surface p-3">
        <div className="flex flex-wrap items-end gap-2">
          <label className="space-y-1 text-xs text-text-muted">
            Date
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>

          <label className="flex items-center gap-2 pb-2 text-xs text-text-muted">
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
              <label className="space-y-1 text-xs text-text-muted">
                From
                <Input type="time" value={from} onChange={(e) => setFrom(e.target.value)} />
              </label>
              <label className="space-y-1 text-xs text-text-muted">
                To
                <Input type="time" value={to} onChange={(e) => setTo(e.target.value)} />
              </label>
            </>
          )}

          <Button size="sm" onClick={add} disabled={!date || saving}>
            Add
          </Button>
        </div>
      </div>

      {exceptions.length === 0 ? (
        <p className="text-xs text-text-faint">No exceptions. Every week runs on your hours above.</p>
      ) : (
        <ul className="space-y-2">
          {exceptions.map((exception) => (
            <li
              key={exception.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-surface-2 px-3 py-2"
            >
              <span className="flex items-center gap-2 text-sm text-text">
                <span className="font-mono">{exception.date}</span>
                {exception.isBlocked ? (
                  <Badge variant="destructive">Closed</Badge>
                ) : (
                  <Badge variant="secondary">
                    {fromMinutes(exception.startMinute)}–{fromMinutes(exception.endMinute)}
                  </Badge>
                )}
              </span>

              <Button
                size="sm"
                variant="ghost"
                disabled={saving}
                onClick={() => onDelete(exception.date)}
                aria-label={`Remove the exception on ${exception.date}`}
              >
                <Trash2 className="h-3 w-3" aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
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
