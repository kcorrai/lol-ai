"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { BookingDetail } from "@/domains/marketplace/types";
import type { BookingAction } from "@/hooks/useBookings";
import { whenLabel } from "@/domains/marketplace/components/BookingRow";

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
 */
export function BookingActions({ booking, pending, onAct }: Props): React.ReactElement | null {
  const [reason, setReason] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const isCoach = booking.role === "coach";

  if (booking.status === "PENDING_COACH" && isCoach) {
    return (
      <Panel title="This is a request">
        <p className="text-xs text-text-muted">
          Answer by {whenLabel(booking.respondByAt)}, or it expires on its own.
        </p>

        {booking.startTime && (
          <div className="space-y-1">
            <label htmlFor="meetingUrl" className="text-sm text-text-muted">
              Where you will meet (optional now, required before the session)
            </label>
            <Input
              id="meetingUrl"
              placeholder="https://discord.gg/… or a Meet link"
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
            />
          </div>
        )}

        <Reason value={reason} onChange={setReason} label="If you decline, say why" />

        <div className="flex flex-wrap gap-2">
          <Button
            disabled={pending}
            onClick={() => onAct({ action: "accept", meetingUrl: meetingUrl.trim() || null })}
          >
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
      </Panel>
    );
  }

  if (booking.status === "PENDING_COACH" || booking.status === "CONFIRMED") {
    return (
      <Panel title={booking.status === "CONFIRMED" ? "Confirmed" : "Waiting on the coach"}>
        {booking.meetingUrl && (
          <p className="break-all text-sm text-text-body">
            Meet here:{" "}
            <a href={booking.meetingUrl} className="text-accent underline" rel="noreferrer noopener" target="_blank">
              {booking.meetingUrl}
            </a>
          </p>
        )}

        <Reason value={reason} onChange={setReason} label="Reason for cancelling" />

        <div className="flex flex-wrap gap-2">
          {isCoach && booking.status === "CONFIRMED" && (
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
      </Panel>
    );
  }

  if (booking.status === "DELIVERED") {
    return (
      <Panel title="Delivered">
        <p className="text-xs text-text-muted">
          {booking.autoCompleteAt
            ? `This settles on its own at ${whenLabel(booking.autoCompleteAt)} unless it is challenged.`
            : "Waiting on the student."}
        </p>

        {!isCoach && (
          <Button disabled={pending} onClick={() => onAct({ action: "confirm" })}>
            Confirm it happened
          </Button>
        )}
      </Panel>
    );
  }

  return null;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-lg border border-border bg-surface p-4">
      <p className="font-semibold text-text">{title}</p>
      {children}
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
    <div className="space-y-1">
      <label className="text-sm text-text-muted">{label}</label>
      <textarea
        rows={2}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
  );
}
