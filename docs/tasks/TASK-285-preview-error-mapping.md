# TASK-285: Map preview errors by ApiError code, not message substring

## Status: Done

## Context

Production returned `500 "Server error occurred."` for a valid Riot ID
(`kaanproak0#TR1`, tr1). Runtime logs showed the underlying cause was
`Invalid or missing Riot API key` — an expired `RIOT_API_KEY` in the Vercel
production environment (Riot development keys expire every 24h).

Investigating that surfaced two code defects that turn _every_ recoverable
failure into an opaque 500:

1. **`app/api/public/preview/route.ts` classifies errors by message substring.**
   `normalizeRiotError` (`src/lib/riot/errors.ts`) puts the machine-readable
   value on `ApiError.code` and a human sentence on `.message`. The route
   matches against `.message`, so no branch ever fires:

   | Riot status | Actual `.message`                 | Route looks for              | Match |
   | ----------- | --------------------------------- | ---------------------------- | ----- |
   | 401         | `Invalid or missing Riot API key` | `401` / `RIOT_UNAUTHORIZED`  | no    |
   | 404         | `Resource not found on Riot API`  | `Not Found` (case-sensitive) | no    |
   | 429         | `Riot API rate limit exceeded`    | `429` / `RIOT_RATE_LIMITED`  | no    |

   A user who typos their Riot ID gets "Server error occurred." instead of
   "not found".

2. **`src/domains/riot/services/previewService.ts:96` awaits `setCached`
   unguarded.** The cache _read_ is wrapped in try/catch, the _write_ is not.
   The preview payload is fully built by that point, so a Neon outage discards
   completed work and fails the request. Neon was in fact unreachable in the
   same logs, making this a live second failure mode.

## Decision

- Classify on `err instanceof ApiError` + `err.code`. Drop substring matching.
- Wrap the `setCached` call so a cache-write failure is logged and ignored.

## Consequences

- Riot 404/429/401/403 now reach the client as 404/503/503 with actionable copy.
- The preview endpoint keeps serving while Neon is down (read _and_ write paths).
- Neither change repairs the expired `RIOT_API_KEY` — that is an env rotation in
  Vercel, tracked separately.

## Out of scope

- Rotating `RIOT_API_KEY` / moving to a permanent production key.
- Restoring the Neon instance (quota — see TASK-282).
