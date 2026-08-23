"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/domains/marketplace/components/hud/panelCard";
import type { BookingDetail } from "@/domains/marketplace/types";
import type { BookingAction } from "@/hooks/useBookings";
import { whenLabel } from "@/domains/marketplace/components/BookingRow";
import { safeHref } from "@/lib/security/url";

interface Props {
  booking: BookingDetail;
  pending: boolean;
  onAct: (body: BookingAction) => void;
}

/** How early the join link appears, and how long after the start it stays. */
const OPENS_MINUTES_BEFORE = 15;
const CLOSES_MINUTES_AFTER = 90;

/**
 * Where a live session actually happens.
 *
 * We host no video (ADR-021): the coach supplies a room and this is the place
 * both people find it. The link only becomes a button around the session's own
 * time — a join button that works three days early is one people press three
 * days early.
 *
 * A confirmed session with no link is called out to the coach in as many words,
 * because the failure mode it leads to is a student sitting waiting at the
 * right time in the wrong place, which is indistinguishable from a no-show.
 */
export function LiveSessionPanel({ booking, pending, onAct }: Props): React.ReactElement | null {
  const [url, setUrl] = useState(booking.meetingUrl ?? "");
  const isCoach = booking.role === "coach";

  if (booking.status !== "CONFIRMED" && booking.status !== "PENDING_COACH") return null;
  if (!booking.startTime) return null;

  const start = new Date(booking.startTime).getTime();
  const now = Date.now();
  const open =
    now >= start - OPENS_MINUTES_BEFORE * 60_000 && now <= start + CLOSES_MINUTES_AFTER * 60_000;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Where it happens</CardTitle>
        <CardDescription>
          {booking.status === "CONFIRMED"
            ? `Starts ${whenLabel(booking.startTime)}, in your own timezone.`
            : "Not confirmed yet."}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* The link is the coach's free text. `safeHref` is what stops a stored
            `javascript:` URL from running when the student joins the session. */}
        {safeHref(booking.meetingUrl) ? (
          open ? (
            <Button asChild>
              <a
                href={safeHref(booking.meetingUrl) ?? undefined}
                target="_blank"
                rel="noreferrer noopener"
              >
                Join the session
              </a>
            </Button>
          ) : (
            <p className="break-all text-sm text-text-body">
              <a
                href={safeHref(booking.meetingUrl) ?? undefined}
                className="text-accent underline"
                target="_blank"
                rel="noreferrer noopener"
              >
                {booking.meetingUrl}
              </a>
              <span className="ml-2 text-xs text-text-faint">
                opens {OPENS_MINUTES_BEFORE} minutes before
              </span>
            </p>
          )
        ) : (
          <p
            className={
              isCoach
                ? "rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning"
                : "text-sm text-text-muted"
            }
          >
            {isCoach
              ? "No room set yet. Add one before the session, or your student will be waiting in the wrong place."
              : "The coach has not shared a room yet."}
          </p>
        )}

        {isCoach && (
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex-1 space-y-1 text-xs text-text-muted">
              Meeting link
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://discord.gg/… or a Meet link"
              />
            </label>
            <Button
              size="sm"
              variant="secondary"
              disabled={pending}
              onClick={() => onAct({ action: "meeting", meetingUrl: url.trim() || null })}
            >
              {booking.meetingUrl ? "Change" : "Set"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
