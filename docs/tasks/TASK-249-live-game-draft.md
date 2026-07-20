# TASK-249 — Live game prefills the draft analyzer

## Question asked
9.png: can the draft analyzer detect the game the player is in and analyze it on a button press?

## Answer: half of it, server-side, today
Two different Riot surfaces were conflated in the original question:

- **Champion select** — not reachable. The LCU API that exposes picks and bans runs on the
  player's own machine. ADR-005 researched this in depth and deferred it to a companion app; that
  conclusion stands.
- **A game already started** — reachable. `GET /lol/spectator/v5/active-games/by-summoner/{puuid}`
  returns both teams' champions from our server on the existing key. Probed before building: it
  answers **404** when the player is idle, not 403, so the endpoint is authorised.

So this ships the post-lock half, which is most of the practical value: the player gets a comp
read as the loading screen appears rather than typing ten champions in by hand.

## Change
- `getActiveGame` in `riotApiClient.ts` — Riot signals "not in a game" by 404, which the shared
  client throws as `RIOT_NOT_FOUND`; the absence of a game therefore arrives as an exception and
  is translated back to `null`. 404 isn't in `RETRYABLE_STATUSES`, so this costs one call.
- `liveDraft.ts` (new, pure) — `assignLanes`. **The Spectator API reports no lanes**, so they are
  inferred: Smite settles the jungle, then each champion takes its most-played lane, ordered by
  how concentrated it is there. Weighting by concentration rather than counting lanes matters —
  otherwise a 95/5 mid/top champion and a 50/50 flex pick look equally confident and the result
  depends on participant order.
- `liveGameService.ts` (new) — resolves the account, calls spectator, builds the lane-frequency
  and championId→key maps from the meta snapshot.
- `app/api/riot/live-game/route.ts` — 30 requests / 10 min. Tight on purpose: the key is a
  rate-limited dev key, so this is button-press only, never polled.
- `LiveGameButton.tsx` — gated on `useSession`, because the tools layout only mounts QueryProvider
  for signed-in visitors (TASK-237) and the inner component uses React Query. Gating client-side
  rather than on a server session also keeps the page prerenderable (TASK-238). It navigates with
  the existing `?blue=&red=` params the draft form already reads, so nothing about the analyzer
  itself changed.
- `docs/adr/ADR-005-live-client-api.md` — addendum recording what became possible and what didn't.
- `docs/API_DESIGN.md` — endpoint documented.

## Presented as a guess, because it is one
The button's confirmation says the lanes are a best guess and to correct any that are wrong. The
inference is good, not authoritative, and the UI shouldn't imply otherwise.

## Tests
`liveDraft.test.ts` — Smite outranks a 100%-mid champion, Smite read in either spell slot, a full
ten-player game fills both teams, a contested lane goes to the more concentrated champion, the
result is independent of participant order, a champion with no snapshot data still gets seated, an
unnameable champion id leaves its slot empty, and an empty game returns empty teams.

## Verification — and what is not verified
Confirmed live: the endpoint returns `200 {"inGame": false}` for an account not in a game (the
Riot 404 is translated, not surfaced); the button renders for a user with a connected account,
stays hidden for a signed-in user without one, and is absent with no React errors for anonymous
visitors.

**The in-game path has not been exercised end to end** — that needs an actual live match. The lane
inference is covered by unit tests, but the spectator response has never been parsed against real
data, so the first real game should be treated as the true test.

refs TASK-249
