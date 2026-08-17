"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DisputeRow } from "@/domains/marketplace";
import { whenLabel } from "@/domains/marketplace/components/BookingRow";

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
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>{dispute.listingTitle}</CardTitle>
            <p className="mt-1 text-sm text-text-muted">
              {dispute.studentName} vs {dispute.coachDisplayName}
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-sm text-text">
              {new Intl.NumberFormat(undefined, {
                style: "currency",
                currency: dispute.currency,
              }).format(dispute.amountCents / 100)}
            </p>
            <p className="font-mono text-[11px] text-text-faint">
              raised {whenLabel(dispute.openedAt)}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            What the student says
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-text-body">{dispute.reason}</p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            What is recorded
          </p>
          <ol className="mt-1 space-y-1">
            {dispute.history.map((event, index) => (
              <li key={index} className="text-xs text-text-body">
                <span className="font-mono text-text-faint">{whenLabel(event.createdAt)}</span>{" "}
                <span className="text-text">{event.toStatus}</span>
                {event.actorName ? ` — ${event.actorName}` : " — automatically"}
                {event.reason && <span className="text-text-muted">: {event.reason}</span>}
              </li>
            ))}
          </ol>
        </div>

        {open ? (
          <>
            <div className="space-y-1">
              <label className="text-sm text-text-muted">
                Your reasoning (sent to both sides)
              </label>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="flex w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {error && <p className="text-xs text-danger">{error}</p>}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="destructive" disabled={pending} onClick={() => decide("refund")}>
                Refund the student
              </Button>
              <Button variant="secondary" disabled={pending} onClick={() => decide("release")}>
                Release to the coach
              </Button>
            </div>
          </>
        ) : (
          <Badge variant="outline">
            {dispute.status === "RESOLVED_REFUND" ? "Refunded" : "Released"}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
