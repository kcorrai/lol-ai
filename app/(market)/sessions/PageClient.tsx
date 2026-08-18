"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { useBookings } from "@/hooks/useBookings";
import type { BookingSide } from "@/hooks/useBookings";
import type { BookingSummary } from "@/domains/marketplace/types";
import { holdsFunds } from "@/domains/marketplace/transitions";
import { formatMoney } from "@/domains/marketplace/money";
import { BookingRow, statusMeta, whenLabel } from "@/domains/marketplace/components/BookingRow";
import { SessionsRail } from "@/domains/marketplace/components/sessions/SessionsRail";
import { MarketStat } from "@/domains/marketplace/components/hud/MarketStat";
import { HudRule } from "@/domains/marketplace/components/hud/HudRule";
import { StatusChip } from "@/domains/marketplace/components/hud/StatusChip";

/**
 * Both sides of the same list.
 *
 * A coach is nearly always a student too, so this is one page with a switch
 * rather than two pages that would each be half empty. What needs an answer is
 * lifted out of the ledger and put above it — a session nobody notices is the
 * failure mode this whole product is arguing against.
 */
export default function SessionsPage(): React.ReactElement {
  const [side, setSide] = useState<BookingSide>("student");
  const [filter, setFilter] = useState<string>("All");
  const { data, isLoading, isError, refetch } = useBookings(side);

  const bookings = data?.bookings ?? [];
  const states = ["All", ...new Set(bookings.map((b) => statusMeta(b.status).label))];
  const shown = bookings.filter((b) => filter === "All" || statusMeta(b.status).label === filter);

  const urgent = shown.filter((b) => needsYou(b, side));
  const rest = shown.filter((b) => !needsYou(b, side));
  const held = bookings
    .filter((b) => holdsFunds(b.status))
    .reduce((total, b) => total + b.priceCents, 0);

  return (
    <div className="mx-auto max-w-[1240px] px-5 pb-16 pt-7 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="font-display text-[32px] font-black uppercase leading-none tracking-[0.02em] text-text md:text-[38px]">
            Sessions
          </h1>
          <p className="mt-3 max-w-[58ch] text-[15px] text-text-body">
            Everything you have booked, and everything booked with you.
          </p>
        </div>
        <div className="flex gap-6 pb-1">
          <MarketStat
            label="Needs you"
            value={String(bookings.filter((b) => needsYou(b, side)).length)}
            tone={urgent.length > 0 ? "warn" : "default"}
          />
          <MarketStat
            label="Upcoming"
            value={String(bookings.filter((b) => b.status === "CONFIRMED").length)}
          />
          <MarketStat
            label="Held"
            value={formatMoney(held, bookings[0]?.currency ?? "USD")}
            tone="accent"
          />
        </div>
      </div>

      <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="grid min-w-0 gap-4">
          <section className="notch grid gap-3 border border-border bg-surface p-4">
            <div className="flex flex-wrap items-center gap-3.5">
              <div className="flex gap-1.5">
                {(["student", "coach"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setSide(value);
                      setFilter("All");
                    }}
                    className={cn(
                      "tag-cut border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors",
                      side === value
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-line-2 text-text-muted hover:text-text"
                    )}
                  >
                    {value === "student" ? "Booked by me" : "Booked with me"}
                  </button>
                ))}
              </div>
              <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.14em] text-text-faint">
                {side === "student" ? "Sessions you paid for" : "Sessions students booked with you"}
              </span>
            </div>

            {bookings.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto border-t border-line-1 pt-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <span className="mr-1 shrink-0 font-mono text-[9.5px] uppercase tracking-[0.18em] text-text-muted">
                  State
                </span>
                {states.map((state) => (
                  <button
                    key={state}
                    type="button"
                    onClick={() => setFilter(state)}
                    className={cn(
                      "tag-cut shrink-0 border px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.14em] transition-colors",
                      filter === state
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-line-2 text-text-muted hover:text-text"
                    )}
                  >
                    {state}
                  </button>
                ))}
                <span className="ml-auto shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
                  {shown.length} {shown.length === 1 ? "session" : "sessions"}
                </span>
              </div>
            )}
          </section>

          {isLoading && <Skeleton className="h-40 w-full" />}
          {isError && (
            <ErrorState message="Could not load your sessions." onRetry={() => void refetch()} />
          )}

          {urgent.length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-3">
                <span className="h-[7px] w-[7px] animate-pulse bg-warning" aria-hidden />
                <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-warning">
                  {"// Needs something from you"}
                </span>
                <span className="h-px flex-1 bg-line-1" aria-hidden />
              </div>
              <div className="grid gap-3">
                {urgent.map((booking) => (
                  <UrgentCard key={booking.id} booking={booking} side={side} />
                ))}
              </div>
            </section>
          )}

          {data !== undefined && bookings.length === 0 ? (
            <section className="notch border border-border bg-surface px-7 py-14 text-center">
              <span
                className="notch-sm mb-4 inline-flex h-[50px] w-[50px] items-center justify-center border border-line-2 text-text-muted"
                aria-hidden
              >
                <CalendarOff className="h-[22px] w-[22px]" />
              </span>
              <p className="font-display text-[22px] font-extrabold uppercase tracking-[0.03em] text-text">
                {side === "student" ? "Nothing booked yet" : "Nobody has booked you yet"}
              </p>
              <p className="mx-auto mt-3 max-w-[46ch] text-[14.5px] text-text-body">
                {side === "student"
                  ? "Find a coach whose rank we have checked, and ask them for a session."
                  : "Put a listing on sale and open a few hours — students cannot book you without both."}
              </p>
              <Button asChild className="mt-5">
                <Link href={side === "student" ? "/coaches" : "/coach/listings"}>
                  {side === "student" ? "Find a coach" : "Add a listing"}
                </Link>
              </Button>
            </section>
          ) : (
            rest.length > 0 && (
              <section>
                <HudRule label={urgent.length > 0 ? "Everything else" : "All sessions"} />
                <div className="notch overflow-hidden border border-border bg-surface">
                  {rest.map((booking) => (
                    <BookingRow key={booking.id} booking={booking} side={side} />
                  ))}
                </div>
              </section>
            )
          )}
        </div>

        <div className="lg:sticky lg:top-20">
          <SessionsRail bookings={bookings} side={side} />
        </div>
      </div>
    </div>
  );
}

