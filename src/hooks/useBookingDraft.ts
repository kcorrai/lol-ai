"use client";

import { useCallback, useEffect, useState } from "react";

/** What a student has filled in on a booking request page, before it is sent. */
export interface BookingDraft {
  start: string | null;
  goal: string;
  riotAccountId: string | null;
  matchIds: string[];
  vodUrl: string;
}

const EMPTY: BookingDraft = {
  start: null,
  goal: "",
  riotAccountId: null,
  matchIds: [],
  vodUrl: "",
};

function keyFor(listingId: string): string {
  return `booking-draft:${listingId}`;
}

/**
 * A booking request's form state, kept in `sessionStorage` across a sign-in.
 *
 * A signed-out student fills the whole request before being asked for an
 * account; the round trip through the login page must not cost them what they
 * wrote. Session storage rather than local: a half-written request from last
 * week reappearing would be stranger than losing it. Every access is guarded —
 * private windows and blocked storage throw, and the page must work without it.
 */
export function useBookingDraft(
  listingId: string,
  initial: Partial<BookingDraft>,
  /** Read on arrival, browser-side; used only when nothing else supplied a goal. */
  fallbackGoal?: () => string
): {
  draft: BookingDraft;
  update: (patch: Partial<BookingDraft>) => void;
  persist: () => void;
  clear: () => void;
} {
  const [draft, setDraft] = useState<BookingDraft>({ ...EMPTY, ...initial });

  useEffect(() => {
    let restored: Partial<BookingDraft> = {};
    try {
      const raw = window.sessionStorage.getItem(keyFor(listingId));
      if (raw) restored = JSON.parse(raw) as Partial<BookingDraft>;
    } catch {
      // No storage, or a draft we cannot read: start from the page's own defaults.
    }
    const fallback = fallbackGoal?.() ?? "";
    setDraft((current) => {
      const merged = { ...current, ...restored };
      return merged.goal || !fallback ? merged : { ...merged, goal: fallback };
    });
    // Once per listing, on arrival. The fallback is a reader, not state to track.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId]);

  const update = useCallback((patch: Partial<BookingDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
  }, []);

  const persist = useCallback(() => {
    try {
      window.sessionStorage.setItem(keyFor(listingId), JSON.stringify(draft));
    } catch {
      // Losing the draft is a nuisance, not an error worth surfacing.
    }
  }, [draft, listingId]);

  const clear = useCallback(() => {
    try {
      window.sessionStorage.removeItem(keyFor(listingId));
    } catch {
      // Nothing to clear.
    }
  }, [listingId]);

  return { draft, update, persist, clear };
}
