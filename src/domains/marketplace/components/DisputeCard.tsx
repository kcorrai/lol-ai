"use client";

import { useState } from "react";
import { Gavel } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/domains/marketplace/money";
import type { DisputeRow } from "@/domains/marketplace";
import { whenLabel } from "@/domains/marketplace/components/BookingRow";
import { StatusChip } from "@/domains/marketplace/components/hud/StatusChip";

interface Props {
  dispute: DisputeRow;
  pending: boolean;
  onResolve: (outcome: "refund" | "release", note: string) => void;
}

const MIN_NOTE = 20;

/**
 * One dispute, with the record it is decided against.
 *
 * The history is on the card rather than a click away on purpose. The whole
 * argument for building `booking_events` first was that a refusal nobody can
 * reconstruct is what fills every competitor's reviews — so the person deciding
 * reads the same sequence both sides can.
 */
export function DisputeCard({ dispute, pending, onResolve }: Props): React.ReactElement {
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const open = dispute.status === "OPEN";

  function decide(outcome: "refund" | "release"): void {
    if (note.trim().length < MIN_NOTE) {
      setError(`Write at least ${MIN_NOTE} characters — this is what the losing side is told.`);
      return;
    }
    setError(null);
    onResolve(outcome, note.trim());
  }

  return (
    <section
      className={cn(
        "notch overflow-hidden border bg-surface",
        open ? "border-danger shadow-[0_0_26px_rgba(255,90,90,0.09)]" : "border-line-2 opacity-90"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line-1 p-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <StatusChip
              tone={open ? "warn" : dispute.status === "RESOLVED_REFUND" ? "bad" : "good"}
            >
              {open ? "Open" : dispute.status === "RESOLVED_REFUND" ? "Refunded" : "Released"}
            </StatusChip>
            <h3 className="font-display text-[18px] font-extrabold uppercase tracking-[0.03em] text-text">
              {dispute.listingTitle}
            </h3>
          </div>
          <p className="mt-2 text-[13.5px] text-text-muted">
            {dispute.studentName} vs {dispute.coachDisplayName}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="font-mono text-xl font-bold text-text">
            {formatMoney(dispute.amountCents, dispute.currency, true)}
          </p>
          <p className="mt-1.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-danger">
            {open ? "frozen" : "settled"} &middot; raised {whenLabel(dispute.openedAt)}
          </p>
        </div>
      </div>

      <div className="border-b border-line-1 p-5">
        <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-danger">
          {"// What the student says"}
        </p>
        <p className="mt-3 max-w-[70ch] whitespace-pre-wrap text-sm text-text-body">
          {dispute.reason}
        </p>
      </div>

      <div className="border-b border-line-1 p-5">
        <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-text-muted">
          {"// What is recorded"}
        </p>
        <ol className="mt-3">
          {dispute.history.map((event, index) => (
            <li
              key={index}
              className={cn(
                "grid items-baseline gap-3 py-2 sm:grid-cols-[150px_110px_1fr]",
                index > 0 && "border-t border-line-1"
              )}
            >
              <span className="whitespace-nowrap font-mono text-[10px] tracking-[0.06em] text-text-faint">
                {whenLabel(event.createdAt)}
              </span>
              <span
                className={cn(
                  "whitespace-nowrap font-mono text-[10.5px] font-bold uppercase tracking-[0.12em]",
                  event.toStatus === "DISPUTED"
                    ? "text-danger"
                    : event.toStatus === "CONFIRMED" || event.toStatus === "DELIVERED"
                      ? "text-accent"
                      : "text-text"
                )}
              >
                {event.toStatus}
              </span>
              <span className="text-[12.5px] text-text-muted">
                {event.actorName ?? "Automatically"}
                {event.reason && ` — ${event.reason}`}
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.12em] text-text-faint">
          Both sides have been able to read this the whole time
        </p>
      </div>

      <div className="p-5">
        {open ? (
          <>
            <label className="grid gap-2">
              <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-text-muted">
                Your reasoning &middot; sent to both sides
              </span>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Which part of the record decided this."
                className="well w-full resize-y border border-line-2 bg-background px-3 py-2.5 text-sm text-text placeholder:text-text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {error && <p className="text-xs text-danger">{error}</p>}
            </label>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button
                size="sm"
                variant="destructive"
                disabled={pending}
                onClick={() => decide("refund")}
              >
                Refund the student
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={pending}
                onClick={() => decide("release")}
              >
                Release to the coach
              </Button>
              <span
                className={cn(
                  "ml-auto font-mono text-[9.5px] uppercase tracking-[0.14em]",
                  note.trim().length >= MIN_NOTE ? "text-accent" : "text-text-faint"
                )}
              >
                {note.trim().length >= MIN_NOTE
                  ? "Ready · sent to both sides"
                  : "Both sides get this in writing"}
              </span>
            </div>
          </>
        ) : (
          <p
            className={cn(
              "flex items-center gap-2.5 border-l-2 px-4 py-3 text-[13.5px] text-text",
              dispute.status === "RESOLVED_REFUND"
                ? "border-danger bg-danger/10"
                : "border-accent bg-accent/10"
            )}
          >
            <Gavel
              className={cn(
                "h-4 w-4 shrink-0",
                dispute.status === "RESOLVED_REFUND" ? "text-danger" : "text-accent"
              )}
              aria-hidden
            />
            {dispute.status === "RESOLVED_REFUND"
              ? "Refunded to the student."
              : "Released to the coach."}
          </p>
        )}
      </div>
    </section>
  );
}
