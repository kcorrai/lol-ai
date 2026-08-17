"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isScheduled } from "@/domains/marketplace/policy";
import type { Listing } from "@/domains/marketplace/types";
import { useCoachSlots, useCreateBooking } from "@/hooks/useBookings";
import { SlotPicker } from "@/domains/marketplace/components/SlotPicker";

interface Props {
  coachSlug: string;
  listing: Listing;
  onCancel: () => void;
}

/**
 * Asking a coach for a session.
 *
 * Nothing is charged here and nothing is promised: this creates a *request*,
 * which the coach has 48 hours to accept or decline. Saying so on the button is
 * the difference between a student who waits and a student who thinks they have
 * been ignored.
 */
export function BookingForm({ coachSlug, listing, onCancel }: Props): React.ReactElement {
  const router = useRouter();
  const { status } = useSession();
  const scheduled = isScheduled(listing.kind);

  const { data: slotData, isLoading: slotsLoading } = useCoachSlots(
    coachSlug,
    scheduled ? listing.id : null
  );
  const create = useCreateBooking();

  const [start, setStart] = useState<string | null>(null);
  const [goal, setGoal] = useState("");
  const [matchIds, setMatchIds] = useState("");
  const [vodUrl, setVodUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (status !== "authenticated") {
    return (
      <div className="rounded-lg border border-border bg-surface-2 p-4 text-sm text-text-muted">
        <Link href={`/login?callbackUrl=/coaches/${coachSlug}`} className="text-accent underline">
          Log in
        </Link>{" "}
        to book this session.
      </div>
    );
  }

  async function submit(): Promise<void> {
    setError(null);

    if (goal.trim().length < 10) {
      setError("Tell the coach what you want out of this, in a sentence or two.");
      return;
    }
    if (scheduled && !start) {
      setError("Pick a time.");
      return;
    }

    const ids = matchIds
      .split(/[\s,]+/)
      .map((id) => id.trim())
      .filter(Boolean)
      .slice(0, 5);

    if (!scheduled && ids.length === 0 && !vodUrl.trim()) {
      setError("Add a match id or a video link for the coach to review.");
      return;
    }

    try {
      const { bookingId } = await create.mutateAsync({
        listingId: listing.id,
        startTime: start,
        studentGoal: goal.trim(),
        // The browser's zone, so a reschedule email can name the hour the
        // student actually saw.
        studentTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        matchIds: ids,
        vodUrl: vodUrl.trim() || null,
      });
      router.push(`/sessions/${bookingId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send that request.");
    }
  }

  return (
    <div className="space-y-4 rounded-lg border border-accent/40 bg-surface p-4">
      <p className="text-sm font-semibold text-text">{listing.title}</p>

      {scheduled && (
        <SlotPicker
          slots={slotData?.slots ?? []}
          loading={slotsLoading}
          selected={start}
          onSelect={setStart}
        />
      )}

      {!scheduled && (
        <div className="space-y-3">
          <div className="space-y-1">
            <label htmlFor="matchIds" className="text-sm text-text-muted">
              Match ids to review
            </label>
            <Input
              id="matchIds"
              placeholder="TR1_1234567890"
              value={matchIds}
              onChange={(e) => setMatchIds(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="vodUrl" className="text-sm text-text-muted">
              …or a video link
            </label>
            <Input
              id="vodUrl"
              placeholder="https://youtube.com/watch?v=…"
              value={vodUrl}
              onChange={(e) => setVodUrl(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor="goal" className="text-sm text-text-muted">
          What do you want out of this?
        </label>
        <textarea
          id="goal"
          rows={3}
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="Be specific. The more the coach knows going in, the less of the session goes on finding out."
          className="flex w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {error && (
        <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => void submit()} disabled={create.isPending}>
          {create.isPending ? "Sending…" : "Send request"}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <p className="text-xs text-text-faint">
          Nothing is charged yet — the coach has 48 hours to accept.
        </p>
      </div>
    </div>
  );
}
