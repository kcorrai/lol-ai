"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HudPanel } from "@/domains/marketplace/components/hud/HudPanel";
import { formatMoney } from "@/domains/marketplace/money";
import { splitPrice } from "@/domains/marketplace/policy";
import { useBookingAction } from "@/hooks/useBookings";
import { whenLabel } from "@/domains/marketplace/components/BookingRow";
import type { BookingSummary } from "@/domains/marketplace/types";

interface Props {
  request: BookingSummary;
  /** What the student wrote when they asked. Empty is allowed. */
  goal: string;
  commissionBps: number;
}

/**
 * The oldest unanswered request, at the top of the console and impossible to miss.
 *
 * A marketplace dies of coaches who never answer — the complaint that killed
 * every competitor in this category — so the one thing waiting on a coach is
 * the fold, and it can be answered without opening anything else.
 */
export function UrgentRequestPanel({ request, goal, commissionBps }: Props): React.ReactElement {
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");
  const [done, setDone] = useState<"accepted" | "declined" | null>(null);
  const action = useBookingAction();

  const keep = splitPrice(request.priceCents, commissionBps).coachEarningsCents;

  return (
    <HudPanel
      tone="warn"
      label="Waiting on you"
      padded={false}
      action={
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
          Expires {whenLabel(request.respondByAt)}
        </span>
      }
    >
      <div className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <Link
              href={`/sessions/${request.id}`}
              className="font-display text-[19px] font-extrabold uppercase tracking-[0.03em] text-text hover:text-accent"
            >
              {request.listingTitle}
            </Link>
            <p className="mt-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-text-muted">
              {request.studentName} &middot;{" "}
              {request.startTime ? whenLabel(request.startTime) : "no fixed time"} &middot;{" "}
              {formatMoney(request.priceCents, request.currency)} &middot; you keep{" "}
              {formatMoney(keep, request.currency)}
            </p>
            {goal && (
              <p className="mt-3.5 max-w-[62ch] text-[14.5px] text-text-body">
                &ldquo;{goal}&rdquo;
              </p>
            )}
          </div>

          {!done && (
            <div className="grid shrink-0 gap-2">
              <Button
                size="sm"
                disabled={action.isPending}
                onClick={() =>
                  action.mutate(
                    { bookingId: request.id, action: "accept" },
                    { onSuccess: () => setDone("accepted") }
                  )
                }
              >
                <Check className="h-4 w-4" aria-hidden />
                Accept
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setDeclining(!declining)}>
                <X className="h-4 w-4" aria-hidden />
                Decline
              </Button>
            </div>
          )}
        </div>

        {declining && !done && (
          <div className="mt-4 grid gap-2">
            <label htmlFor="declineReason" className="text-[13px] text-text-muted">
              A student is owed the reason — say why.
            </label>
            <textarea
              id="declineReason"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border border-border bg-surface px-3 py-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button
              size="sm"
              variant="destructive"
              className="justify-self-start"
              disabled={action.isPending || reason.trim().length < 5}
              onClick={() =>
                action.mutate(
                  { bookingId: request.id, action: "decline", reason: reason.trim() },
                  { onSuccess: () => setDone("declined") }
                )
              }
            >
              Send the decline
            </Button>
          </div>
        )}

        {done && (
          <p className="mt-4 flex items-center gap-2.5 border-l-2 border-accent bg-accent/10 px-4 py-3 text-[13.5px] text-text">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" aria-hidden />
            {done === "accepted"
              ? request.startTime
                ? "Accepted. Add a meeting room before the session, or your student will be waiting in the wrong place."
                : "Accepted. Deliver it from the session page when it is ready."
              : "Declined, and the student has been told why."}
          </p>
        )}

        {action.isError && !done && (
          <p className="mt-3 text-[13px] text-danger">
            {action.error instanceof Error ? action.error.message : "That did not go through."}
          </p>
        )}
      </div>
    </HudPanel>
  );
}