/**
 * Whether this row is waiting on the person reading it.
 *
 * Deliberately narrow: a disputed booking is upsetting but there is nothing to
 * do about it from here, and putting it in the urgent block would teach people
 * to ignore the urgent block.
 */
function needsYou(booking: BookingSummary, side: "student" | "coach"): boolean {
  if (side === "coach") return booking.status === "PENDING_COACH";
  return booking.status === "DELIVERED";
}

function UrgentCard({
  booking,
  side,
}: {
  booking: BookingSummary;
  side: "student" | "coach";
}): React.ReactElement {
  const { label, tone } = statusMeta(booking.status);
  const ask =
    side === "coach"
      ? `Answer by ${whenLabel(booking.respondByAt)}, or it expires on its own`
      : "Confirm it happened, or challenge it — it settles by itself either way";

  return (
    <Link
      href={`/sessions/${booking.id}`}
      className="notch block border border-warning bg-surface shadow-[0_0_24px_rgba(255,194,75,0.09)] transition-colors hover:bg-surface-2"
    >
      <div className="grid items-center gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <StatusChip tone={tone}>{label}</StatusChip>
            <span className="font-display text-base font-extrabold uppercase tracking-[0.03em] text-text">
              {booking.listingTitle}
            </span>
          </div>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-text-faint">
            {side === "student" ? `with ${booking.coachDisplayName}` : `for ${booking.studentName}`}{" "}
            &middot; {booking.startTime ? whenLabel(booking.startTime) : "no fixed time"}
          </p>
          <p className="mt-2.5 text-[13.5px] text-warning">{ask}</p>
        </div>
        <div className="text-right">
          <span className="block font-mono text-xl font-bold text-text">
            {formatMoney(booking.priceCents, booking.currency)}
          </span>
          <span className="mt-1.5 block font-mono text-[9px] uppercase tracking-[0.16em] text-text-faint">
            held
          </span>
        </div>
      </div>
    </Link>
  );
}
