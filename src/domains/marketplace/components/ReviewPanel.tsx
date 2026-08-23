"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/domains/marketplace/components/hud/panelCard";
import type { BookingDetail } from "@/domains/marketplace/types";

interface Props {
  booking: BookingDetail;
  onDone: () => void;
}

/**
 * Where either side reviews the other.
 *
 * The blind is explained rather than hidden, because it is the reason to be
 * honest: neither review appears until both are in. A student who does not know
 * that has no reason to believe their coach will not retaliate, which is exactly
 * the dynamic that leaves every competing platform sitting at 4.9.
 */
export function ReviewPanel({ booking, onDone }: Props): React.ReactElement | null {
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = useMutation({
    mutationFn: () =>
      apiFetch<{ revealed: boolean }>(`/api/bookings/${booking.id}/review-session`, {
        method: "POST",
        body: JSON.stringify({ rating, body: body.trim() || null }),
      }),
  });

  if (booking.status !== "COMPLETED") return null;

  if (done) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Thanks</CardTitle>
          <CardDescription>
            Your review is in. It appears once the other side has written theirs, or after two weeks
            — whichever comes first.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {booking.role === "student" ? "Review your coach" : "Review your student"}
        </CardTitle>
        <CardDescription>
          Neither review is shown until you have both written one, or two weeks pass. Say what
          actually happened.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex gap-1" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={rating === value}
              aria-label={`${value} ${value === 1 ? "star" : "stars"}`}
              onClick={() => setRating(value)}
              className="p-1"
            >
              <Star
                className={cn(
                  "h-6 w-6",
                  value <= rating ? "fill-accent text-accent" : "text-text-faint"
                )}
              />
            </button>
          ))}
        </div>

        <textarea
          rows={3}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What was useful, and what was not."
          className="flex w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />

        {error && (
          <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        <Button
          disabled={rating === 0 || submit.isPending}
          onClick={() => {
            setError(null);
            submit.mutate(undefined, {
              onSuccess: () => {
                setDone(true);
                onDone();
              },
              onError: (err) =>
                setError(err instanceof Error ? err.message : "Could not save that review."),
            });
          }}
        >
          {submit.isPending ? "Sending…" : "Leave review"}
        </Button>
      </CardContent>
    </Card>
  );
}
