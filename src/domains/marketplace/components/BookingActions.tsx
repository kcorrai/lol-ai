"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { COACH_RESPONSE_HOURS } from "@/domains/marketplace/policy";
import type { BookingDetail } from "@/domains/marketplace/types";
import type { BookingAction } from "@/hooks/useBookings";
import { whenLabel } from "@/domains/marketplace/components/BookingRow";
import { safeHref } from "@/lib/security/url";

interface Props {
  booking: BookingDetail;
  pending: boolean;
  onAct: (body: BookingAction) => void;
}

/**
 * Only the moves this person can actually make, from this status.
 *
 * Offering a button the server is going to refuse is worse than offering
 * nothing — the state machine in `transitions.ts` is the authority, and this
 * mirrors it rather than guessing.
 *
 * It is the loudest thing on the page by design: this is the panel the session
 * exists for, and everything below it is context for the decision made here.
 */
export function BookingActions({ booking, pending, onAct }: Props): React.ReactElement | null {
  const [reason, setReason] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const isCoach = booking.role === "coach";

  if (booking.status === "PENDING_COACH" && isCoach) {
    return (
      <ActionBar
        tone="warn"
        kicker="Needs you"
        title="This is a request"
        body={`Answer by ${whenLabel(booking.respondByAt)}, or it expires on its own after ${COACH_RESPONSE_HOURS} hours and the student gets their money back.`}
      >
        {booking.startTime && (
          <label className="grid gap-1.5">
            <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-text-muted">
              Where you will meet — optional now, required before the session
            </span>
            <Input
              id="meetingUrl"
              placeholder="https://discord.gg/… or a Meet link"
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
            />
          </label>
        )}

        <Reason value={reason} onChange={setReason} label="If you decline, say why" />

        <div className="flex flex-wrap gap-2.5">
          <Button
            disabled={pending}
            onClick={() => onAct({ action: "accept", meetingUrl: meetingUrl.trim() || null })}
          >
            <Check className="h-4 w-4" aria-hidden />
            Accept
          </Button>
          <Button
            variant="destructive"
            disabled={pending || reason.trim().length < 5}
            onClick={() => onAct({ action: "decline", reason: reason.trim() })}
          >
            Decline
          </Button>
        </div>
      </ActionBar>
    );
  }

  if (booking.status === "PENDING_COACH" || booking.status === "CONFIRMED") {
    const confirmed = booking.status === "CONFIRMED";
    return (
      <ActionBar
        tone={confirmed ? "good" : "warn"}
        kicker={confirmed ? "Confirmed" : "Waiting on the coach"}
        title={
          confirmed
            ? isCoach
              ? "Accepted — deliver it when it is done"
              : "You are booked in"
            : "Sent, not answered yet"
        }
        body={
          confirmed
            ? "Money is held, not paid out. It moves when the session settles."
            : `The coach has until ${whenLabel(booking.respondByAt)}. Nothing has been charged.`
        }
      >
        {/* Read through `safeHref` because the coach typed it. Rows written before the
            schema rejected non-http schemes were never checked, so a stored
            `javascript:` link would still run in the student's browser on a click. */}
        {safeHref(booking.meetingUrl) && (
          <p className="break-all text-sm text-text-body">
            Meet here:{" "}
            <a
              href={safeHref(booking.meetingUrl) ?? undefined}
              className="text-accent underline"
              rel="noreferrer noopener"
              target="_blank"
            >
              {booking.meetingUrl}
            </a>
          </p>
        )}

        <Reason value={reason} onChange={setReason} label="Reason for cancelling" />

        <div className="flex flex-wrap gap-2.5">
          {isCoach && confirmed && (
            <Button disabled={pending} onClick={() => onAct({ action: "deliver" })}>
              Mark delivered
            </Button>
          )}
          <Button
            variant="ghost"
            disabled={pending || reason.trim().length < 5}
            onClick={() => onAct({ action: "cancel", reason: reason.trim() })}
          >
            Cancel this session
          </Button>
        </div>
      </ActionBar>
    );
  }

  if (booking.status === "DELIVERED") {
    return (
      <ActionBar
        tone={isCoach ? "good" : "warn"}
        kicker={isCoach ? "Delivered" : "Needs you"}
        title={isCoach ? "The student can read it now" : "Confirm the work landed"}
        body={
          booking.autoCompleteAt
            ? isCoach
              ? `It settles on its own at ${whenLabel(booking.autoCompleteAt)} unless it is challenged.`
              : `Confirming releases the money now; doing nothing settles it at ${whenLabel(booking.autoCompleteAt)} anyway.`
            : "Waiting on the student."
        }
      >
        {!isCoach && (
          <div className="flex flex-wrap gap-2.5">
            <Button disabled={pending} onClick={() => onAct({ action: "confirm" })}>
              <Check className="h-4 w-4" aria-hidden />
              Confirm it happened
            </Button>
          </div>
        )}
      </ActionBar>
    );
  }

  return null;
}

const TONE = {
  warn: {
    shell: "border-warning shadow-[0_0_24px_rgba(255,194,75,0.08)]",
    kicker: "text-warning",
  },
  good: { shell: "border-accent shadow-[0_0_24px_rgba(198,255,61,0.08)]", kicker: "text-accent" },
};

function ActionBar({
  tone,
  kicker,
  title,
  body,
  children,
}: {
  tone: keyof typeof TONE;
  kicker: string;
  title: string;
  body: string;
  children?: React.ReactNode;
}): React.ReactElement {
  return (
    <section className={cn("notch border bg-surface p-5", TONE[tone].shell)}>
      <p
        className={cn(
          "font-mono text-[10px] uppercase tracking-[0.18em]",
          TONE[tone].kicker
        )}
      >
        {`// ${kicker}`}
      </p>
      <h2 className="mt-2.5 font-display text-[18px] font-extrabold uppercase tracking-[0.03em] text-text">
        {title}
      </h2>
      <p className="mt-2 max-w-[58ch] text-[13.5px] text-text-body">{body}</p>
      {children && <div className="mt-4 grid gap-3">{children}</div>}
    </section>
  );
}

function Reason({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-text-muted">
        {label}
      </span>
      <textarea
        rows={2}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="well w-full resize-y border border-line-2 bg-background px-3 py-2.5 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </label>
  );
}
