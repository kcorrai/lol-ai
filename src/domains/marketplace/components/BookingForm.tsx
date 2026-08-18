"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isScheduled, COACH_RESPONSE_HOURS } from "@/domains/marketplace/policy";
import type { Listing } from "@/domains/marketplace/types";
import { useCoachSlots, useCreateBooking } from "@/hooks/useBookings";
import { SlotPicker } from "@/domains/marketplace/components/SlotPicker";
import { BookingSteps } from "@/domains/marketplace/components/BookingSteps";

interface Props {
  coachSlug: string;
  listing: Listing;
  onCancel: () => void;
}

const MIN_GOAL = 10;

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
      <div className="notch border border-line-2 bg-surface-dark p-4 text-sm text-text-muted">
        <Link href={`/login?callbackUrl=/coaches/${coachSlug}`} className="text-accent underline">
          Log in
        </Link>{" "}
        to book this session.
      </div>
    );
  }

  const goalOk = goal.trim().length >= MIN_GOAL;
  const slotOk = !scheduled || Boolean(start);
  const sourceOk = scheduled || Boolean(matchIds.trim() || vodUrl.trim());

  const hint = !slotOk
    ? "Pick a slot first"
    : !sourceOk
      ? "Add a match id or a video link"
      : !goalOk
        ? "Say what you want out of it"
        : `Nothing is charged yet · ${COACH_RESPONSE_HOURS}h to accept`;

  async function submit(): Promise<void> {
    setError(null);

    const ids = matchIds
      .split(/[\s,]+/)
      .map((id) => id.trim())
      .filter(Boolean)
      .slice(0, 5);

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
    <div className="notch border border-accent/40 bg-surface-dark p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">
          {`// Request · ${listing.title}`}
        </span>
        <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-text-faint">
          Times in your own clock &middot; {Intl.DateTimeFormat().resolvedOptions().timeZone}
        </span>
      </div>

      {scheduled && (
        <div className="mb-4">
          <SlotPicker
            slots={slotData?.slots ?? []}
            loading={slotsLoading}
            selected={start}
            onSelect={setStart}
          />
        </div>
      )}

      {!scheduled && (
        <div className="mb-4 grid gap-3.5">
          <div className="grid gap-1.5">
            <label
              htmlFor="matchIds"
              className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-text-muted"
            >
              Match ids to review
            </label>
            <Input
              id="matchIds"
              placeholder="TR1_1234567890"
              value={matchIds}
              onChange={(e) => setMatchIds(e.target.value)}
            />
            <p className="text-[12px] text-text-faint">
              From your match history, or paste a video link below.
            </p>
          </div>

          <div className="grid gap-1.5">
            <label
              htmlFor="vodUrl"
              className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-text-muted"
            >
              &hellip;or a video link
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

      <div className="grid gap-2">
        <label
          htmlFor="goal"
          className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-text-muted"
        >
          What do you want out of this?
        </label>
        <textarea
          id="goal"
          rows={3}
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="Be specific. The more the coach knows going in, the less of the session goes on finding out."
          className="well w-full resize-y border border-line-2 bg-background px-3 py-2.5 text-sm leading-relaxed text-text placeholder:text-text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <div className="flex items-center justify-between gap-3">
          <span
            className={cn(
              "font-mono text-[9px] uppercase tracking-[0.14em]",
              goalOk ? "text-accent" : "text-text-faint"
            )}
          >
            {goalOk ? "Good — the coach knows what to prepare" : "One or two sentences is enough"}
          </span>
          <span className="font-mono text-[9px] tracking-[0.14em] text-text-faint">
            {goal.trim().length} chars
          </span>
        </div>
      </div>

      <BookingSteps className="mt-4 border-l-2 border-accent bg-surface px-4 py-3" />

      {error && (
        <p className="mt-3 border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3.5">
        <Button
          onClick={() => void submit()}
          disabled={create.isPending || !goalOk || !slotOk || !sourceOk}
        >
          {create.isPending ? "Sending…" : "Send request"}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <span className="ml-auto font-mono text-[9.5px] uppercase tracking-[0.14em] text-text-faint">
          {hint}
        </span>
      </div>
    </div>
  );
}
