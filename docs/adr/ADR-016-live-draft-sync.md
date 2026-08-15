# ADR-016: Real-time synchronisation for the live draft room

## Status: Accepted

## Context

The live draft room (TASK-297 … TASK-306) puts up to twelve people — two drafters,
two teams of spectators, and an optional stream overlay — in front of the same
20-step pick/ban sequence. Every participant must see the same board, the same
turn, and the same countdown. The reference implementation we are matching
(drafter.lol) uses a dedicated WebSocket server.

We cannot copy that shape as-is:

- The app is Next.js 14 App Router on Vercel. There is no long-lived server
  process to hold socket state.
- Postgres is Neon. TASK-282 was opened because read amplification burned through
  the transfer quota; a per-client 1 Hz poll against Postgres would reintroduce
  exactly that failure.
- Upstash Redis is REST-based. Server-side `SUBSCRIBE` is not available, so an SSE
  endpoint would still have to poll something on a timer — the same request volume
  as client polling, but with a 300 s function budget and reconnect handling on top.

## Decision

**Redis-backed read model + client polling + a locally computed clock.**

1. **Postgres is the source of truth.** Every mutation (`ready`, `action`, `undo`,
   `game result`) writes to `draft_games` / `draft_actions` inside a transaction
   that bumps a monotonic `version` column.
2. **Every mutation also writes the full serialised draft state to Redis** under
   `draft:state:<code>`. Reads never touch Postgres on the hot path; a Redis miss
   falls back to Postgres and re-primes the key.
3. **Clients poll `GET /api/draft/[code]`** with an adaptive interval — 1000 ms
   while a draft is in progress, 3000 ms in the lobby, and no polling at all once
   the series is complete. The response is a single JSON document carrying
   `version`; the client only re-renders when `version` changes.
4. **The countdown is never polled.** The server publishes `turnStartedAt` and
   `timerSeconds`; each client derives the remaining time locally with
   `requestAnimationFrame`. The clock is therefore perfectly smooth at 0 network
   cost, and a poll is only needed to learn that the turn *changed*.
5. **The acting client echoes optimistically.** Whoever locks a champion sees it
   land immediately; the other participants see it within one poll interval.
6. **Timeouts are resolved on read, not by a timer.** If `now > turnStartedAt +
   timerSeconds`, the next mutation — or the next read — auto-locks the turn using
   the highest-ranked legal champion. No cron, no background worker, and the
   result is identical for every observer because it is a pure function of stored
   state.

## Consequences

**Good**

- Zero new infrastructure. No socket server, no Pusher/Ably line item, no
  `runtime = "edge"`.
- Postgres reads stay proportional to *writes*, not to viewers — a 10-spectator
  draft costs the same Neon egress as a 0-spectator one.
- The visible latency budget that matters (the countdown) is exact, because it is
  computed from a timestamp rather than transported.
- Reconnects are free: there is no connection to lose. A client that sleeps and
  wakes simply polls once and is current.

**Bad**

- A pick appears to the *other* side up to ~1 s late. Acceptable against a 30 s
  turn; it would not be acceptable for anything reflex-based.
- Polling continues while a background tab is open. Mitigated by pausing on
  `document.hidden` and by stopping entirely once the series completes.
- Upstash request volume scales with viewers. At 1 Hz × 12 viewers × 20 turns a
  full Bo5 costs roughly 7 000 Redis reads — inside the free tier, but it is the
  number to watch if the feature gets popular.

**Revisit when**

Concurrent drafts exceed ~50, or a stream overlay needs sub-250 ms updates. The
migration path is additive: keep the read model exactly as it is and put an SSE
endpoint in front of it, so only the transport changes.
