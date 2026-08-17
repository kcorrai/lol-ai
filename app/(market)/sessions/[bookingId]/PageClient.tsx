"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBookingAction } from "@/hooks/useBookings";
import type { BookingAction } from "@/hooks/useBookings";
import type { BookingDetail, BookingEventRow } from "@/domains/marketplace/types";
import { BookingActions } from "@/domains/marketplace/components/BookingActions";
import { BookingTimeline } from "@/domains/marketplace/components/BookingTimeline";
import { StatusBadge, whenLabel } from "@/domains/marketplace/components/BookingRow";
import { VodReviewPanel } from "@/domains/marketplace/components/VodReviewPanel";
import { LiveSessionPanel } from "@/domains/marketplace/components/LiveSessionPanel";
import { SessionPrepPanel } from "@/domains/marketplace/components/SessionPrepPanel";
import { SpectatePanel } from "@/domains/marketplace/components/SpectatePanel";
import { ReviewPanel } from "@/domains/marketplace/components/ReviewPanel";
import { DisputePanel } from "@/domains/marketplace/components/DisputePanel";
import type { BookingPaymentView } from "@/domains/marketplace/types";

interface Data {
  booking: BookingDetail;
  history: BookingEventRow[];
}

export default function SessionPage({ bookingId }: { bookingId: string }): React.ReactElement {
  const { data, isLoading, isError, refetch } = useQuery<Data>({
    queryKey: ["marketplace", "booking", bookingId],
    queryFn: () => apiFetch<Data>(`/api/bookings/${bookingId}`),
    staleTime: 10_000,
  });
  const act = useBookingAction();
  const [error, setError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <ErrorState message="Could not load this session." onRetry={() => void refetch()} />
      </div>
    );
  }

  const { booking, history } = data;

  function handleAct(body: BookingAction): void {
    setError(null);
    act.mutate(
      { bookingId, ...body },
      {
        onSuccess: () => void refetch(),
        onError: (err) => setError(err instanceof Error ? err.message : "That did not work."),
      }
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-display text-2xl font-bold text-text">{booking.listingTitle}</h1>
          <StatusBadge status={booking.status} />
        </div>
        <p className="mt-1 text-sm text-text-muted">
          {booking.role === "student"
            ? `with ${booking.coachDisplayName}`
            : `for ${booking.studentName}`}
          {booking.startTime ? ` · ${whenLabel(booking.startTime)}` : " · no fixed time"}
        </p>
      </div>

      {error && (
        <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <BookingActions booking={booking} pending={act.isPending} onAct={handleAct} />

      <Card>
        <CardHeader>
          <CardTitle>What the student asked for</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="whitespace-pre-wrap text-sm text-text-body">{booking.studentGoal}</p>

          {booking.matchIds.length > 0 && (
            <p className="font-mono text-xs text-text-muted">
              Matches: {booking.matchIds.join(", ")}
            </p>
          )}

          {booking.vodUrl && (
            <p className="break-all font-mono text-xs text-text-muted">VOD: {booking.vodUrl}</p>
          )}
        </CardContent>
      </Card>

      {booking.role === "coach" && <SessionPrepPanel bookingId={bookingId} />}

      {booking.kind === "LIVE_SPECTATE" && booking.role === "coach" && (
        <SpectatePanel bookingId={bookingId} />
      )}

      {booking.kind !== "VOD_REVIEW" && (
        <LiveSessionPanel booking={booking} pending={act.isPending} onAct={handleAct} />
      )}

      {booking.kind === "VOD_REVIEW" && (
        <VodReviewPanel booking={booking} onDelivered={() => void refetch()} />
      )}

      <ReviewPanel booking={booking} onDone={() => void refetch()} />

      <DisputePanel booking={booking} onOpened={() => void refetch()} />

      {booking.payment && (
        <Card>
          <CardHeader>
            <CardTitle>Money</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="text-text">
              {money(booking.payment.amountCents, booking.payment.currency)}
              <span className="ml-2 text-text-muted">
                — coach {money(booking.payment.coachAmountCents, booking.payment.currency)}, platform{" "}
                {money(booking.payment.platformFeeCents, booking.payment.currency)}
              </span>
            </p>
            <p className="text-xs text-text-muted">{paymentLine(booking.payment)}</p>
            {booking.payment.provider === "manual" && (
              <p className="text-xs text-warning">
                No payment provider is connected yet, so nothing has actually been charged or paid
                out. The ledger records what would have moved.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent>
          <BookingTimeline history={history} />
        </CardContent>
      </Card>
    </div>
  );
}

function money(cents: number, currency: string): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(cents / 100);
}

function paymentLine(payment: BookingPaymentView): string {
  switch (payment.status) {
    case "HELD":
      return "Held until the session is settled.";
    case "RELEASED":
      return "Released to the coach.";
    case "REFUNDED":
      return "Returned to the student.";
    case "FAILED":
      return "The payment failed.";
    default:
      return "Not taken yet.";
  }
}
