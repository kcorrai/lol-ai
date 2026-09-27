"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { isScheduled } from "@/domains/marketplace/policy";
import type { Listing } from "@/domains/marketplace/types";
import { useCoachSlots, useCreateBooking } from "@/hooks/useBookings";
import { useBookingDraft } from "@/hooks/useBookingDraft";
import { recallGoal } from "@/lib/coachMatch/carriedGoal";
import { SlotPicker } from "@/domains/marketplace/components/SlotPicker";
import { MatchPicker } from "@/domains/marketplace/components/booking/MatchPicker";
import { BookingSummary } from "@/domains/marketplace/components/booking/BookingSummary";
import { SubmitButtons } from "@/domains/marketplace/components/booking/SubmitButtons";
import { BookingStep as Step } from "@/domains/marketplace/components/booking/BookingStep";

const MIN_GOAL = 10;

interface Props {
  coach: { slug: string; displayName: string; timezone: string };
  listing: Listing;
  /** Prefills, from "book again" (`start`) or the match quiz and AI report (`goal`). */
  initialStart: string | null;
  initialGoal: string;
}

/**
 * Asking a coach for a session, on a page of its own.
 *
 * It used to be a form that unfolded inside the listing card and turned
 * signed-out visitors away before they had typed a word. Now anyone can fill
 * the whole request; an account is asked for only at the button, and the
 * draft survives the trip through the login page.
 */
export function BookingRequest({
  coach,
  listing,
  initialStart,
  initialGoal,
}: Props): React.ReactElement {
  const router = useRouter();
  const { status } = useSession();
  const signedIn = status === "authenticated";
  const scheduled = isScheduled(listing.kind);
  const here = `/coaches/${coach.slug}/book/${listing.id}`;

  // A goal said earlier — in the match quiz or from an AI report — starts the
  // box when neither the URL nor a saved draft has one.
  const { draft, update, persist, clear } = useBookingDraft(
    listing.id,
    { start: initialStart, goal: initialGoal },
    recallGoal
  );
  const slots = useCoachSlots(coach.slug, scheduled ? listing.id : null);
  const create = useCreateBooking();
  const [error, setError] = useState<string | null>(null);

  // A prefilled or restored time is only a suggestion: once the coach's free
  // slots are known, one that is no longer among them is dropped rather than
  // sent to be refused.
  const freeSlots = slots.data?.slots;
  useEffect(() => {
    if (!freeSlots || !draft.start) return;
    const wanted = Date.parse(draft.start);
    if (!freeSlots.some((slot) => Date.parse(slot.start) === wanted)) update({ start: null });
  }, [freeSlots, draft.start, update]);

  const slotOk = !scheduled || Boolean(draft.start);
  const sourceOk = scheduled || draft.matchIds.length > 0 || Boolean(draft.vodUrl.trim());
  const goalOk = draft.goal.trim().length >= MIN_GOAL;
  const ready = slotOk && sourceOk && goalOk;

  const hint = !slotOk
    ? "Pick a time first"
    : !sourceOk
      ? "Pick a game or add a video link"
      : !goalOk
        ? "Say what you want out of it"
        : null;

  function signInFirst(path: "/login" | "/register"): void {
    persist();
    router.push(`${path}?callbackUrl=${encodeURIComponent(here)}`);
  }

  async function submit(): Promise<void> {
    setError(null);
    try {
      const { bookingId } = await create.mutateAsync({
        listingId: listing.id,
        startTime: scheduled ? draft.start : null,
        studentGoal: draft.goal.trim(),
        // The browser's zone, so a reschedule message can name the hour the
        // student actually saw.
        studentTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        riotAccountId: draft.riotAccountId,
        matchIds: draft.matchIds,
        vodUrl: draft.vodUrl.trim() || null,
      });
      clear();
      router.push(`/sessions/${bookingId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send that request.");
    }
  }

  return (
    <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="grid min-w-0 gap-7">
        {scheduled && (
          <Step n={1} title="Pick a time" note="Shown in your own clock">
            <SlotPicker
              slots={slots.data?.slots ?? []}
              loading={slots.isLoading}
              selected={draft.start}
              onSelect={(start) => update({ start })}
            />
          </Step>
        )}

        <Step
          n={scheduled ? 2 : 1}
          title={scheduled ? "Share your games" : "What should they review?"}
          note={scheduled ? "The coach reads them before you meet" : undefined}
        >
          {signedIn ? (
            <MatchPicker
              accountId={draft.riotAccountId}
              onAccount={(riotAccountId) => update({ riotAccountId })}
              picked={draft.matchIds}
              onPicked={(matchIds) => update({ matchIds })}
              required={!scheduled}
            />
          ) : (
            <p className="text-[13.5px] text-text-body">
              Sign in at the end and your recent games show up here to pick from.
            </p>
          )}
          {!scheduled && (
            <label className="mt-4 grid gap-1.5 text-[12.5px] text-text-muted">
              Or a video link
              <Input
                placeholder="https://youtube.com/watch?v=…"
                value={draft.vodUrl}
                onChange={(e) => update({ vodUrl: e.target.value })}
              />
            </label>
          )}
        </Step>

        <Step n={scheduled ? 3 : 2} title="What do you want out of it?">
          <textarea
            rows={4}
            value={draft.goal}
            onChange={(e) => update({ goal: e.target.value })}
            aria-label="Your goal for this session"
            placeholder="Be specific — “I lose lane as Ahri into assassins”, “I don't know where to be after first dragon”."
            className="well w-full resize-y border border-line-2 bg-background px-3 py-2.5 text-[14px] leading-relaxed text-text placeholder:text-text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <p className="mt-1.5 text-[12px] text-text-muted">
            {goalOk ? "Good — the coach knows what to prepare." : "One or two sentences is enough."}
          </p>
        </Step>
      </div>

      <div className="grid gap-3.5 lg:sticky lg:top-20">
        <BookingSummary
          coachName={coach.displayName}
          coachTimezone={coach.timezone}
          listing={listing}
          start={scheduled ? draft.start : null}
        />

        {error && (
          <p className="border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        <SubmitButtons
          signedIn={signedIn}
          ready={ready}
          pending={create.isPending}
          onSubmit={() => void submit()}
          onSignIn={signInFirst}
        />
        {hint && <p className="text-center text-[12px] text-text-muted">{hint}</p>}
        <Link
          href={`/coaches/${coach.slug}`}
          className="text-center text-[12.5px] text-text-muted hover:text-text"
        >
          Back to {coach.displayName}
        </Link>
      </div>
    </div>
  );
}
