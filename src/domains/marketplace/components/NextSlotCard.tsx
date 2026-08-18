"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCoachSlots } from "@/hooks/useBookings";

interface Props {
  coachSlug: string;
  /** The scheduled listing whose calendar this reads. Null when nothing is scheduled. */
  listingId: string | null;
  acceptingStudents: boolean;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * The next hour this coach is actually free, in the reader's own clock.
 *
 * Client-side rather than baked into the ISR page: a cached "today 20:00" that
 * has already passed is worse than no answer, and this is the one number on the
 * profile that goes stale in minutes.
 */
export function NextSlotCard({
  coachSlug,
  listingId,
  acceptingStudents,
}: Props): React.ReactElement | null {
  const { data, isLoading } = useCoachSlots(coachSlug, listingId);

  if (!listingId || !acceptingStudents) return null;

  const slots = data?.slots ?? [];
  const next = slots[0];
  // Minus the one already named above it, so "3 more" means three more.
  const moreThisWeek = Math.max(
    0,
    slots.filter((slot) => new Date(slot.start).getTime() < Date.now() + WEEK_MS).length - 1
  );

  return (
    <section className="notch bg-hero-fade glow-accent-soft border border-accent bg-surface p-4">
      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-accent">
        {"// Next free slot"}
      </p>

      {isLoading ? (
        <p className="font-mono text-[13px] text-text-muted">Reading their calendar&hellip;</p>
      ) : next ? (
        <>
          <p className="font-mono text-[26px] font-bold leading-none text-text">
            {slotLabel(next.start)}
          </p>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
            in your own timezone &middot; {moreThisWeek} more this week
          </p>
        </>
      ) : (
        <p className="text-[13px] text-text-body">
          No free hours published for the next month. An async review has no calendar at all — if
          they sell one, it runs against a deadline instead.
        </p>
      )}

      {next && (
        <Button asChild size="sm" className="mt-4 w-full">
          <a href="#listings">
            Request a session
            <ArrowRight className="h-4 w-4" aria-hidden />
          </a>
        </Button>
      )}
    </section>
  );
}

/** "Today 20:00" when it is today, otherwise "Fri 21:00". */
function slotLabel(iso: string): string {
  const date = new Date(iso);
  const time = date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  const today = new Date();
  const sameDay =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  if (sameDay) return `Today ${time}`;
  return `${date.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })} ${time}`;
}
