"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/domains/marketplace/components/hud/panelCard";
import type { BookingDetail } from "@/domains/marketplace/types";
import { whenLabel } from "@/domains/marketplace/components/BookingRow";

interface Props {
  booking: BookingDetail;
  onOpened: () => void;
}

/**
 * Where a student says a session did not happen as sold.
 *
 * Only offered while it can actually be acted on — inside the challenge window,
 * on a delivery, to the student. Showing it afterwards would be offering a
 * button that answers "too late", which reads as the platform stalling.
 */
export function DisputePanel({ booking, onOpened }: Props): React.ReactElement | null {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const submit = useMutation({
    mutationFn: () =>
      apiFetch<{ opened: boolean }>(`/api/bookings/${booking.id}/dispute`, {
        method: "POST",
        body: JSON.stringify({ reason: reason.trim() }),
      }),
  });

  if (booking.role !== "student") return null;
  if (booking.status === "DISPUTED") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Being looked at</CardTitle>
          <CardDescription>
            We are reading this against the record of what happened. Nothing settles until it is
            decided.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  if (booking.status !== "DELIVERED") return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-text-faint underline hover:text-text-muted"
      >
        This did not happen as described
      </button>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>What went wrong?</CardTitle>
        <CardDescription>
          {booking.autoCompleteAt
            ? `You can raise this until ${whenLabel(booking.autoCompleteAt)}.`
            : "Tell us what happened."}{" "}
          We settle it against the recorded history of this booking, which you can read below.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        <textarea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Be specific. What was promised, and what actually happened."
          className="flex w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />

        {error && (
          <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <Button
            variant="destructive"
            disabled={submit.isPending || reason.trim().length < 20}
            onClick={() => {
              setError(null);
              submit.mutate(undefined, {
                onSuccess: onOpened,
                onError: (err) =>
                  setError(err instanceof Error ? err.message : "Could not raise that."),
              });
            }}
          >
            Raise it
          </Button>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
