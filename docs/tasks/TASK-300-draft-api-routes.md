# TASK-300: Public draft API routes

Spec: `docs/DRAFT_ROOM.md` §6. Depends on TASK-299.

## Goal

Expose the draft service over HTTP. These are the first genuinely public write
endpoints in the app, so the rate limiting and the payload validation matter more
than usual.

## Deliverables

| Route | Method | Body | Returns |
|---|---|---|---|
| `/api/draft` | POST | create input | `{ code, blueToken, redToken }` |
| `/api/draft/[code]` | GET | — | full state for the viewer's role |
| `/api/draft/[code]/ready` | POST | `{ token, gameNumber, ready }` | new state |
| `/api/draft/[code]/action` | POST | `{ token, gameNumber, championKey }` | new state |
| `/api/draft/[code]/undo` | POST | `{ token, gameNumber }` | new state |
| `/api/draft/[code]/result` | POST | `{ token, gameNumber, winnerSide }` | new state |
| `/api/draft/[code]/side` | POST | `{ token, gameNumber, blueTeam }` | new state |

## Rules

- Every handler: parse with Zod → rate limit → delegate to
  `draftSeriesService` → respond. No business logic in the handler, and no
  handler over 80 lines (CLAUDE.md §3.3).
- Rate limits per IP: create `5 / 10 min`; mutations `60 / min`; `GET` `240 / min`
  (a 1 Hz poll plus headroom, per ADR-016).
- **`GET` must never leak the opposite side's token.** The response carries the
  viewer's own role only, resolved from the `token` query parameter.
- A rejected action returns `409` with the engine's `reason` string so the UI can
  show a real message rather than "something went wrong".
- A version conflict returns `409` too; the client resolves it by re-reading.
- `Cache-Control: no-store` on every draft response — the whole point is freshness.

## Done when

`app/api/draft/**/route.test.ts` covers: create validation failures, unknown code
→ 404, wrong token → 403, out-of-turn action → 409, happy-path lock → 200 with a
bumped `version`, and rate-limit exhaustion → 429. `docs/API_DESIGN.md` documents
all seven endpoints.
