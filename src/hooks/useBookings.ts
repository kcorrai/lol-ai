"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { apiFetch } from "@/lib/api/fetcher";
import type { BookingSummary, Slot } from "@/domains/marketplace";

const KEY = ["marketplace", "bookings"];

export type BookingSide = "student" | "coach";

export function useBookings(side: BookingSide) {
  const { status } = useSession();
  return useQuery<{ bookings: BookingSummary[] }>({
    queryKey: [...KEY, side],
    queryFn: () => apiFetch<{ bookings: BookingSummary[] }>(`/api/bookings?as=${side}`),
    enabled: status === "authenticated",
    staleTime: 15_000,
  });
}

/**
 * The slots a listing can be booked into.
 *
 * Short `staleTime` on purpose: a slot list is only true until somebody books,
 * and a stale one sends a student into a 409 they cannot do anything about.
 */
export function useCoachSlots(slug: string, listingId: string | null) {
  return useQuery<{ slots: Slot[]; timeZone: string; durationMinutes: number }>({
    queryKey: ["marketplace", "slots", slug, listingId],
    queryFn: () =>
      apiFetch(`/api/coaches/${slug}/slots?listingId=${listingId as string}`),
    enabled: Boolean(listingId),
    staleTime: 10_000,
  });
}

export interface CreateBookingInput {
  listingId: string;
  startTime: string | null;
  studentGoal: string;
  studentTimezone: string;
  riotAccountId?: string | null;
  matchIds?: string[];
  vodUrl?: string | null;
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBookingInput) =>
      apiFetch<{ bookingId: string }>("/api/bookings", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
      // The slot that was just taken has to disappear for everyone looking at
      // this coach, not only for whoever booked it.
      void qc.invalidateQueries({ queryKey: ["marketplace", "slots"] });
    },
  });
}

export type BookingAction =
  | { action: "accept"; meetingUrl?: string | null }
  | { action: "decline"; reason: string }
  | { action: "cancel"; reason: string }
  | { action: "deliver" }
  | { action: "confirm" }
  | { action: "meeting"; meetingUrl: string | null };

export function useBookingAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, ...body }: BookingAction & { bookingId: string }) =>
      apiFetch<{ action: string }>(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
      void qc.invalidateQueries({ queryKey: ["marketplace", "slots"] });
    },
  });
}
