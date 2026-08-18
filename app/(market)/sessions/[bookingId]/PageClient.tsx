"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare } from "lucide-react";
import { apiFetch } from "@/lib/api/fetcher";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { useBookingAction } from "@/hooks/useBookings";
import type { BookingAction } from "@/hooks/useBookings";
import type { BookingDetail, BookingEventRow } from "@/domains/marketplace/types";
import { formatMoney } from "@/domains/marketplace/money";
import { BookingActions } from "@/domains/marketplace/components/BookingActions";
import { BookingTimeline } from "@/domains/marketplace/components/BookingTimeline";
import { statusMeta, whenLabel } from "@/domains/marketplace/components/BookingRow";
import { VodReviewPanel } from "@/domains/marketplace/components/VodReviewPanel";
import { LiveSessionPanel } from "@/domains/marketplace/components/LiveSessionPanel";
import { SessionPrepPanel } from "@/domains/marketplace/components/SessionPrepPanel";
import { SpectatePanel } from "@/domains/marketplace/components/SpectatePanel";
import { ReviewPanel } from "@/domains/marketplace/components/ReviewPanel";
import { DisputePanel } from "@/domains/marketplace/components/DisputePanel";
import { SessionProgress } from "@/domains/marketplace/components/sessions/SessionProgress";
import { SessionMoneyPanel } from "@/domains/marketplace/components/sessions/SessionMoneyPanel";
import { HudPanel } from "@/domains/marketplace/components/hud/HudPanel";
import { MarketStat } from "@/domains/marketplace/components/hud/MarketStat";
import { StatusChip } from "@/domains/marketplace/components/hud/StatusChip";
import { CoachPortrait } from "@/domains/marketplace/components/hud/CoachPortrait";

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
      <div className="mx-auto grid max-w-[1240px] gap-4 px-5 pt-7 md:px-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-[1240px] px-5 pt-7 md:px-8">
        <ErrorState message="Could not load this session." onRetry={() => void refetch()} />
      </div>
    );
  }

  const { booking, history } = data;
  const status = statusMeta(booking.status);
  const isStudent = booking.role === "student";
  const other = isStudent ? booking.coachDisplayName : booking.studentName;

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
    <>
      <section className="relative overflow-hidden border-b border-line-1">
        <span
          className="absolute inset-0"
          style={{
            backgroundImage:
              booking.status === "DISPUTED"
                ? "radial-gradient(880px 300px at 15% 0%, rgba(255,90,90,0.14), transparent 70%), var(--bg-hero-fade)"
                : "radial-gradient(880px 300px at 15% 0%, rgba(198,255,61,0.10), transparent 70%), var(--bg-hero-fade)",
          }}
          aria-hidden
        />
        <span className="bg-scanline absolute inset-0" aria-hidden />

        <div className="relative mx-auto max-w-[1240px] px-5 pb-6 pt-7 md:px-8">
          <nav
            className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-text-faint"
            aria-label="Breadcrumb"
          >
            <Link href="/sessions" className="text-text-muted hover:text-accent">
              Sessions
            </Link>{" "}
            / <span className="text-text-body">{booking.listingTitle}</span>
          </nav>

          <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <StatusChip tone={status.tone} pulse={booking.status === "DISPUTED"}>
                  {status.label}
                </StatusChip>
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
                  {deadline(booking)}
                </span>
              </div>
              <h1 className="mt-3.5 font-display text-[28px] font-black uppercase leading-tight tracking-[0.02em] text-text md:text-[34px]">
                {booking.listingTitle}
              </h1>
              <p className="mt-2.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-text-faint">
                {isStudent ? `with ${other}` : `for ${other}`} &middot;{" "}
                {booking.startTime ? whenLabel(booking.startTime) : "no fixed time"}
              </p>
            </div>

            <div className="flex flex-wrap items-end gap-6">
              <MarketStat
                label="Price"
                value={formatMoney(booking.priceCents, booking.currency)}
              />
              {booking.payment && (
                <MarketStat
                  label={moneyLabel(booking)}
                  value={formatMoney(
                    isStudent ? booking.payment.amountCents : booking.payment.coachAmountCents,
                    booking.payment.currency
                  )}
                  tone={booking.payment.status === "RELEASED" ? "accent" : "default"}
                />
              )}
            </div>
          </div>

          <SessionProgress booking={booking} history={history} />
        </div>
      </section>

      <div className="mx-auto max-w-[1240px] px-5 pb-16 pt-6 md:px-8">
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_306px]">
          <div className="grid min-w-0 gap-4">
            {error && (
              <p className="border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                {error}
              </p>
            )}

            <BookingActions booking={booking} pending={act.isPending} onAct={handleAct} />

            <HudPanel label="What the student asked for">
              <p className="max-w-[66ch] whitespace-pre-wrap text-[15px] text-text">
                {booking.studentGoal}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line-1 pt-3.5 font-mono text-[9.5px] uppercase tracking-[0.16em]">
                {booking.matchIds.length > 0 && (
                  <span className="text-text-muted">
                    Matches <span className="text-text">{booking.matchIds.join(", ")}</span>
                  </span>
                )}
                {booking.vodUrl && (
                  <a
                    href={booking.vodUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="break-all text-accent hover:text-acid-400"
                  >
                    VOD &rarr;
                  </a>
                )}
                {booking.matchIds.length === 0 && !booking.vodUrl && (
                  <span className="text-warning">Nothing was attached to this booking</span>
                )}
              </div>
            </HudPanel>

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

            {booking.payment && <SessionMoneyPanel payment={booking.payment} />}
          </div>

          <div className="grid gap-3.5 lg:sticky lg:top-20">
            <HudPanel label="Who you are with" className="bg-hero-fade">
              <div className="flex items-center gap-3">
                <CoachPortrait name={other} size="sm" />
                <div className="min-w-0">
                  <p className="font-display text-[15px] font-extrabold uppercase tracking-[0.03em] text-text">
                    {other}
                  </p>
                  <p className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.12em] text-text-faint">
                    {isStudent ? "Your coach on this session" : "Your student on this session"}
                  </p>
                </div>
              </div>
              <Button asChild size="sm" variant="secondary" className="mt-3.5 w-full">
                <Link href="/messages">
                  <MessageSquare className="h-4 w-4" aria-hidden />
                  Open the thread
                </Link>
              </Button>
            </HudPanel>

            <HudPanel label="History">
              <BookingTimeline history={history} />
              <p className="mt-3 border-t border-line-1 pt-3 font-mono text-[9px] uppercase tracking-[0.12em] text-text-faint">
                Both sides read this the whole time — disputes are settled against it
              </p>
            </HudPanel>
          </div>
        </div>
      </div>
    </>
  );
}

/** The one clock that matters from this status, written out. */
function deadline(booking: BookingDetail): string {
  if (booking.status === "PENDING_COACH") return `Expires ${whenLabel(booking.respondByAt)}`;
  if (booking.status === "DISPUTED") return "Frozen until it is decided";
  if (booking.status === "DELIVERED" && booking.autoCompleteAt) {
    return `Settles on its own ${whenLabel(booking.autoCompleteAt)}`;
  }
  if (booking.status === "COMPLETED") return "Settled";
  if (booking.startTime) return whenLabel(booking.startTime);
  return "No fixed time";
}

function moneyLabel(booking: BookingDetail): string {
  switch (booking.payment?.status) {
    case "RELEASED":
      return booking.role === "coach" ? "Paid out" : "Released";
    case "REFUNDED":
      return "Refunded";
    case "HELD":
      return booking.status === "DISPUTED" ? "Frozen" : "Held";
    default:
      return "Not taken";
  }
}
