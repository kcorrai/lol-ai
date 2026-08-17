"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { useBookings } from "@/hooks/useBookings";
import type { BookingSide } from "@/hooks/useBookings";
import { BookingRow } from "@/domains/marketplace/components/BookingRow";

/**
 * Both sides of the same list.
 *
 * A coach is nearly always a student too, so this is one page with a switch
 * rather than two pages that would each be half empty.
 */
export default function SessionsPage(): React.ReactElement {
  const [side, setSide] = useState<BookingSide>("student");
  const { data, isLoading, isError, refetch } = useBookings(side);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-text">Sessions</h1>
        <p className="mt-1 text-sm text-text-muted">
          Everything you have booked, and everything booked with you.
        </p>
      </div>

      <nav className="flex gap-2">
        {(["student", "coach"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setSide(value)}
            className={cn(
              "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
              side === value
                ? "border-accent bg-accent/15 text-accent"
                : "border-border bg-surface-2 text-text-muted hover:text-text"
            )}
          >
            {value === "student" ? "Booked by me" : "Booked with me"}
          </button>
        ))}
      </nav>

      {isLoading && <Skeleton className="h-40 w-full" />}

      {isError && <ErrorState message="Could not load your sessions." onRetry={() => void refetch()} />}

      {data !== undefined && data.bookings.length === 0 && (
        <EmptyState
          title={side === "student" ? "Nothing booked yet" : "Nobody has booked you yet"}
          description={
            side === "student"
              ? "Find a coach whose rank we have checked, and ask them for a session."
              : "Once your profile is live with a listing and some hours, requests land here."
          }
          action={
            side === "student" ? (
              <Link
                href="/coaches"
                className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-background"
              >
                Find a coach
              </Link>
            ) : undefined
          }
        />
      )}

      <div className="space-y-3">
        {data?.bookings.map((booking) => (
          <BookingRow key={booking.id} booking={booking} side={side} />
        ))}
      </div>
    </div>
  );
}
