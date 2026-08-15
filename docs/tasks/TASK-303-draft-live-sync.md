# TASK-303: Live synchronisation, ready check and turn clock

Spec: ADR-016, `docs/DRAFT_ROOM.md` §5. Depends on TASK-302.

## Goal

Make the room live. Two browsers, one board, one clock, no socket server.

## Deliverables

`src/hooks/useDraftSync.ts`

- React Query against `GET /api/draft/[code]`, `refetchInterval` chosen by phase:
  `LOBBY` 3000 ms · `IN_PROGRESS` 1000 ms · `COMPLETE` off.
- Pauses on `document.hidden`, resumes and refetches immediately on focus.
- Re-renders only when `version` changes.
- Exposes `lockIn`, `toggleReady`, `undo`, `setWinner`, `setBlueTeam` as
  mutations that **optimistically apply the engine reducer locally** before the
  request lands, and roll back on a `409`. Same reducer as the server — that is
  the whole reason TASK-297 is dependency-free.

`src/domains/draft/components/`

- `ReadyCheck.tsx` — both sides must ready up before step 0. Shows
  "Waiting for Red…", flips to a 3-2-1 countdown once both are ready.
- `TurnClock.tsx` — derives remaining time from `turnStartedAt + timerSeconds`
  with `requestAnimationFrame`. Never polls. Turns amber under 10 s and red under
  5 s, and fires a short tone on your own turn starting (mutable, off by default).
- `UndoButton.tsx` — requests an undo; the other side must confirm within 15 s.
  A drafter cannot silently rewind the board.

## Rules

- The clock is display-only. It never submits an action; expiry is resolved
  server-side on the next read or write (ADR-016 §6), so a client with a slow
  machine cannot lose a turn its opponent still sees as live.
- Optimistic state is discarded, not merged, when the server response arrives.
  The server is always right.
- No Zustand for any of this — it is server state and belongs to React Query
  (CLAUDE.md §2.2).

## Done when

Two browsers driven by Playwright complete a full 20-step draft against a running
dev server: both ready up, alternate turns, the board matches on both sides within
one poll interval, an out-of-turn click is rejected with a visible message, and a
turn left to expire auto-locks identically for both.
`tests/e2e/draft-room.spec.ts` covers that flow.
