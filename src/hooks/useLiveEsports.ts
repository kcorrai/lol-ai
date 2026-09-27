"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import type { EsportsEvent, GameStats, GameTimeline } from "@/domains/esports";

const POLL_MS = 30_000;
/** The walk samples a game every four minutes, so the curve cannot move faster. */
const TIMELINE_POLL_MS = 4 * 60_000;

interface LiveEventsResponse {
  events: EsportsEvent[];
}

interface LiveGameResponse {
  game: GameStats | null;
}

interface LiveTimelineResponse {
  timeline: GameTimeline | null;
}

/**
 * Live matches, polled only while something is live.
 *
 * When the payload comes back empty the interval turns off, so an off-season
 * visitor makes exactly one request and then nothing. React Query already
 * pauses refetching for a hidden tab, so a backgrounded page stops too.
 */
export function useLiveEsports(initialEvents: EsportsEvent[] = []) {
  return useQuery<LiveEventsResponse>({
    queryKey: ["esports-live"],
    queryFn: () => apiFetch<LiveEventsResponse>("/api/esports/live"),
    initialData: initialEvents.length > 0 ? { events: initialEvents } : undefined,
    refetchInterval: (query) => ((query.state.data?.events.length ?? 0) > 0 ? POLL_MS : false),
    // A failed poll must not blank a scoreboard that is still on screen.
    placeholderData: (previous) => previous,
  });
}

/**
 * One live game's scoreboard. Stops polling as soon as the feed reports the
 * game finished — the final state is then served by the match page's own
 * month-long cache rather than by continued polling.
 */
export function useLiveGame(gameId: string | null, enabled = true) {
  return useQuery<LiveGameResponse>({
    queryKey: ["esports-live-game", gameId],
    queryFn: () => apiFetch<LiveGameResponse>(`/api/esports/live?gameId=${gameId}`),
    enabled: enabled && Boolean(gameId),
    refetchInterval: (query) => (query.state.data?.game?.finished === false ? POLL_MS : false),
    placeholderData: (previous) => previous,
  });
}

/**
 * A live game's gold curve. Polled once per sampling window rather than with
 * the scoreboard: each poll re-walks the game, and between windows it would
 * only return the same samples again. Turned off once the game is finished.
 */
export function useLiveTimeline(
  gameId: string | null,
  initial: GameTimeline | null,
  enabled = true
) {
  return useQuery<LiveTimelineResponse>({
    queryKey: ["esports-live-timeline", gameId],
    queryFn: () => apiFetch<LiveTimelineResponse>(`/api/esports/live?gameId=${gameId}&timeline=1`),
    enabled: enabled && Boolean(gameId),
    initialData: initial ? { timeline: initial } : undefined,
    // The page's own copy can be up to an hour old, so the first poll is not
    // held back for a full window.
    initialDataUpdatedAt: 0,
    refetchInterval: enabled ? TIMELINE_POLL_MS : false,
    placeholderData: (previous) => previous,
  });
}
