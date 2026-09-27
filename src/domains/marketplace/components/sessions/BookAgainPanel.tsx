import Link from "next/link";
import { Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { whenLabel } from "@/domains/marketplace/components/BookingRow";
import type { BookingDetail } from "@/domains/marketplace/types";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * "Book again", for a student whose session has been delivered.
 *
 * Every tutoring platform that keeps students does it by making the next
 * session the default rather than a fresh search. For a scheduled session the
 * same hour next week is offered; the request page drops it quietly if the
 * coach is no longer free then.
 */
export function BookAgainPanel({ booking }: { booking: BookingDetail }): React.ReactElement | null {
  if (booking.role !== "student") return null;
  if (booking.status !== "DELIVERED" && booking.status !== "COMPLETED") return null;
  if (!booking.coachSlug) return null;

  const nextWeek = nextSameSlot(booking.startTime);
  const href = `/coaches/${booking.coachSlug}/book/${booking.listingId}${
    nextWeek ? `?start=${encodeURIComponent(nextWeek)}` : ""
  }`;

  return (
    <section className="notch bg-hero-fade border border-accent/40 bg-surface p-5">
      <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-accent">
        <Repeat className="h-3.5 w-3.5" aria-hidden />
        Keep the momentum
      </p>
      <p className="mt-2 text-[14px] text-text-body">
        Progress comes from the next session, not the first.{" "}
        {nextWeek
          ? `Same time next week is ${whenLabel(nextWeek)}.`
          : `Send ${booking.coachDisplayName} your next games.`}
      </p>
      <Button asChild size="sm" className="mt-3.5 w-full">
        <Link href={href}>Book again with {booking.coachDisplayName}</Link>
      </Button>
    </section>
  );
}

/** The same weekday and hour, as many weeks on as it takes to be in the future. */
function nextSameSlot(startTime: string | null): string | null {
  if (!startTime) return null;
  let t = Date.parse(startTime) + WEEK_MS;
  while (t < Date.now()) t += WEEK_MS;
  return new Date(t).toISOString();
}
